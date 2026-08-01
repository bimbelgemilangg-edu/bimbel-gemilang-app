// src/utils/notifications.js
// ============================================================
// 🔥 UTILITY NOTIFIKASI — dipakai bersama oleh semua fitur yang perlu
// ngasih tau siswa/guru ("materi baru", "kuis baru", "survei baru",
// "tagihan baru", "hasil kuis keluar", dll).
//
// Kenapa 1 dokumen PER PENERIMA (bukan 1 dokumen broadcast dibaca semua
// orang): supaya tiap siswa bisa tandai "sudah dibaca" atau menghapus
// notifikasinya sendiri tanpa mempengaruhi siswa lain.
// ============================================================
import { db } from '../firebase';
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';

/**
 * Kirim notifikasi ke siswa.
 * @param {object} opts
 * @param {string} [opts.targetKelas] - 'Semua' atau nama kelas spesifik. HARUS
 *   diisi eksplisit oleh pemanggil kalau memang mau broadcast ke semua siswa —
 *   lihat catatan fail-safe di bawah.
 * @param {string} [opts.targetKategori] - 'Semua', 'Reguler', atau 'English'. Sama
 *   seperti targetKelas, harus eksplisit kalau memang mau ke semua kategori.
 * @param {string[]} [opts.specificStudentIds] - kalau diisi, HANYA siswa ini yang dikirimi (mengabaikan targetKelas/targetKategori)
 * @param {string} opts.type - materi | kuis | tugas | survei | tagihan | hasil_kuis | pengumuman
 * @param {string} opts.title
 * @param {string} opts.message
 * @param {string} [opts.link] - route in-app, misal /siswa/modul/xxx
 * @param {string} [opts.fileUrl] - lampiran (opsional)
 * @param {string} [opts.fileName]
 */
