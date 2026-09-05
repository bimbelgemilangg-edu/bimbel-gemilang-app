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

// Cek kelas -- dengan pengecualian TKA/SNBT/UTBK yang lintas kelas dalam 1
// jenjang (lihat penjelasan lengkap di LatihanHarianPage.jsx).
//
// 🔥 BARU: dulu ini cocokin PERSIS SAMA (kelas 9 cuma dapat soal kelas
// 9). Sekarang kelas siswa boleh akses soal KELAS SENDIRI ATAU DI
// BAWAHNYA (searah, bukan dua arah) -- kelas 9 SMP kebagian soal
// kelas 7, 8, DAN 9 (bank soal jadi berasa lebih banyak buat drill,
// apalagi buat kelas akhir jenjang yang mau persiapan ujian besar),
// TAPI kelas 7 TETAP TIDAK BISA dapat soal kelas 8/9 (gak boleh
// "loncat" ke materi yang belum diajarkan). Aturan ini otomatis
// berlaku sama di SD, SMP, maupun SMA karena angka kelasnya memang
// satu skala 1-12 lintas jenjang (lihat DAFTAR_KELAS di
// ImportHasilScanPage.jsx) -- jenjangnya sendiri sudah disaring
// terpisah lewat cocokkanJenjang() di atas.
export function cocokkanKelas(soal, angkaKelasSiswa) {
  if (soal.jenisUjian && ['tka', 'snbt', 'utbk'].includes(String(soal.jenisUjian).toLowerCase())) return true;
  if (!soal.tingkatKelas) return true; // soal "Semua kelas" -- selalu cocok
  const angkaKelasSoal = ekstrakAngkaKelas(soal.tingkatKelas);
  // Kalau dua-duanya berhasil diubah jadi angka, bandingkan SEBAGAI
  // ANGKA (soal kelas <= kelas siswa). Kalau salah satu gagal diubah
  // jadi angka (data aneh/kosong), balik ke perbandingan string biasa
  // seperti sebelumnya -- jangan sampai data yang tidak jelas malah
  // bikin aturan aksesnya jadi lebih longgar dari yang seharusnya.
  if (angkaKelasSoal && angkaKelasSiswa) {
    return Number(angkaKelasSoal) <= Number(angkaKelasSiswa);
  }
  return angkaKelasSoal === angkaKelasSiswa;
}

// Cek akses mapel siswa terhadap suatu kodeMapel -- LOGIKA & SEMANTIK
// SAMA PERSIS dengan hasSubjectAccess() yang sudah dipakai di
// StudentDashboard.jsx & StudentElearning.jsx (materi/kuis), supaya
// Latihan Harian konsisten dengan aturan akses mapel yang sudah ada:
// - enrolledSubjects KOSONG/tidak diisi = BLOKIR SEMUA (bukan diloloskan)
// - enrolledSubjects berisi "semua" = akses ke semua mapel
// - selain itu, cuma kodeMapel yang ADA di daftar enrolledSubjects yang boleh
export function cocokkanAksesMapel(enrolledSubjects, kodeMapelSoal) {
  if (!kodeMapelSoal) return true; // soal ini gak punya kodeMapel yang bisa dicocokkan -- masalah data di sisi mapel, bukan siswa, jangan blokir gara-gara ini
  if (!Array.isArray(enrolledSubjects) || enrolledSubjects.length === 0) return false; // 🔒 kosong = BLOKIR
  const norm = (s) => String(s || '').toLowerCase().trim();
  if (enrolledSubjects.some((s) => norm(s) === 'semua')) return true;
  return enrolledSubjects.some((s) => norm(s) === norm(kodeMapelSoal));
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