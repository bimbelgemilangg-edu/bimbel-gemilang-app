// src/services/izinAbsensiOtomatis.js
// ============================================================
// Menuliskan AKSES SUSULAN OTOMATIS akibat absensi Izin/Sakit yang dicatat
// tentor (kebijakan di utils/kebijakanAbsensi.js). Menulis ke koleksi
// `tryout_izin_ulang` -- koleksi yang SUDAH dihormati gerbang siswa
// (TryOutView.jsx) dan daftar siswa (DaftarTryOutPage.jsx), jadi tidak ada
// mekanisme akses kedua yang harus dirawat.
//
// Terhubung ke admin: dokumen membawa `sumber: 'absensi-otomatis'`,
// `diberikanOleh` nama tentor, dan `alasan` berisi status+tanggal, sehingga
// halaman Hasil & Ranking Try Out bisa menampilkan dari mana akses itu
// datang (chip "izin absensi"), dan admin tetap pemegang kendali penuh
// (dokumen bisa dihapus untuk mencabut akses).
// ============================================================

import { db } from '../firebase';
import { collection, doc, getDocs, query, setDoc, serverTimestamp, where } from 'firebase/firestore';
import { kebijakanUntukStatus, paketPerluIzinUlang, waktuBerlakuSampaiIso } from '../utils/kebijakanAbsensi.js';
import { cocokkanTargetPaket } from '../utils/cocokkanTargetPaket.js';

/**
 * @param {object} arg
 * @param {object} arg.siswa        { id, studentId, nama, kelasSekolah, kategori }
 * @param {string} arg.status       'Izin' | 'Sakit' (status lain -> tanpa efek)
 * @param {string} arg.tanggalStr   'YYYY-MM-DD' tanggal absen
 * @param {string} [arg.keterangan]
 * @param {string} arg.diberikanOleh nama tentor
 * @returns {Promise<string[]>} judul paket yang dibukakan
 */
export async function terapkanIzinAbsensiOtomatis({ siswa, status, tanggalStr, keterangan = '', diberikanOleh = '' }) {
  const keb = kebijakanUntukStatus(status);
  if (!keb.beriIzinUlang || !siswa) return [];
  const tanggalAbsenMs = new Date(`${tanggalStr}T00:00:00`).getTime();
  const sekarangMs = Date.now();

  const snapPaket = await getDocs(query(collection(db, 'tryout_paket'), where('status', '==', 'aktif')));
  const paketAktif = snapPaket.docs.map((d) => ({ id: d.id, ...d.data() }));
  const kandidat = paketAktif.filter((p) => cocokkanTargetPaket(p, siswa).cocok);
  if (!kandidat.length) return [];

  const snapSesi = await getDocs(query(collection(db, 'tryout_sesi'), where('studentId', '==', siswa.studentId || siswa.id)));
  const selesaiPerPaket = new Set(
    snapSesi.docs.map((d) => d.data()).filter((s) => s.status === 'selesai').map((s) => s.paketId),
  );

  const dibukakan = [];
  for (const paket of kandidat) {
    if (!paketPerluIzinUlang(paket, { tanggalAbsenMs, sekarangMs, adaSesiSelesai: selesaiPerPaket.has(paket.id) })) continue;
    await setDoc(doc(db, 'tryout_izin_ulang', `${paket.id}_${siswa.studentId || siswa.id}`), {
      paketId: paket.id,
      studentId: siswa.studentId || siswa.id,
      waktuBerlakuSampai: waktuBerlakuSampaiIso(sekarangMs),
      diberikanOleh: diberikanOleh || 'tentor',
      sumber: 'absensi-otomatis',
      alasan: `absensi ${status} tanggal ${tanggalStr}${keterangan ? `: ${keterangan}` : ''}`,
      createdAt: serverTimestamp(),
    }, { merge: true });
    dibukakan.push(paket.judul || paket.nama || paket.id);
  }
  return dibukakan;
}

export default { terapkanIzinAbsensiOtomatis };
