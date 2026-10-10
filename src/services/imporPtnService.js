// src/services/imporPtnService.js
// ============================================================
// Eksekutor rencana impor PTN ke Firestore. Logika pemeriksaannya ada di
// utils/rencanaImporPtn.js (murni, teruji); berkas ini hanya menjalankan.
//
// 🔥 KENAPA setDoc (overwrite), BUKAN addDoc
// Document ID diambil dari ID berkas sumber (PTN-077, UNEJ-01, REF-01).
// Impor ulang karena berkas diperbarui harus MENGGANTI dokumen lama, bukan
// menambah kembarannya. Konsekuensinya: impor adalah operasi "jadikan database
// seperti isi berkas ini", bukan "tambahkan isi berkas ini". Kalau suatu hari
// butuh penggabungan (mis. menambah PTN tanpa menyentuh yang lama), itu
// keputusan baru dengan aturan baru -- jangan diselundupkan di sini.
//
// ⚠️ Prodi yang sudah ADA di Firestore tapi TIDAK ADA di berkas akan tetap
// tinggal (impor tidak menghapus). Itu disengaja: menghapus otomatis berarti
// satu berkas lama yang salah unggah bisa menghapus data yang sudah
// diverifikasi manusia. Pembersihan adalah tindakan terpisah yang sadar.
// ============================================================

import { doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { pecahBatch } from '../utils/rencanaImporPtn.js';

function refDokumen(t) {
  if (t.koleksi === 'ptn') return doc(db, 'ptn', t.id);
  if (t.koleksi === 'ptn_prodi') return doc(db, 'ptn', t.idPtn, 'prodi', t.id);
  if (t.koleksi === 'subtes_utbk') return doc(db, 'subtes_utbk', t.id);
  if (t.koleksi === 'sumber_referensi') return doc(db, 'sumber_referensi', t.id);
  throw new Error(`koleksi tidak dikenal pada rencana impor: ${t.koleksi}`);
}

/**
 * Tulis seluruh rencana ke Firestore, per batch.
 *
 * @param {{tulis: Array}} rencana hasil rencanaPenulisan()
 * @param {object} [opt]
 * @param {(selesai:number, total:number)=>void} [opt.padaKemajuan]
 * @returns {Promise<{ditulis: number, batch: number}>}
 */
export async function tulisRencanaPtn(rencana, opt = {}) {
  const tulis = rencana?.tulis || [];
  if (!tulis.length) return { ditulis: 0, batch: 0 };

  // Semua ref dibuat dulu SEBELUM batch pertama. Kalau ada koleksi yang tidak
  // dikenal, ia melempar di sini -- sebelum satu dokumen pun tertulis, bukan
  // di tengah-tengah.
  const denganRef = tulis.map((t) => ({ ref: refDokumen(t), data: t.data }));

  const chunks = pecahBatch(denganRef);
  let selesai = 0;
  for (const chunk of chunks) {
    const batch = writeBatch(db);
    for (const item of chunk) batch.set(item.ref, item.data);
    // await di dalam loop di sini SENGAJA dan benar: batch harus commit
    // berurutan supaya progres bisa dilaporkan dan kegagalan berhenti di
    // batas batch yang jelas. (Rule no-await-in-loop tidak aktif untuk src/
    // di eslint.config.js, jadi tidak perlu arahan disable.)
    await batch.commit();
    selesai += chunk.length;
    if (typeof opt.padaKemajuan === 'function') opt.padaKemajuan(selesai, tulis.length);
  }
  return { ditulis: selesai, batch: chunks.length };
}

export default { tulisRencanaPtn };
