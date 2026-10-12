// src/utils/aliasMapel.js
// ============================================================
// Pemetaan NAMA mapel -> KODE, dipakai mesin try out otomatis mencocokkan
// soal ke komposisi template, dan dipakai notifications.js menentukan
// audiens notifikasi per mapel.
//
// 🔥 DIPISAH DARI mesinTryOutOtomatis.js (2026-10-10): berkas itu mengimpor
// Firestore, sehingga kodeMapel TIDAK BISA diuji di Node polos -- padahal
// justru fungsi ini yang menentukan soal masuk ke komposisi yang mana.
// Memindahkannya ke util murni mengikuti pola repo: logika yang bisa salah
// hidup terpisah dan punya test (tests/mapelUtbk.test.mjs).
//
// ⚠️ URUTAN ADALAH PERILAKU. Entri dicocokkan berurutan dan yang pertama
// menang. Entri UTBK wajib DI DEPAN karena namanya mengandung nama mapel
// kurikulum: 'Literasi/Bahasa Indonesia' mengandung 'bahasa indonesia',
// 'Literasi/Penalaran Matematika' mengandung 'matematika'. Kalau alias
// kurikulum didahulukan, komposisi try out UTBK akan menarik soal kurikulum
// yang karakternya berbeda.
// ============================================================

import { MAPEL_UTBK } from './mesinTaksonomiSoal.js';

const norm = (s) => String(s || '').toLowerCase().trim();

const ALIAS_MAPEL = [
  // Entri UTBK lebih dulu -- lihat catatan kepala berkas.
  ...MAPEL_UTBK.map((m) => ({ kode: m.kode, keys: [m.nama.toLowerCase(), ...m.keys] })),
  ...MAPEL_UTBK.map((m) => ({ kode: m.kode, keys: [m.nama.toLowerCase(), ...m.keys] })),
  { kode: 'bing_tl', keys: ['bahasa inggris tingkat lanjut', 'inggris tingkat lanjut', 'english advanced'] },
  { kode: 'bind_tl', keys: ['bahasa indonesia tingkat lanjut', 'indonesia tingkat lanjut'] },
  { kode: 'mtk_tl', keys: ['matematika tingkat lanjut', 'matematika lanjut', 'mtk tingkat lanjut', 'mtk lanjut'] },
  { kode: 'bing', keys: ['bahasa inggris', 'english', 'b inggris', 'binggris', 'b.inggris'] },
  { kode: 'bind', keys: ['bahasa indonesia', 'b indonesia', 'bindo', 'b.indonesia'] },
  { kode: 'mtk', keys: ['matematika', 'math', 'mtk', 'matematik'] },
  { kode: 'fis', keys: ['fisika', 'physics'] },
  { kode: 'kim', keys: ['kimia', 'chemistry'] },
  { kode: 'bio', keys: ['biologi', 'biology'] },
  { kode: 'geo', keys: ['geografi', 'geography', 'geo'] },
  { kode: 'sos', keys: ['sosiologi', 'sociology', 'sosio'] },
  { kode: 'sej', keys: ['sejarah', 'history'] },
  { kode: 'eko', keys: ['ekonomi', 'economy'] },
  { kode: 'pkn', keys: ['ppkn', 'pkn', 'pendidikan kewarganegaraan'] },
  { kode: 'ipa', keys: ['ipa', 'ilmu pengetahuan alam'] },
  { kode: 'ips', keys: ['ips', 'ilmu pengetahuan sosial'] },
  { kode: 'ipas', keys: ['ipas'] },
];

export function kodeMapel(nama) {
  const n = norm(nama);
  if (!n) return '';
  for (const row of ALIAS_MAPEL) {
    if (row.keys.some((k) => n === k || n.includes(k))) return row.kode;
  }
  return n;
}

export function cocokkanMapel(soalNama, targetNama) {
  const a = norm(soalNama);
  const b = norm(targetNama);
  if (!b) return true;
  if (!a) return false;
  if (a === b) return true;
  const ka = kodeMapel(a);
  const kb = kodeMapel(b);
  if (ka && kb && ka === kb) return true;
  return false;
}

export default { kodeMapel, cocokkanMapel };
