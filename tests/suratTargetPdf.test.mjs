// tests/suratTargetPdf.test.mjs — surat target harus MUAT SATU KERTAS
//     node tests/suratTargetPdf.test.mjs
//
// Permintaan owner 2026-10-10 setelah melihat PDF pertama: "bisa gak jadikan
// satu kertas aja?" Surat ini ditempel di dinding & dibawa konsultasi;
// halaman kedua berarti setengah isi terpisah dari setengahnya.
// jsPDF berjalan di Node untuk teks & tabel standar, jadi jumlah halaman
// bisa dipaku oleh test -- bukan diklaim lalu ketahuan dua halaman di
// depan orang tua.
import assert from 'node:assert/strict';
import { renderSuratTargetPdf } from '../src/utils/suratTargetPdf.js';
import { isiSuratTarget } from '../src/utils/isiSuratTarget.js';
import { susunPerbandingan, bentukTarget } from '../src/utils/targetKampus.js';

let lulus = 0, gagal = 0;
function uji(n, f) {
  try { f(); lulus++; console.log(`  ✓ ${n}`); }
  catch (e) { gagal++; console.log(`  ✗ ${n}\n      ${String(e.message).slice(0, 200)}`); }
}
console.log('suratTargetPdf — satu kertas');

const S = (v) => ({ nilai: v, statusData: 'belum_verifikasi', resmi: false, sumber: 'riset' });
const prodi = (o) => ({
  id: 'X', idPtn: 'P', namaPtn: 'Universitas Contoh', namaProdi: 'Prodi Contoh', jenjang: 'S1', bidang: 'Saintek',
  dayaTampung: S(60), peminat: S(2980), keketatan: 0.02,
  skorReferensi: { minimum: S(672), rataRata: S(696), maksimum: S(740) },
  syaratKhusus: 'Wajib Bebas Buta Warna Total', subtesKunci: 'Penalaran Umum & Pengetahuan Kuantitatif',
  ...o,
});
const PETA = {
  'PTN-077|UNEJ-13': prodi({ id: 'UNEJ-13', idPtn: 'PTN-077', namaPtn: 'Universitas Jember', namaProdi: 'Teknik Pertambangan', fakultas: 'Fakultas Teknik', kampus: 'Kampus Jember', dayaTampung: S(40), peminat: S(1150), skorReferensi: { minimum: S(628), rataRata: S(652), maksimum: S(690) } }),
  'PTN-077|UNEJ-15': prodi({ id: 'UNEJ-15', idPtn: 'PTN-077', namaPtn: 'Universitas Jember', namaProdi: 'Teknik Sipil', fakultas: 'Fakultas Teknik', skorReferensi: { minimum: S(615), rataRata: S(640), maksimum: S(678) } }),
};
const siswa = { nama: 'Kaka Desta Rahmadani', studentId: 'STD-1226080001', kelasSekolah: '12 SMA', jenjang: 'SMA', kategori: 'Reguler', ortu: { ayah: 'Suryadi Rahmadani', ibu: 'Marni' } };
const target = bentukTarget({
  studentId: siswa.studentId, tahunSeleksi: 2027, versi: 1,
  pilihan: [
    { urutan: 1, idPtn: 'PTN-077', idProdi: 'UNEJ-13', labelPribadi: 'impian' },
    { urutan: 2, idPtn: 'PTN-077', idProdi: 'UNEJ-15', labelPribadi: 'cadangan' },
  ],
});
const buat = (skor) => isiSuratTarget({ siswa, target, pilihan: susunPerbandingan(target, PETA, skor).pilihan, skor, meta: { namaKonselor: 'Zalsabela Winanda Jelita' } });

uji('INVARIAN: formasi dua pilihan + skor + zona MUAT SATU HALAMAN', () => {
  const doc = renderSuratTargetPdf(buat(660), {});
  assert.equal(doc.getNumberOfPages(), 1, `dapat ${doc.getNumberOfPages()} halaman`);
  assert.ok(doc.output('arraybuffer').byteLength > 2000, 'PDF berisi');
});

uji('INVARIAN: tanpa skor (isi terpendek wajar) tetap satu halaman', () => {
  assert.equal(renderSuratTargetPdf(buat(null), {}).getNumberOfPages(), 1);
});

uji('nama orang tua & konselor panjang pun tetap satu halaman', () => {
  const s2 = { ...siswa, nama: 'Kaka Desta Rahmadani Putri Sulung Keluarga Rahmadani Banyuwangi', ortu: { ayah: 'Suryadi Rahmadani Bin Kaslan Bambang' } };
  const isi = isiSuratTarget({ siswa: s2, target, pilihan: susunPerbandingan(target, PETA, 660).pilihan, skor: 660, meta: { namaKonselor: 'Zalsabela Winanda Jelita S.Pd. M.Pd.' } });
  assert.equal(renderSuratTargetPdf(isi, {}).getNumberOfPages(), 1);
});

console.log(`\n  LULUS: ${lulus}  GAGAL: ${gagal}`);
if (gagal > 0) process.exit(1);
console.log('✅ Semua test lulus.');
