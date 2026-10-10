// tests/bannerTargetSiswa.test.mjs — pagar & isi banner target di sisi siswa
// ============================================================
//     node tests/bannerTargetSiswa.test.mjs
//
// Permintaan owner: target tampil DI DEPAN nama & NIM siswa yang didaftarkan;
// SD & SMP "gak akan tersentuh karena gak didaftarkan". Test ini memastikan
// "gak tersentuh" itu benar-benar berarti null — bukan kartu kosong, bukan
// chip kosong, bukan error yang terlihat.
// ============================================================
import assert from 'node:assert/strict';
import {
  layakTampilTarget, teksChipTarget, susunBannerTarget, normJenjangSiswa,
} from '../src/utils/bannerTargetSiswa.js';
import { susunPerbandingan, bentukTarget } from '../src/utils/targetKampus.js';

let lulus = 0, gagal = 0;
function uji(n, f) {
  try { f(); lulus++; console.log(`  ✓ ${n}`); }
  catch (e) { gagal++; console.log(`  ✗ ${n}\n      ${String(e.message).slice(0, 220)}`); }
}

console.log('bannerTargetSiswa — pagar tampilan & isi banner');

const S = (v) => ({ nilai: v, statusData: v === null ? 'belum_tersedia' : 'belum_verifikasi', resmi: false, sumber: 'uji' });
const prodi = (o) => ({
  id: 'X', idPtn: 'P', namaPtn: 'Universitas Contoh', namaProdi: 'Prodi Contoh',
  dayaTampung: S(60), peminat: S(2980),
  skorReferensi: { minimum: S(672), rataRata: S(696), maksimum: S(740) },
  ...o,
});
const PETA = {
  'PTN-036|UI-01': prodi({ id: 'UI-01', idPtn: 'PTN-036', namaPtn: 'Universitas Indonesia', namaProdi: 'Pendidikan Dokter', skorReferensi: { minimum: S(715), rataRata: S(742), maksimum: S(785) } }),
  'PTN-077|UNEJ-01': prodi({ id: 'UNEJ-01', idPtn: 'PTN-077', namaPtn: 'Universitas Jember', namaProdi: 'Pendidikan Dokter', fakultas: 'Fakultas Kedokteran' }),
};
const target = () => bentukTarget({
  studentId: 'GEM-2027-001', tahunSeleksi: 2027,
  pilihan: [
    { urutan: 1, idPtn: 'PTN-036', idProdi: 'UI-01', labelPribadi: 'impian' },
    { urutan: 2, idPtn: 'PTN-077', idProdi: 'UNEJ-01', labelPribadi: 'cadangan' },
  ],
});
const banding = (t, skor) => susunPerbandingan(t, PETA, skor);

// ============================================================== PAGAR
uji('INVARIAN: SD & SMP tidak tersentuh walau semua data lain ada', () => {
  const t = target();
  for (const jenjang of ['SD', 'SMP', 'MI', 'MTs', 'sd', 'smp']) {
    const r = layakTampilTarget({ fiturAktif: true, jenjang, kelasSekolah: '12 SMA', target: t });
    assert.equal(r.layak, false, jenjang);
    assert.ok(r.alasan, 'harus ada alasan yang bisa dicatat');
  }
});

uji('INVARIAN: SMA kelas 10 & 11 tidak tampil — fitur ini untuk kelas 12', () => {
  for (const kelas of ['10 SMA', '11 SMA', '10', '11']) {
    assert.equal(
      layakTampilTarget({ fiturAktif: true, jenjang: 'SMA', kelasSekolah: kelas, target: target() }).layak,
      false, kelas,
    );
  }
  for (const kelas of ['12 SMA', '12', 'Kelas 12 SMA']) {
    assert.equal(
      layakTampilTarget({ fiturAktif: true, jenjang: 'SMA', kelasSekolah: kelas, target: target() }).layak,
      true, kelas,
    );
  }
});

uji('INVARIAN: siswa yang belum didaftarkan admin melihat dashboard lama', () => {
  const r = layakTampilTarget({ fiturAktif: true, jenjang: 'SMA', kelasSekolah: '12 SMA', target: null });
  assert.equal(r.layak, false);
  assert.match(r.alasan, /belum didaftarkan/);
  assert.equal(teksChipTarget(null, null), null, 'chip harus null, bukan string kosong');
  assert.equal(susunBannerTarget(null, null), null);
});

