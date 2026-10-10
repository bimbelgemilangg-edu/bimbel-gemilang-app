// src/utils/templateTryoutUtbk.js
// ============================================================
// Template try out otomatis SABTU berbasis 7 subtes UTBK-SNBT.
//
// Angka komposisi & durasi DISALIN dari sheet KOMPONEN_7_SUBTES_UTBK pada
// berkas riset owner (bukan dikarang): 155 soal, 195 menit, dengan jebakan
// & trik per subtes yang sudah dipetakan di utils/kunciSubtesPtn.js.
//
// Nama mapel di komposisi memakai NAMA RESMI dari MAPEL_UTBK
// (mesinTaksonomiSoal), karena mesin try out mencocokkan komposisi ke bank
// soal lewat nama/kode itu -- soal hasil scan UTBK sudah bertag utbk_*.
// ============================================================

import { MAPEL_UTBK } from './mesinTaksonomiSoal.js';

/** {subtes, jumlah soal, durasi menit} persis sheet KOMPONEN owner. */
export const KOMPOSISI_SUBTES_UTBK = [
  { subtes: 'PU', jumlah: 30, durasiMenit: 30 },
  { subtes: 'PPU', jumlah: 20, durasiMenit: 15 },
  { subtes: 'PBM', jumlah: 20, durasiMenit: 25 },
  { subtes: 'PK', jumlah: 20, durasiMenit: 20 },
  { subtes: 'LBI', jumlah: 25, durasiMenit: 45 },
  { subtes: 'LBE', jumlah: 20, durasiMenit: 30 },
  { subtes: 'PM', jumlah: 20, durasiMenit: 30 },
];

export const TOTAL_SOAL_UTBK = KOMPOSISI_SUBTES_UTBK.reduce((a, b) => a + b.jumlah, 0);
export const TOTAL_MENIT_UTBK = KOMPOSISI_SUBTES_UTBK.reduce((a, b) => a + b.durasiMenit, 0);

const namaMapel = (idSubtes) => {
  const m = MAPEL_UTBK.find((x) => x.subtes === idSubtes);
  return m ? m.nama : null;
};

/** Template siap simpan ke koleksi tryout_template_otomatis. */
export function templateTryoutUtbkSabtu() {
  return {
    nama: 'Try Out UTBK Gemilang (Sabtu)',
    jenjang: 'SMA',
    kelas: '12',
    targetKelas: 'Semua',
    targetKategori: 'Semua',
    komposisi: KOMPOSISI_SUBTES_UTBK.map((k) => ({
      mapel: namaMapel(k.subtes),
      jumlah: k.jumlah,
      durasiMenit: k.durasiMenit,
    })),
    // Sabtu = 6. Permintaan blueprint §5: tryout rutin setiap Sabtu.
    hariDalamMinggu: [6],
    jamBuka: '07:00',
    durasiTotalMenit: TOTAL_MENIT_UTBK,
    modeTimer: 'per-subtes',
    antiCheatAktif: true,
    wajibKamera: false,
    soalAcak: true,
    tampilkanPembahasan: true,
    aktif: true,
    sumberKomposisi: 'KOMPONEN_7_SUBTES_UTBK (berkas riset owner)',
  };
}

export default { KOMPOSISI_SUBTES_UTBK, TOTAL_SOAL_UTBK, TOTAL_MENIT_UTBK, templateTryoutUtbkSabtu };
