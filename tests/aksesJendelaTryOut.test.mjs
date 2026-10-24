// tests/aksesJendelaTryOut.test.mjs
// ============================================================
// Test kebijakan akses jendela waktu try out (utils/aksesJendelaTryOut.js).
//
//     node tests/aksesJendelaTryOut.test.mjs
//
// KENAPA INI PENTING (audit 2026-10-24): keputusan "boleh mulai / belum
// dibuka / lewat deadline" sebelumnya tertulis inline di TryOutView.jsx
// tanpa uji, dan dua sifatnya tidak pernah dinyatakan: deadline adalah
// BATAS MULAI (sesi berjalan boleh selesai), dan semua pemeriksaan memakai
// jam perangkat siswa. Berkas ini memaku kebijakan itu supaya perubahan
// sepihak di masa depan terlihat merah di CI.
// ============================================================

import assert from 'node:assert/strict';
import {
  putuskanAksesJendela, kalibrasiOffsetWaktuServer, durasiRencanaMs, peringatanJendelaVsDurasi,
} from '../src/utils/aksesJendelaTryOut.js';

let lulus = 0, gagal = 0;
function uji(nama, fn) {
  try { fn(); lulus += 1; console.log('ok ' + lulus + ' - ' + nama); }
  catch (e) { gagal += 1; console.log('not ok ' + (lulus + gagal) + ' - ' + nama); console.log('  ' + e.message); }
}

const BUKA = 1000000;
const TUTUP = 2000000;

// ------------------------------------------------------------
// 1. Matriks kebijakan
// ------------------------------------------------------------
uji('di dalam jendela, tanpa sesi -> mulai', () => {
  const r = putuskanAksesJendela({ sekarangMs: 1500000, waktuBukaMs: BUKA, waktuTutupMs: TUTUP });
  assert.equal(r.aksi, 'mulai');
});
uji('sebelum buka, tanpa sesi -> belum-dibuka (tanpa pengecualian)', () => {
  const r = putuskanAksesJendela({ sekarangMs: BUKA - 1, waktuBukaMs: BUKA, waktuTutupMs: TUTUP, izinBerlaku: true });
  assert.equal(r.aksi, 'belum-dibuka');
});
uji('lewat deadline, tanpa sesi, tanpa izin -> lewat-deadline', () => {
  const r = putuskanAksesJendela({ sekarangMs: TUTUP + 1, waktuBukaMs: BUKA, waktuTutupMs: TUTUP });
  assert.equal(r.aksi, 'lewat-deadline');
});
uji('lewat deadline + izin ulang berlaku -> mulai', () => {
  const r = putuskanAksesJendela({ sekarangMs: TUTUP + 1, waktuBukaMs: BUKA, waktuTutupMs: TUTUP, izinBerlaku: true });
  assert.equal(r.aksi, 'mulai');
});
uji('KEBIJAKAN INTI: sesi berjalan boleh lanjut walau lewat deadline', () => {
  const r = putuskanAksesJendela({ adaSesiBerjalan: true, sekarangMs: TUTUP + 99999, waktuBukaMs: BUKA, waktuTutupMs: TUTUP });
  assert.equal(r.aksi, 'lanjut');
  assert.match(r.alasan, /batas MULAI/);
});
uji('waktu buka/tutup null = sisi itu tidak membatasi', () => {
  assert.equal(putuskanAksesJendela({ sekarangMs: 1, waktuBukaMs: null, waktuTutupMs: null }).aksi, 'mulai');
  assert.equal(putuskanAksesJendela({ sekarangMs: 9e15, waktuBukaMs: null, waktuTutupMs: null }).aksi, 'mulai');
});
uji('tepat di batas: buka inklusif, tutup eksklusif untuk mulai baru', () => {
  assert.equal(putuskanAksesJendela({ sekarangMs: BUKA, waktuBukaMs: BUKA, waktuTutupMs: TUTUP }).aksi, 'mulai');
  assert.equal(putuskanAksesJendela({ sekarangMs: TUTUP, waktuBukaMs: BUKA, waktuTutupMs: TUTUP }).aksi, 'mulai');
  assert.equal(putuskanAksesJendela({ sekarangMs: TUTUP + 0.5, waktuBukaMs: BUKA, waktuTutupMs: TUTUP }).aksi, 'lewat-deadline');
});

// ------------------------------------------------------------
// 2. Kalibrasi jam dari header Date server
// ------------------------------------------------------------
uji('offset = waktu server - waktu klien', () => {
  const server = Date.parse('Thu, 24 Oct 2026 05:00:00 GMT');
  assert.equal(kalibrasiOffsetWaktuServer('Thu, 24 Oct 2026 05:00:00 GMT', server - 5000), 5000);
  assert.equal(kalibrasiOffsetWaktuServer('Thu, 24 Oct 2026 05:00:00 GMT', server + 5000), -5000);
});
uji('header rusak/absen -> offset 0 (perilaku lama, tidak menghalangi)', () => {
  assert.equal(kalibrasiOffsetWaktuServer(null, 123), 0);
  assert.equal(kalibrasiOffsetWaktuServer('bukan tanggal', 123), 0);
  assert.equal(kalibrasiOffsetWaktuServer('Thu, 24 Oct 2026 05:00:00 GMT', NaN), 0);
});

// ------------------------------------------------------------
// 3. Durasi rencana & peringatan jendela-vs-durasi
// ------------------------------------------------------------
uji('durasi rencana mode total & per-subtes', () => {
  assert.equal(durasiRencanaMs({ modeTimer: 'total', durasiTotalMenit: 90 }), 90 * 60000);
  assert.equal(durasiRencanaMs({ modeTimer: 'per-subtes', subtes: [{ durasiMenit: 30 }, { durasiMenit: 45 }] }), 75 * 60000);
  assert.equal(durasiRencanaMs({ modeTimer: 'per-subtes', subtes: [] }), null);
  assert.equal(durasiRencanaMs(null), null);
});
uji('peringatan muncul bila jendela lebih pendek dari durasi', () => {
  const p = peringatanJendelaVsDurasi({ waktuBukaMs: 0, waktuTutupMs: 60 * 60000, durasiMs: 90 * 60000 });
  assert.match(p, /LEBIH PENDEK/);
  assert.match(p, /BATAS MULAI/);
});
uji('tidak ada peringatan bila jendela cukup atau jadwal tidak lengkap', () => {
  assert.equal(peringatanJendelaVsDurasi({ waktuBukaMs: 0, waktuTutupMs: 120 * 60000, durasiMs: 90 * 60000 }), null);
  assert.equal(peringatanJendelaVsDurasi({ waktuBukaMs: null, waktuTutupMs: 60000, durasiMs: 90 * 60000 }), null);
});
uji('tutup mendahului buka dilaporkan sebagai kesalahan jadwal', () => {
  assert.match(peringatanJendelaVsDurasi({ waktuBukaMs: 5000, waktuTutupMs: 1000, durasiMs: 60000 }), /mendahului/);
});

console.log('');
console.log(`# aksesJendelaTryOut: ${lulus} lulus, ${gagal} gagal`);
if (gagal > 0) process.exit(1);