export async function notifyStudents({
  // 🔥 FIX BUG PENTING ("notif nyasar ke semua siswa semua jenjang"):
  // sebelumnya targetKelas & targetKategori punya default value 'Semua' di
  // sini. Masalahnya, default parameter di JavaScript JUGA aktif kalau
  // pemanggil mengirim `undefined` secara eksplisit -- bukan cuma kalau
  // parameternya benar-benar tidak diisi. Beberapa pemanggil (misal
  // ManageMateri.jsx) memang mengirim `undefined` untuk kedua field ini
  // saat memakai mode "kirim ke siswa tertentu". Normalnya itu aman karena
  // `specificStudentIds` akan terisi menggantikannya -- TAPI kalau karena
  // sebab apa pun (race condition, state kosong, bug kecil di pemanggil)
  // `specificStudentIds` ikut kosong juga, fungsi ini dulu diam-diam
  // menganggap "targetKelas=Semua & targetKategori=Semua" dan langsung
  // MEMBROADCAST notifikasi ke SELURUH SISWA DI SEMUA JENJANG (SD-SMA) --
  // tanpa error, tanpa peringatan apa pun. Itu pola yang paling mungkin
  // menyebabkan laporan "notif kelas 9 SMP nyasar ke semua siswa".
  //
  // Sekarang default value DIHILANGKAN dari sini. 'Semua' cuma dipakai
  // kalau pemanggil BENAR-BENAR mengirim string 'Semua' secara eksplisit
  // (pilihan sadar dari UI). Kalau targetKelas & targetKategori dua-duanya
  // kosong/undefined DAN specificStudentIds juga kosong, fungsi ini
  // MENOLAK MENGIRIM (fail-safe) dan mencatat peringatan di console --
  // bukan lagi diam-diam mengirim ke semua orang (fail-open).
  targetKelas,
  targetKategori,
  specificStudentIds = [],
  type,
  title,
  message,
  link = '',
  fileUrl = '',
  fileName = '',
}) {
  try {
    let recipientIds = [];

    if (specificStudentIds.length > 0) {
      recipientIds = specificStudentIds;
    } else {
      const kelasProvided = targetKelas !== undefined && targetKelas !== null && targetKelas !== '';
      const kategoriProvided = targetKategori !== undefined && targetKategori !== null && targetKategori !== '';

      // 🔥 GERBANG FAIL-SAFE: kalau gak ada satu pun sinyal targeting yang
      // jelas (bukan siswa spesifik, bukan kelas spesifik, bukan kategori
      // spesifik -- semuanya kosong), ini HAMPIR PASTI bug di pemanggil,
      // bukan niat asli guru buat kirim ke seluruh siswa. Tolak kirim
      // daripada menebak "berarti maksudnya semua orang".
      if (!kelasProvided && !kategoriProvided) {
        console.error(
          '⚠️ notifyStudents DIBATALKAN: tidak ada target yang jelas ' +
          '(targetKelas & targetKategori kosong/undefined, specificStudentIds juga kosong). ' +
          'Ini sengaja dicegah supaya notifikasi tidak nyasar ke SEMUA siswa di semua jenjang secara tidak sengaja. ' +
          `Kalau memang mau broadcast ke semua siswa, kirim targetKelas: 'Semua' dan/atau targetKategori: 'Semua' secara eksplisit. ` +
          `Detail panggilan yang dibatalkan: type="${type}", title="${title}".`
        );
        return;
      }

      const finalKelas = kelasProvided ? targetKelas : 'Semua';
      const finalKategori = kategoriProvided ? targetKategori : 'Semua';

      const snap = await getDocs(collection(db, 'students'));
      recipientIds = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        // 🔥 Perbandingan di-trim (dan kategori dibuat case-insensitive)
        // supaya beda spasi/kapitalisasi kecil di data siswa (input manual
        // admin, impor dari Excel, dll) tidak menyebabkan kecocokan yang
        // salah atau kelewatan -- baik targetKelas maupun targetKategori
        // dua-duanya harus cocok, kecuali memang eksplisit 'Semua'.
        .filter(s => {
          const kelasSiswa = String(s.kelasSekolah || '').trim();
          const kategoriSiswa = String(s.kategori || '').trim().toLowerCase();
          const kelasCocok = finalKelas === 'Semua' || kelasSiswa === String(finalKelas).trim();
          const kategoriCocok = finalKategori === 'Semua' || kategoriSiswa === String(finalKategori).trim().toLowerCase();
          return kelasCocok && kategoriCocok;
        })
        .map(s => s.studentId || s.id);
    }

    // Dedup, jaga-jaga ada ID yang kebawa dobel
    recipientIds = [...new Set(recipientIds.filter(Boolean))];

    await Promise.all(recipientIds.map(rid => addDoc(collection(db, 'notifications'), {
      recipientId: rid,
      recipientType: 'siswa',
      type, title, message, link, fileUrl, fileName,
      isRead: false,
      createdAt: serverTimestamp(),
    })));
  } catch (e) {
    // Notifikasi gagal terkirim TIDAK BOLEH menggagalkan aksi utama (publish
    // modul/kuis/survei tetap harus sukses walau notifikasinya gagal).
    console.error('Gagal kirim notifikasi ke siswa:', e);
  }
}

/**
 * Kirim notifikasi ke guru/tentor.
 */
export async function notifyTeachers({
  specificGuruIds = [],
  type,
  title,
  message,
  link = '',
  fileUrl = '',
  fileName = '',
}) {
  try {
    let recipientIds = specificGuruIds.filter(Boolean);
    if (recipientIds.length === 0) {
      const snap = await getDocs(collection(db, 'teachers'));
      recipientIds = snap.docs.map(d => d.data().guruId || d.id).filter(Boolean);
    }
    recipientIds = [...new Set(recipientIds)];

    await Promise.all(recipientIds.map(rid => addDoc(collection(db, 'notifications'), {
      recipientId: rid,
      recipientType: 'guru',
      type, title, message, link, fileUrl, fileName,
      isRead: false,
      createdAt: serverTimestamp(),
    })));
  } catch (e) {
    console.error('Gagal kirim notifikasi ke guru:', e);
  }
}

/**
 * Kirim ke SATU siswa tertentu saja (dipakai misal saat guru kirim hasil
 * kuis perorangan).
 */
export async function notifyOneStudent(studentId, { type, title, message, link = '', fileUrl = '', fileName = '' }) {
  return notifyStudents({ specificStudentIds: [studentId], type, title, message, link, fileUrl, fileName });
}