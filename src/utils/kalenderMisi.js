// src/utils/kalenderMisi.js
// ============================================================
// BATAS TAMPIL STRIP TANGGAL di dashboard siswa (PapanJelajahPage).
//
// 🔥 KENAPA ADA (revisi owner 2026-10-25): strip tanggal sebelumnya
// menampilkan SELURUH hari dalam bulan, termasuk tanggal-tanggal yang belum
// terjadi. Owner meminta strip "berhenti pada tanggal hari ini", supaya siswa
// tinggal menggeser ke tanggal sebelum/sesudah di bulan berjalan tanpa
// melihat hari-hari kosong di masa depan.
//
// Aturan yang dipaku di sini:
//   - bulan berjalan   : tampil tanggal 1 s.d. HARI INI saja;
//   - bulan sebelumnya : tampil penuh (riwayat misi hidup di tanggalnya);
//   - bulan sesudahnya : tidak ada yang ditampilkan, dan tombol ke bulan
//     berikutnya DINONAKTIFKAN sehingga keadaan itu tak tercapai dari UI.
//
// Murni & teruji: tidak menyentuh Date global selain nilai `kini` yang
// diberikan, supaya zona waktu perangkat tidak mengubah perilakunya di uji.
//
// Uji: tests/kalenderMisi.test.mjs
// ============================================================

/**
 * Jumlah tanggal yang boleh ditampilkan untuk satu bulan.
 * @param {number} bulanY tahun tampilan
 * @param {number} bulanM bulan tampilan (0-11)
 * @param {Date|number|string} kini waktu sekarang
 * @returns {number} 0 bila bulan tampilan berada di masa depan
 */
export function jumlahTanggalTampil(bulanY, bulanM, kini) {
  const k = new Date(kini);
  const jumlahHari = new Date(bulanY, bulanM + 1, 0).getDate();
  if (bulanY === k.getFullYear() && bulanM === k.getMonth()) return k.getDate();
  const diMasaDepan =
    bulanY > k.getFullYear() || (bulanY === k.getFullYear() && bulanM > k.getMonth());
  return diMasaDepan ? 0 : jumlahHari;
}

/**
 * Apakah tombol "bulan berikutnya" boleh aktif? Hanya bila bulan tampilan
 * berada SEBELUM bulan berjalan.
 * @returns {boolean}
 */
export function bolehBulanBerikutnya(bulanY, bulanM, kini) {
  const k = new Date(kini);
  if (bulanY > k.getFullYear()) return false;
  if (bulanY === k.getFullYear() && bulanM >= k.getMonth()) return false;
  return true;
}

export default { jumlahTanggalTampil, bolehBulanBerikutnya };
