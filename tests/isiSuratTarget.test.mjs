// tests/isiSuratTarget.test.mjs — isi surat pernyataan target & komitmen
// ============================================================
//     node tests/isiSuratTarget.test.mjs
//
// Surat ini dokumen RESMI berlogo yang dipegang siswa & orang tua. Yang diuji
// di sini bukan tampilan tapi JANJINYA: berisi data riset yang benar,
// komitmen bersuara siswa, dan tidak mencetak klaim yang tidak bisa
// ditepati. Owner memutuskan label verifikasi tidak tampil di dashboard
// siswa (dijelaskan admin langsung) -- tapi catatan kaki surat tetap jujur
// bahwa skor acuan adalah riset internal, bukan pengumuman panitia.
// ============================================================
import assert from 'node:assert/strict';
import { isiSuratTarget, tanggalSurat } from '../src/utils/isiSuratTarget.js';
import { susunPerbandingan, bentukTarget } from '../src/utils/targetKampus.js';

let lulus = 0, gagal = 0;
function uji(n, f) {
  try { f(); lulus++; console.log(`  ✓ ${n}`); }
  catch (e) { gagal++; console.log(`  ✗ ${n}\n      ${String(e.message).slice(0, 220)}`); }
}

console.log('isiSuratTarget — surat pernyataan target & komitmen');

const S = (v) => ({ nilai: v, statusData: v === null ? 'belum_tersedia' : 'belum_verifikasi', resmi: false, sumber: 'riset' });
const prodi = (o) => ({
  id: 'X', idPtn: 'P', namaPtn: 'Universitas Contoh', namaProdi: 'Prodi Contoh', jenjang: 'S1', bidang: 'Saintek',
  dayaTampung: S(60), peminat: S(2980), keketatan: 60 / 2980,
  skorReferensi: { minimum: S(672), rataRata: S(696), maksimum: S(740) },
  syaratKhusus: 'Wajib Bebas Buta Warna Total', subtesKunci: 'Penalaran Umum & Pengetahuan Kuantitatif',
  ...o,
});
const PETA = {
  'PTN-077|UNEJ-13': prodi({ id: 'UNEJ-13', idPtn: 'PTN-077', namaPtn: 'Universitas Jember', namaProdi: 'Teknik Pertambangan', fakultas: 'Fakultas Teknik', kampus: 'Kampus Jember', dayaTampung: S(40), peminat: S(1150), skorReferensi: { minimum: S(628), rataRata: S(652), maksimum: S(690) } }),
  'PTN-077|UNEJ-15': prodi({ id: 'UNEJ-15', idPtn: 'PTN-077', namaPtn: 'Universitas Jember', namaProdi: 'Teknik Sipil', fakultas: 'Fakultas Teknik', kampus: 'Kampus Jember', dayaTampung: S(65), peminat: S(1280), skorReferensi: { minimum: S(615), rataRata: S(640), maksimum: S(678) } }),
};
const siswa = {
  nama: 'Kaka Desta Rahmadani', studentId: 'STD-1226080001', kelasSekolah: '12 SMA', jenjang: 'SMA',
  kategori: 'Reguler', ortu: { ayah: 'Suryadi', ibu: 'Marni' },
};
const target = () => bentukTarget({
  studentId: siswa.studentId, tahunSeleksi: 2027, versi: 1,
  pilihan: [
    { urutan: 1, idPtn: 'PTN-077', idProdi: 'UNEJ-13', labelPribadi: 'impian' },
    { urutan: 2, idPtn: 'PTN-077', idProdi: 'UNEJ-15', labelPribadi: 'cadangan' },
  ],
});
const surat = (skor) => isiSuratTarget({ siswa, target: target(), pilihan: susunPerbandingan(target(), PETA, skor).pilihan, skor });

uji('kop, judul, dan tanggal surat terbentuk', () => {
  const s = surat(660);
  assert.equal(s.kop.institusi, 'BIMBEL GEMILANG');
  assert.match(s.kop.judulDok, /SURAT PERNYATAAN TARGET/);
  assert.match(s.tanggal, /\d{1,2} \w+ \d{4}/);
  assert.match(tanggalSurat(new Date(2026, 9, 10), 'Banyuwangi'), /Banyuwangi, 10 Oktober 2026/);
});

