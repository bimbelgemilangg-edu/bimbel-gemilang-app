// src/data/bukuInteraktif.js
// ============================================================
// SEKERING ANTI-ERROR: file ini sengaja hanya berisi export kosong
// dengan DUA nama (DAFTAR_BUKU & DAFTAR_BAB). Fungsinya satu: kalau
// masih ada file lama di project yang meng-import salah satu nama
// itu, build TIDAK AKAN gagal lagi (importnya resolve ke array
// kosong). Konten buku yang sebenarnya sekarang hidup di Firestore
// (koleksi buku_digital) dan dibaca langsung oleh halaman reader
// versi baru -- jadi file ini memang tidak dipakai konten lagi.
// ============================================================
export const DAFTAR_BUKU = [];
export const DAFTAR_BAB = [];