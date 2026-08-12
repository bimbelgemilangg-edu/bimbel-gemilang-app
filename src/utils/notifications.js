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
  // 🔥 FIX BUG BARU & PALING PENTING (laporan nyata: "guru SMP upload
  // sesuatu, notifnya muncul di siswa SD"): sistem AKSES KONTEN (siapa
  // yang boleh buka modul/kuis) SUDAH DIPINDAH TOTAL ke `kodeMapel` +
  // `enrolledSubjects` siswa beberapa perbaikan lalu -- targetKelas &
  // targetKategori SUDAH TIDAK LAGI dipakai buat nentuin akses konten.
  // TAPI fungsi notifikasi ini KELEWATAN, masih pakai targetKelas/
  // targetKategori (skema LAMA) buat nentuin siapa yang dikirimi
  // notifikasi -- jadi NOTIFIKASI dan AKSES KONTEN jalan di DUA ATURAN
  // YANG BEDA. Efeknya persis laporan yang masuk: guru bikin modul mapel
  // SMP (targetKelas defaultnya sering "Semua" karena akses udah gak
  // bergantung ke situ lagi), notifikasinya jadi ke-broadcast ke SEMUA
  // KELAS termasuk SD -- padahal siswa SD itu gak akan pernah bisa buka
  // modulnya sama sekali (mapelnya gak match), jadi notifnya nyasar/gak
  // relevan buat mereka.
  //
  // Sekarang `kodeMapel` jadi PENENTU UTAMA audiens notifikasi -- SAMA
  // PERSIS aturan yang dipakai buat akses konten (`enrolledSubjects`
  // siswa harus mengandung kodeMapel itu, atau 'Semua'). targetKelas/
  // targetKategori DIHAPUS dari sini (bukan dipakai buat filter lagi) --
  // supaya SATU-SATUNYA sumber kebenaran soal "siswa ini dapat notif
  // modul ini atau enggak" SAMA PERSIS dengan "siswa ini bisa buka modul
  // ini atau enggak". Gak ada lagi dua aturan yang bisa saling gak
  // sinkron.
  kodeMapel,
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
      const kodeProvided = typeof kodeMapel === 'string' && kodeMapel.trim() !== '';

      // 🔥 GERBANG FAIL-SAFE (tetap dipertahankan, sekarang berbasis
      // kodeMapel): kalau gak ada kodeMapel yang jelas DAN bukan siswa
      // spesifik, ini hampir pasti bug di pemanggil -- tolak kirim
      // daripada nebak "berarti semua orang".
      if (!kodeProvided) {
        console.error(
          '⚠️ notifyStudents DIBATALKAN: tidak ada kodeMapel yang jelas ' +
          '(kodeMapel kosong/undefined, specificStudentIds juga kosong). ' +
          'Ini sengaja dicegah supaya notifikasi tidak nyasar ke siswa yang mapelnya gak relevan sama sekali. ' +
          `Kalau memang mau broadcast ke SEMUA siswa (pengumuman umum, bukan konten per-mapel), kirim kodeMapel: 'Semua' secara eksplisit. ` +
          `Detail panggilan yang dibatalkan: type="${type}", title="${title}".`
        );
        return;
      }

      const normKode = (v) => String(v || '').toLowerCase().trim();
      const kodeNorm = normKode(kodeMapel);
      // `kodeMapel` bisa berisi BEBERAPA kode dipisah koma (kalau
      // pemanggil kebetulan ngirim gabungan) -- dipecah dulu biar tetap
      // match walau formatnya begitu.
      const kodeList = kodeMapel.split(',').map(normKode).filter(Boolean);

      const snap = await getDocs(collection(db, 'students'));
      recipientIds = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        // 🔥 SAMA PERSIS pola hasSubjectAccess() yang dipakai di semua
        // halaman siswa -- kodeMapel 'Semua' di enrolledSubjects siswa
        // berarti akses/dapat notif ke apa pun.
        .filter(s => {
          if (kodeNorm === 'semua') return true; // pemanggil sengaja broadcast umum
          const enrolled = Array.isArray(s.enrolledSubjects) ? s.enrolledSubjects : [];
          return enrolled.some(code => {
            const c = normKode(code);
            return c === 'semua' || kodeList.includes(c);
          });
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