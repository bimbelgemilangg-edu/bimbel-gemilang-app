// src/utils/panduImpor.js
// ============================================================
// PANDU IMPOR — logika menu depan halaman impor.
//
// KENAPA ADA (permintaan owner 2026-10-11): "kedepannya mending gini biar
// admin atau selain aku mau import gak bingung: di depan ada menu ditanyain
// mau import mana -- soal biasa, mapel, atau ujian TKA/UTBK -- agar
// sistemnya enak." Halaman impor memang punya semua metadata itu
// (jenisUjian, mataPelajaran, jenjang, kelas, format), tetapi semuanya
// berupa form panjang DI BAWAH, sehingga orang baru harus sudah tahu
// sistemnya dulu sebelum bisa memakai. Wizard depan membalik urutannya:
// sistem yang bertanya dulu, form yang ikut terisi.
//
// Util ini memuat SEMUA logika pemetaan pilihan -> metadata mesin, supaya
// komponen wizard cuma urusan klik dan pemetaannya bisa dikunci test.
// Nilai-nilainya SENGAJA memakai kosakata yang sudah dikenal mesin:
//   jenisUjian : '' | 'TKA' | 'SNBT/UTBK' | 'Reguler' | 'Lainnya'
//                (select yang sudah ada di ImportHasilScanPage)
//   format     : 'html' | 'json' | 'csv' | 'tex'
//                (tombol format yang sudah ada di halaman yang sama)
// MURNI & TERUJI (tests/panduImpor.test.mjs).
// ============================================================

export const PILIHAN_KONTEN = [
  {
    id: 'seleksi',
    label: '🎯 Soal ujian seleksi nasional',
    deskripsi: 'TKA, SNBT/UTBK, SIMAK, olimpiade — soal beredar lintas sekolah, biasanya dari buku/scan dua kolom.',
  },
  {
    id: 'reguler',
    label: '🏫 Soal reguler sekolah',
    deskripsi: 'Ulangan harian, PTS/PAT, tugas, soal buatan guru sesuai kurikulum sekolah.',
  },
  {
    id: 'materi',
    label: '📚 Materi / buku / modul',
    deskripsi: 'Bukan soal: ringkasan materi, bab buku, modul pembelajaran.',
    pintuLain: '/admin/buku/impor',
    namaPintuLain: 'Admin → Buku → Impor Modul',
  },
  {
    id: 'kuis-guru',
    label: '🧑‍🏫 Kuis untuk kelas saya (guru)',
    deskripsi: 'Kuis kecil dari file Word/PDF untuk satu kelas, tidak masuk bank soal pusat.',
    pintuLain: '/guru/modul',
    namaPintuLain: 'Guru → Manage Quiz (Impor Word / Smart Import)',
  },
];

export const PILIHAN_UJIAN = [
  { id: 'TKA', label: 'TKA — Tes Kemampuan Akademik', jenisUjian: 'TKA' },
  { id: 'SNBT/UTBK', label: 'SNBT / UTBK', jenisUjian: 'SNBT/UTBK' },
  { id: 'Reguler', label: 'Reguler — ulangan / kurikulum sekolah', jenisUjian: 'Reguler' },
  { id: 'Lainnya', label: 'Lainnya (olimpiade, try out lembaga, dll)', jenisUjian: 'Lainnya' },
];

export const PILIHAN_FORMAT = [
  {
    id: 'scan',
    label: '📄 PDF / foto scan buku',
    deskripsi: 'Belum ada teksnya. Sistem memberi prompt siap-salin untuk AI pihak ketiga; hasilnya HTML Master.',
    format: 'html',
    butuhPrompt: true,
  },
  {
    id: 'html',
    label: '📑 HTML siap pakai',
    deskripsi: 'Sudah punya berkas HTML ber-structure (dari prompt Gemilang atau konverter lain).',
    format: 'html',
    butuhPrompt: false,
  },
  {
    id: 'json',
    label: '🧾 JSON bank soal',
    deskripsi: 'Berkas .json berisi array soal (mode legacy, tetap didukung).',
    format: 'json',
    butuhPrompt: false,
  },
  {
    id: 'tex',
    label: '🧮 LaTeX / .tex',
    deskripsi: 'Berkas .tex dengan environment question/choices/solution.',
    format: 'tex',
    butuhPrompt: false,
  },
  {
    id: 'csv',
    label: ' CSV / spreadsheet',
    deskripsi: 'Tabel satu baris satu soal.',
    format: 'csv',
    butuhPrompt: false,
  },
];

/**
 * Terjemahkan pilihan wizard menjadi metadata mesin + pesan panduan.
 * @param {object} pilihan { konten, ujian, format, mapel, jenjang, kelas }
 * @returns {object} meta siap disetel ke state halaman impor
 */
export function metaDariPilihan(pilihan = {}) {
  const konten = PILIHAN_KONTEN.find((k) => k.id === pilihan.konten) || null;
  if (konten && konten.pintuLain) {
    return {
      pintuLain: konten.pintuLain,
      namaPintuLain: konten.namaPintuLain,
      jenisUjian: '',
      format: 'html',
      butuhPrompt: false,
      mapel: '', jenjang: '', kelas: '',
      ringkasan: `${konten.label} → dikerjakan di ${konten.namaPintuLain}, bukan di halaman ini.`,
    };
  }
  const ujian = PILIHAN_UJIAN.find((u) => u.id === pilihan.ujian) || null;
  const format = PILIHAN_FORMAT.find((f) => f.id === pilihan.format) || null;
  const jenisUjian = ujian
    ? ujian.jenisUjian
    : (pilihan.konten === 'reguler' ? 'Reguler' : '');
  return {
    pintuLain: null,
    namaPintuLain: '',
    jenisUjian,
    format: format ? format.format : 'html',
    butuhPrompt: Boolean(format ? format.butuhPrompt : true),
    mapel: pilihan.mapel || '',
    jenjang: pilihan.jenjang || '',
    kelas: pilihan.kelas || '',
    ringkasan: [
      konten ? konten.label : '',
      ujian ? ujian.label : '',
      format ? format.label : '',
    ].filter(Boolean).join(' · '),
  };
}

/**
 * Kalimat panduan yang ditempel di atas form setelah wizard selesai,
 * supaya admin lain tahu MENGAPA isian di bawah sudah terisi.
 * @param {object} meta keluaran metaDariPilihan
 * @returns {string}
 */
export function teksPanduan(meta = {}) {
  if (meta.pintuLain) return meta.ringkasan;
  const bagian = [`Jalur: ${meta.ringkasan}.`];
  if (meta.butuhPrompt) {
    bagian.push('Langkah berikutnya: salin prompt di panel bawah, jalankan pada AI pilihan Anda, lalu tempel/unggah hasilnya di sini.');
  } else {
    bagian.push('Langkah berikutnya: tempel atau unggah berkas Anda, lalu tekan Parse & Preview.');
  }
  bagian.push('Identitas di bawah sudah terisi dari pilihan Anda — silakan koreksi bila perlu.');
  return bagian.join(' ');
}

export default { PILIHAN_KONTEN, PILIHAN_UJIAN, PILIHAN_FORMAT, metaDariPilihan, teksPanduan };
