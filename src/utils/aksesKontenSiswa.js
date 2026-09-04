// src/utils/aksesKontenSiswa.js
// ============================================================
// Aturan "soal ini boleh/tidak boleh dilihat siswa ini" -- SATU-SATUNYA
// sumber kebenaran, dipakai bareng oleh:
//   1. LatihanHarianPage.jsx (siswa)  -- buat MENYARING soal sebelum tampil
//   2. LatihanAktivitasPage.jsx (admin) -- buat MENGAUDIT soal yang
//      SUDAH terlanjur dikerjakan siswa, cek ulang apa cocok atau nyasar
//
// 🔥 KENAPA DIPISAH KE FILE INI: sebelumnya fungsi ini didefinisikan
// SENDIRI-SENDIRI cuma di LatihanHarianPage.jsx. Kalau nanti diedit di
// satu tempat tapi lupa di tempat lain, filter siswa & hasil audit admin
// bisa BEDA tanpa disadari (persis pola bug format kelas "7" vs "7 SMP"
// yang pernah kejadian). Dengan 1 file bersama ini, itu tidak mungkin
// terjadi -- keduanya wajib import dari sini.
// ============================================================

// 🔒 default MENOLAK kalau jenjang tidak jelas cocok -- bukan meloloskan.
export function cocokkanJenjang(jenjangSoal, jenjangSiswa) {
    if (!jenjangSoal) return false; // soal tanpa jenjang ditolak, BUKAN diloloskan
    const soal = jenjangSoal.toLowerCase();
    const siswa = (jenjangSiswa || '').toLowerCase();
    if (siswa === 'smp') return soal.includes('smp');
    if (siswa === 'sd') return soal.includes('sd');
    // UTBK/SNBT sengaja DIIKUTKAN buat siswa SMA -- itu memang relevan
    // buat persiapan mereka (bukan celah, tapi kesesuaian yang disengaja).
    if (siswa === 'sma') return soal.includes('sma') || soal.includes('utbk') || soal.includes('snbt');
    return false; // jenjang siswa tidak dikenali -- tolak, jangan tebak
  }
  
  // Ekstrak angka kelas dari format apa pun ("7", "7 SMP", "Kelas 7" -> "7")
  // -- dipakai supaya perbandingan kelas tidak gagal cuma gara-gara format
  // string beda antara Bank Soal & data siswa.
  export function ekstrakAngkaKelas(str) {
    const m = String(str || '').match(/\d+/);
    return m ? m[0] : '';
  }
  
  // Cek kelas, DENGAN pengecualian TKA/SNBT/UTBK yang lintas kelas dalam 1
  // jenjang (lihat penjelasan lengkap di LatihanHarianPage.jsx).
  export function cocokkanKelas(soal, angkaKelasSiswa) {
    if (soal.jenisUjian && ['tka', 'snbt', 'utbk'].includes(String(soal.jenisUjian).toLowerCase())) return true;
    return !soal.tingkatKelas || ekstrakAngkaKelas(soal.tingkatKelas) === angkaKelasSiswa;
  }
  
  // Cek gabungan jenjang + kelas sekaligus -- dipakai admin buat AUDIT
  // (soal yang SUDAH dikerjakan siswa, cek ulang apa harusnya boleh atau
  // tidak). Mengembalikan { cocok, alasan } supaya admin tahu PERSIS
  // kenapa suatu soal dianggap nyasar, bukan cuma true/false polos.
  export function auditKecocokanSoal(soal, jenjangSiswa, kelasSiswa) {
    if (!cocokkanJenjang(soal.jenjang, jenjangSiswa)) {
      return { cocok: false, alasan: `Jenjang soal ("${soal.jenjang || '(kosong)'}") tidak cocok untuk siswa jenjang "${jenjangSiswa || '(kosong)'}"` };
    }
    if (kelasSiswa) {
      const angkaKelasSiswa = ekstrakAngkaKelas(kelasSiswa);
      if (!cocokkanKelas(soal, angkaKelasSiswa)) {
        return { cocok: false, alasan: `Kelas soal ("${soal.tingkatKelas || '(kosong)'}") tidak cocok untuk siswa kelas "${kelasSiswa}"` };
      }
    }
    return { cocok: true, alasan: '' };
  }