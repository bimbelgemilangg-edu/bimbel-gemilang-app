// src/services/bukuPdfService.js
// ============================================================
// KELOLA BUKU PDF OLEH OWNER/ADMIN (20 Okt): owner memutuskan MENGUNGGAH
// SENDIRI buku PDF-nya (asisten tidak lagi menaruh berkas manual).
// Layanan ini: unggah ke storage publik 'materi-bimbel/buku-pdf/',
// hitung total halaman via pdfjs, dan simpan katalog di Firestore
// koleksi `buku_pdf` (status aktif/draft) yang dibaca flipbook siswa
// & guru secara real-time.
// ============================================================
import { collection, getDocs, query, where, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { supabase } from './uploadService';
import { bukaPdf } from '../utils/modulPdf';
import { slugBukuPdf } from '../utils/bukuPdfFlip';

const BUCKET = 'materi-bimbel';

/** Unggah berkas PDF & kembalikan url publik + jumlah halaman. */
export async function unggahPdfBuku(file, judul = '') {
  const slug = slugBukuPdf(judul || file.name);
  const path = `buku-pdf/${slug}-${Date.now()}.pdf`;
  const up = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: 'application/pdf',
    upsert: false,
  });
  if (up.error) throw new Error(`Gagal unggah PDF: ${up.error.message}`);
  const url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  let totalHalaman = 0;
  try {
    const byte = new Uint8Array(await file.arrayBuffer());
    const pdf = await bukaPdf(byte);
    totalHalaman = pdf.numPages;
    await pdf.destroy();
  } catch { /* total halaman boleh menyusul dari form */ }
  return { url, path, totalHalaman };
}

export async function muatKatalogBukuPdf(db, hanyaAktif = true) {
  const q = hanyaAktif
    ? query(collection(db, 'buku_pdf'), where('status', '==', 'aktif'))
    : query(collection(db, 'buku_pdf'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => String(b.dibuatPada?.seconds || 0).localeCompare(String(a.dibuatPada?.seconds || 0)));
}

export async function simpanKatalogBukuPdf(db, entri = {}) {
  return addDoc(collection(db, 'buku_pdf'), {
    ...entri,
    status: entri.status || 'aktif',
    dibuatPada: serverTimestamp(),
  });
}

export async function perbaruiKatalogBukuPdf(db, id, tambalan = {}) {
  return updateDoc(doc(db, 'buku_pdf', id), tambalan);
}