uji('profil siswa lengkap termasuk orang tua untuk tanda tangan', () => {
  const s = surat(660);
  const peta = Object.fromEntries(s.identitas);
  assert.equal(peta.Nama, 'Kaka Desta Rahmadani');
  assert.equal(peta['Nomor Induk Bimbel'], 'STD-1226080001');
  assert.equal(peta['Kelas / Jenjang'], '12 SMA / SMA');
  assert.equal(peta['Nama Orang Tua/Wali'], 'Suryadi');
  assert.equal(s.tandaTangan.length, 3);
  assert.equal(s.tandaTangan[0].nama, 'Suryadi', 'kolom orang tua terisi nama, bukan titik-titik');
});

uji('tabel memuat data riset: tampung, peminat, rentang skor, syarat', () => {
  const s = surat(660);
  assert.equal(s.tabel.baris.length, 2);
  const [b1] = s.tabel.baris;
  assert.deepEqual(b1.slice(0, 3), ['Pilihan 1', 'Teknik Pertambangan', 'Universitas Jember']);
  assert.equal(b1[3], 40, 'daya tampung');
  assert.equal(b1[4], 1150, 'peminat');
  assert.equal(b1[5], '628 – 690', 'rentang skor acuan min-maks');
  assert.match(b1[6], /Buta Warna/, 'syarat khusus ikut tercetak');
});

uji('rincian menyebut keketatan, subtes kunci, dan posisi siswa', () => {
  const s = surat(660);
  const gab = s.rincian.map((r) => r.kalimat.join(' ')).join(' ');
  assert.match(gab, /keketatan/);
  assert.match(gab, /Subtes kunci/);
  assert.match(gab, /selisih \+32|\+32/, 'gap 660-628 = +32 harus disebut');
  assert.match(gab, /Zona Hijau/);
  assert.match(gab, /1x try out \/ 2 minggu/, 'rencana drill dari zona ikut tercetak');
});

uji('INVARIAN: komitmen bersuara SISWA, bukan perintah lembaga', () => {
  const s = surat(660);
  assert.ok(s.komitmen.length >= 4);
  const aku = s.komitmen.filter((k) => /\bsaya\b/i.test(k)).length;
  assert.equal(aku, s.komitmen.length, 'setiap kalimat komitmen memakai suara pertama');
  assert.ok(!s.komitmen.some((k) => /dilarang|wajib Anda|harus kamu/i.test(k)), 'tidak bernada larangan');
});

uji('INVARIAN: tanpa skor, surat tidak mengarang zona', () => {
  const s = surat(null);
  const gab = JSON.stringify(s);
  assert.ok(!/Zona (Hijau|Kuning|Merah)/.test(gab), 'tidak boleh ada zona tanpa skor');
  assert.ok(s.komitmen.some((k) => /menyusun rencana belajar mingguan saya bersama pembimbing/.test(k)),
    'janji tetap ada, bentuknya jujur');
});

uji('INVARIAN: tidak ada istilah terlarang di seluruh isi surat', () => {
  const s = surat(660);
  const gab = JSON.stringify(s).toLowerCase();
  assert.ok(!/passing grade/.test(gab));
  assert.ok(!/belum_verifikasi|belum terverifikasi/.test(gab), 'label verifikasi tidak dicetak (dijelaskan admin)');
  assert.ok(!/persen peluang|\d+%/.test(gab), 'tidak ada persentase peluang');
});

uji('catatan kaki tetap jujur walau surat tampil resmi', () => {
  const s = surat(660);
  assert.match(s.catatanKaki, /riset internal/i);
  assert.match(s.catatanKaki, /bukan pengumuman resmi/i);
});

uji('prodi yang tidak terdata tidak ikut tercetak sebagai pilihan', () => {
  const t = target();
  const perbandingan = susunPerbandingan(t, {}, 660); // database kosong
  const s = isiSuratTarget({ siswa, target: t, pilihan: perbandingan.pilihan, skor: 660 });
  assert.equal(s.tabel.baris.length, 0);
  assert.equal(s.rincian.length, 0);
});

console.log(`\n  LULUS: ${lulus}  GAGAL: ${gagal}`);
if (gagal > 0) process.exit(1);
console.log('✅ Semua test lulus.');