uji('INVARIAN: fitur mati -> tidak tampil walau siswa kelas 12 punya target', () => {
  const r = layakTampilTarget({ fiturAktif: false, jenjang: 'SMA', kelasSekolah: '12 SMA', target: target() });
  assert.equal(r.layak, false);
  assert.match(r.alasan, /belum aktif/);
});

uji('target tanpa pilihan tidak tampil (dokumen nyasar/rusak)', () => {
  const r = layakTampilTarget({
    fiturAktif: true, jenjang: 'SMA', kelasSekolah: '12 SMA',
    target: bentukTarget({ studentId: 'X', tahunSeleksi: 2027, pilihan: [] }),
  });
  assert.equal(r.layak, false);
});

uji('normJenjangSiswa mengenali varian penulisan yang ada di data', () => {
  assert.equal(normJenjangSiswa('SMA'), 'sma');
  assert.equal(normJenjangSiswa('MA'), 'sma');
  assert.equal(normJenjangSiswa('SMP/MTs'), 'smp');
  assert.equal(normJenjangSiswa('English'), 'english', 'program English bukan jenjang SMA');
});

// ================================================================ ISI
uji('chip menyebut GOAL, bukan skor — tujuan chip menanamkan target', () => {
  const t = target();
  const chip = teksChipTarget(t, banding(t, 685));
  assert.match(chip, /Goal/);
  assert.match(chip, /Pendidikan Dokter/);
  assert.match(chip, /Universitas Indonesia/);
  assert.ok(!/\d{3}/.test(chip), `chip tidak boleh memuat angka skor: ${chip}`);
});

uji('chip menunggu perbandingan dimuat — tidak menampilkan teks setengah', () => {
  // Dokumen target hanya menyimpan ID prodi. Menampilkan chip tanpa nama
  // berarti menampilkan "🎯 Goal: " kosong selama fetch -- lebih jujur
  // menunggu sepersekian detik daripada menampilkan teks setengah.
  assert.equal(teksChipTarget(target(), null), null);
});

uji('kartu menyebut kedua pilihan, zona, dan pengingat keputusan', () => {
  const t = target();
  const b = susunBannerTarget(t, banding(t, 685));
  assert.equal(b.pilihan.length, 2);
  assert.ok(b.baris.some((x) => /Pilihan 1/.test(x)));
  assert.ok(b.baris.some((x) => /Pilihan 2/.test(x) && /jaring pengaman/.test(x)));
  assert.ok(b.baris.some((x) => /Zona/.test(x)));
  assert.match(b.disclaimer, /bukan passing grade resmi/i);
  assert.match(b.disclaimer, /orang tua/);
  assert.match(b.judul, /2027/);
});

uji('INVARIAN: tanpa skor, kartu mengaku belum bisa menghitung zona', () => {
  const t = target();
  const b = susunBannerTarget(t, banding(t, null));
  assert.ok(b.baris.some((x) => /belum diinput/.test(x)), 'jangan tampil zona tanpa skor');
  assert.ok(!b.baris.some((x) => /Zona (Hijau|Kuning|Merah)/.test(x)), 'tidak boleh ada zona palsu');
});

uji('INVARIAN: skor acuan selalu disebut sebagai estimasi di kartu', () => {
  const t = target();
  const b = susunBannerTarget(t, banding(t, 685));
  const semua = b.baris.join(' ') + b.disclaimer;
  assert.match(semua, /estimasi|acuan/i);
  assert.ok(!/passing grade/i.test(b.baris.join(' ')), 'istilah terlarang tidak boleh muncul');
});

uji('kartu untuk prodi yang belum terdata tetap jujur, bukan kosong', () => {
  const t = bentukTarget({
    studentId: 'X', tahunSeleksi: 2027,
    pilihan: [{ urutan: 1, idPtn: 'PTN-999', idProdi: 'TIDAK-ADA' }],
  });
  const b = susunBannerTarget(t, susunPerbandingan(t, PETA, 685));
  assert.ok(b.baris.some((x) => /belum ada di database/i.test(x)));
});

console.log(`\n  LULUS: ${lulus}  GAGAL: ${gagal}`);
if (gagal > 0) process.exit(1);
console.log('✅ Semua test lulus.');
