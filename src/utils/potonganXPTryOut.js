// src/utils/potonganXPTryOut.js
// ============================================================
// Hitung berapa XP try out yang dipotong akibat pelanggaran
// (anti-cheat). PRINSIP: 1 pelanggaran ringan/kecelakaan (mis. notif
// WA numpang masuk terus HP kesenggol pindah app sebentar) TIDAK
// boleh langsung menghanguskan semua XP -- potongannya proporsional,
// makin banyak & makin berat pelanggarannya, makin besar potongannya.
// XP TIDAK PERNAH MINUS (konsisten dengan prinsip Latihan Harian) --
// paling parah ya jadi 0, bukan di bawah 0.
// ============================================================

// Bobot tiap jenis pelanggaran -- angka lebih besar = dianggap lebih
// serius. Tab/jendela/fullscreen levelnya sama (1 poin) karena
// ketiganya sama-sama "keluar dari layar ujian", agak susah dibedakan
// mana yang beneran nyontek vs kepencet gak sengaja. Kamera mati &
// auto-translate levelnya lebih berat (2 poin) karena itu sinyal yang
// lebih spesifik nunjuk niat, bukan sekadar kepencet.
export const BOBOT_PELANGGARAN = {
    pindah_tab_atau_aplikasi: 1,
    keluar_dari_jendela: 1,
    keluar_fullscreen: 1,
    kamera_tidak_aktif: 2,
    halaman_diterjemahkan_otomatis: 2,
  };
  
  export const LABEL_PELANGGARAN = {
    pindah_tab_atau_aplikasi: 'Pindah ke tab/aplikasi lain',
    keluar_dari_jendela: 'Keluar dari jendela browser',
    keluar_fullscreen: 'Keluar dari mode layar penuh',
    kamera_tidak_aktif: 'Kamera tidak aktif/ditolak',
    halaman_diterjemahkan_otomatis: 'Halaman diterjemahkan otomatis',
  };
  
  /**
   * @param {Array<{type:string}>} daftarPelanggaran
   * @param {number} potonganPerPoin - berapa persen XP dipotong per 1 poin bobot (default 5%)
   */
  export function hitungPotonganXP(daftarPelanggaran, potonganPerPoin = 0.05) {
    const totalPoin = (daftarPelanggaran || []).reduce((sum, p) => sum + (BOBOT_PELANGGARAN[p.type] || 1), 0);
    const persenPotongan = Math.min(1, totalPoin * potonganPerPoin);
    return { totalPoin, persenPotongan };
  }
  
  /**
   * Terapkan potongan ke XP mentah hasil try out. XP hasil akhir
   * DIJAMIN tidak pernah negatif (dibatasi minimal 0).
   */
  export function terapkanPotonganXP(xpMentah, daftarPelanggaran, potonganPerPoin = 0.05) {
    const { persenPotongan, totalPoin } = hitungPotonganXP(daftarPelanggaran, potonganPerPoin);
    const xpFinal = Math.max(0, Math.round(xpMentah * (1 - persenPotongan)));
    return { xpFinal, xpDipotong: xpMentah - xpFinal, persenPotongan, totalPoin };
  }