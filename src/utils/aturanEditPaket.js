// src/utils/aturanEditPaket.js
// ============================================================
// KEBIJAKAN EDIT PAKET SETELAH APPROVE — melindungi skor yang sudah ada.
//
// KENAPA ADA (pertanyaan owner 2026-10-12): "soal yang udah di-approve
// admin bisa gak diedit? ... untuk siswa yang mengerjakan nanti skor
// dikembalikan lewat menu try out biasanya?"
//
// Jawabannya diatur di sini, bukan disimpan di kepala developer:
//   - METADATA (judul, jendela waktu, target kelas, catatan) boleh diedit
//     kapan pun: tidak mengubah butir soal, jadi sesi & skor lama tetap
//     valid dan tinjauan siswa tetap cocok.
//   - ISI (daftarSoal) paket yang SUDAH punya sesi TIDAK BOLEH ditimpa:
//     jawaban siswa mereferensi id soal; mengganti isi membuat tinjauan
//     & skor lama menunjuk soal yang berbeda -- nilai yang sudah masuk
//     laporan orang tua bisa berubah makna tanpa jejak.
//   - Jalan perbaikan isi = PAKET REVISI berkode baru (mesin susulan),
//     sehingga paket lama membeku sebagai arsip berskor dan paket revisi
//     menjadi tugas baru. Skor lama "kembali" lewat menu Try Out seperti
//     biasa karena paketnya tidak pernah diubah.
//   - Paket tanpa sesi masih bebas diedit isinya (belum ada yang dirugikan).
//
// MURNI & TERUJI (tests/aturanEditPaket.test.mjs).
// ============================================================

/**
 * @param {object} args { status, jumlahSesi }
 * @returns {{bolehMetadata:boolean, bolehIsi:boolean, alasan:string}}
 */
export function putusanEditPaket({ status = '', jumlahSesi = 0 } = {}) {
  const sesi = Number(jumlahSesi) || 0;
  const s = String(status || '').toLowerCase();
  if (s === 'draf') {
    return { bolehMetadata: true, bolehIsi: true, alasan: 'Paket masih draf: bebas diedit sebelum diterbitkan.' };
  }
  if (sesi === 0) {
    return { bolehMetadata: true, bolehIsi: true, alasan: 'Belum ada siswa yang mengerjakan: isi masih boleh diedit langsung.' };
  }
  return {
    bolehMetadata: true,
    bolehIsi: false,
    alasan: `${sesi} siswa sudah mengerjakan paket ini. Isi soal dibekukan supaya skor & tinjauan mereka tetap sah; perbaikan isi dilakukan lewat PAKET REVISI berkode baru.`,
  };
}

export default { putusanEditPaket };
