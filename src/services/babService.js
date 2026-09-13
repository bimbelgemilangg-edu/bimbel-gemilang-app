// src/services/babService.js
// Adapter penyimpanan buku & bab. SATU file ini saja yang perlu
// disesuaikan dengan struktur data repomu (koleksi & field array bab).
import { collection, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase'; // ← SESUAIKAN jalur import firebase-mu

export const KOLEKSI_BUKU = 'buku';  // ← sesuaikan nama koleksi buku
export const FIELD_BAB = 'bab';      // ← sesuaikan field array bab di dokumen buku

export function ambilDaftarBab(buku) {
  if (!buku) return [];
  return buku[FIELD_BAB] || buku.chapters || buku.daftarBab || [];
}

export async function ambilDaftarBuku() {
  const snap = await getDocs(collection(db, KOLEKSI_BUKU));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function ambilBuku(bukuId) {
  const snap = await getDoc(doc(db, KOLEKSI_BUKU, bukuId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function simpanBabKeBuku(bukuId, indexBab, bab) {
  const ref = doc(db, KOLEKSI_BUKU, bukuId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Buku tidak ditemukan: ' + bukuId);
  const daftar = ambilDaftarBab(snap.data()).slice();
  const bersih = JSON.parse(JSON.stringify(bab));
  if (indexBab == null || indexBab < 0 || indexBab >= daftar.length) daftar.push(bersih);
  else daftar[indexBab] = bersih;
  await updateDoc(ref, { [FIELD_BAB]: daftar });
  return daftar;
}

export async function hapusBabKeBuku(bukuId, indexBab) {
  const ref = doc(db, KOLEKSI_BUKU, bukuId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Buku tidak ditemukan: ' + bukuId);
  const daftar = ambilDaftarBab(snap.data()).slice();
  if (indexBab < 0 || indexBab >= daftar.length) throw new Error('Index bab tidak valid: ' + indexBab);
  daftar.splice(indexBab, 1);
  await updateDoc(ref, { [FIELD_BAB]: daftar });
  return daftar;
}