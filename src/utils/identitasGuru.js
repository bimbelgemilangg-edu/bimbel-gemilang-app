// src/utils/identitasGuru.js
// ============================================================
// IDENTITAS GURU LOGIN — SATU sumber kebenaran.
//
// LATAR BELAKANG BUG (owner lapor 2026-10: banner "Try Out yang
// Dipercayakan Kepada Anda" tidak muncul di /guru/dashboard padahal
// admin sudah menghubungkan paket ke guru tsb):
//
//   Koleksi `teachers` menyimpan DUA identitas per guru:
//     1. docId Firestore (contoh "epmtJ3g3EMvqlEsA2IrB") — id dokumen.
//        INILAH yang disimpan admin ke `tryout_paket.tentorId` lewat
//        dropdown di halaman Terbitkan Try Out (value option = doc.id).
//     2. field `guruId` (contoh "GURU-005") — kode manusia yang tampil
//        di dashboard dan dipakai kode lama guru (sesi presentasi).
//
//   localStorage `teacherData` = { id: docId, ...data } sehingga
//   DUA-DUANYA tersedia di sisi guru. Dulu tiap halaman memilih sendiri
//   (`g.guruId || g.id`) sehingga cuma cocok kalau kebetulan sama —
//   banner & halaman pantau jadi buta untuk koneksi buatan admin.
//
//   ATURAN: semua pencocokan guru↔tryout WAJIB lewat berkas ini dan
//   menerima KEDUA identitas. NAMA sengaja tidak pernah jadi identitas
//   (dua guru bisa bernama sama = lubang akses).
// ============================================================

const KUNCI_STORAGE = 'teacherData';

/** Baca mentah isi localStorage teacherData. Aman: tidak pernah melempar
 *  (localStorage bisa tiada di environment test / private mode). */
export function bacaDataGuruLogin() {
  try {
    const d = JSON.parse(localStorage.getItem(KUNCI_STORAGE) || '{}');
    return d && typeof d === 'object' ? d : {};
  } catch {
    return {};
  }
}

/** Semua identitas SAH milik guru login untuk mencocokkan data try out.
 *  Urutan: kode `guruId` dulu, lalu docId, lalu `teacherId` (jika ada).
 *  Di-dedup & yang kosong dibuang; hasil ≤ 3 entri sehingga aman untuk
 *  query Firestore `where('tentorId','in', ids)` (batas 30 nilai). */
export function daftarIdGuru(dataGuru) {
  const d = dataGuru || bacaDataGuruLogin();
  const kandidat = [d.guruId, d.id, d.teacherId]
    .map((x) => (x == null ? '' : String(x).trim()))
    .filter(Boolean);
  return [...new Set(kandidat)];
}

/** Apakah `tentorId` yang tersimpan di Firestore merujuk ke guru login ini?
 *  Menerima docId MAUPUN kode GURU-0xx (data lama & baru sama-sama jalan). */
export function guruCocokDenganTentor(tentorId, dataGuru) {
  const t = tentorId == null ? '' : String(tentorId).trim();
  if (!t) return false; // paket tanpa tentor = bukan milik siapa-siapa
  return daftarIdGuru(dataGuru).includes(t);
}

/** Identitas untuk tampilan & penulisan sesi. SEMANTIK LAMA dipertahankan
 *  persis (guruId → id → nama) supaya sesi_presentasi dua guru paralel
 *  tidak tertukar; beda dulu hanya satu: kini ada `semuaId` & `docId`. */
export function bacaIdentitasGuru(dataGuru) {
  const d = dataGuru || bacaDataGuruLogin();
  return {
    guruId: String(d.guruId || d.id || d.nama || '').trim(),
    guruNama: String(d.nama || d.teacherName || 'Guru Gemilang'),
    docId: d.id == null ? '' : String(d.id).trim(),
    semuaId: daftarIdGuru(d),
  };
}
