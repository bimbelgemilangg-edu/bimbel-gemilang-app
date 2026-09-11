// src/data/bukuInteraktif.js
// ============================================================
// PINTU RE-EXPORT SAJA (file ini sengaja pendek).
// Semua konten buku hidup di src/data/buku/babNN.js (satu file per
// bab) dan diregistrasi di src/data/buku/index.js sebagai DAFTAR_BUKU
// (satu buku = satu object dengan array `bab`).
// Halaman siswa meng-import dari file ini supaya path import lama
// tidak berubah: import { DAFTAR_BUKU } from '../../../data/bukuInteraktif';
// ============================================================
export { DAFTAR_BUKU } from './buku/index';