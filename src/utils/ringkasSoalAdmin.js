// src/utils/ringkasSoalAdmin.js
// ============================================================
// Ringkasan daftar soal untuk layar admin (total + jumlah per mapel).
// Dipindah keluar dari mesinTryOutOtomatis.js (14 Okt 2026) supaya bisa
// diuji di Node polos — berkas mesin mengimpor instansi Firestore yang
// membuat seluruh modul tak bisa dimuat tanpa Vite (preseden sama seperti
// kodeMapel/cocokkanMapel yang lebih dulu dipindah ke aliasMapel.js).
// ============================================================

/**
 * @param {Array<object>} daftarSoal
 * @returns {{total:number, perMapel:Object<string,number>}}
 */
export function ringkasSoalUntukAdmin(daftarSoal) {
  const byMapel = {};
  const list = Array.isArray(daftarSoal) ? daftarSoal : [];
  for (let i = 0; i < list.length; i += 1) {
    const s = list[i];
    const m = s?.mapel || s?.mataPelajaran || 'Lainnya';
    byMapel[m] = (byMapel[m] || 0) + 1;
  }
  return { total: list.length, perMapel: byMapel };
}

export default { ringkasSoalUntukAdmin };
