// tests/targetKampus.test.mjs — target kampus, formasi 2 pilihan, riwayat versi
// ============================================================
//     node tests/targetKampus.test.mjs
//
// Data uji di bawah memakai BENTUK DOKUMEN YANG SUNGGUHAN dari
// IMPOR-PTN-2026.json (UI-01 Pendidikan Dokter, UNEJ-01 Pendidikan Dokter,
// UNEJ-37 Sistem Informasi) dan angka siswa dari sheet SIMULATOR berkas owner.
// Jadi yang diuji adalah jalur data yang benar-benar akan berjalan, bukan
// bentuk karangan yang kebetulan cocok.
// ============================================================
import assert from 'node:assert/strict';
import {
  bentukTarget, validasiTarget, buatVersiBaru, susunPerbandingan, MAKS_PILIHAN,
} from '../src/utils/targetKampus.js';
import { ZONA } from '../src/utils/zonaKesiapan.js';
// Catatan: berkas uji ini memakai pembungkus skor tiruan (S() di bawah) yang
// bentuknya meniru hasil statusDataPtn.bungkusAngka(), supaya status data bisa
// diatur per kasus. Bentuk aslinya sudah diuji terpisah oleh
// tests/parsePtnExcel.test.mjs.

let lulus = 0, gagal = 0;
function uji(n, f) {
  try { f(); lulus++; console.log(`  ✓ ${n}`); }
  catch (e) { gagal++; console.log(`  ✗ ${n}\n      ${String(e.message).slice(0, 240)}`); }
}

console.log('targetKampus — formasi 2 pilihan & riwayat versi');

// ---- bentuk dokumen persis seperti hasil scripts/bangun-impor-ptn.py ----
const S = (v) => ({ nilai: v, statusData: v === null ? 'belum_tersedia' : 'belum_verifikasi', resmi: false, sumber: 'uji', sumberUrl: null, diambilPada: null, tahunSeleksi: 2027 });
const prodi = (o) => ({
  id: 'X', idPtn: 'PTN-000', namaPtn: 'Universitas Contoh', namaProdi: 'Prodi Contoh',
  jenjang: 'S1', bidang: 'Saintek', wilayah: 'Jawa Timur', kampus: null, fakultas: null,
  dayaTampung: S(60), peminat: S(2980), keketatan: 60 / 2980,
  skorReferensi: { minimum: S(672), rataRata: S(696), maksimum: S(740) },
  syaratKhusus: 'Wajib Bebas Buta Warna Total',
  subtesKunci: 'Penalaran Umum & Pengetahuan Kuantitatif',
  statusData: 'belum_verifikasi', jalurSeleksi: 'snbt',
  ...o,
});

const UI_KEDOKTERAN = prodi({
  id: 'UI-01', idPtn: 'PTN-036', namaPtn: 'Universitas Indonesia', namaProdi: 'Pendidikan Dokter',
  wilayah: 'Jabodetabek', dayaTampung: S(75), peminat: S(3820), keketatan: 75 / 3820,
  skorReferensi: { minimum: S(715), rataRata: S(742), maksimum: S(785) },
  subtesKunci: 'Penalaran Matematika & Pengetahuan Kuantitatif',
});
const UNEJ_KEDOKTERAN = prodi({
  id: 'UNEJ-01', idPtn: 'PTN-077', namaPtn: 'Universitas Jember', namaProdi: 'Pendidikan Dokter',
  fakultas: 'Fakultas Kedokteran', kampus: 'Kampus Jember',
  dayaTampung: S(60), peminat: S(2980),
  skorReferensi: { minimum: S(672), rataRata: S(696), maksimum: S(740) },
  subtesKunci: 'Penalaran Umum & Pengetahuan Kuantitatif',
});
const TANPA_SKOR = prodi({
  id: 'UNEJ-99', idPtn: 'PTN-077', namaProdi: 'Prodi Baru Belum Ada Data',
  skorReferensi: { minimum: S(null), rataRata: S(null), maksimum: S(null) },
});

const PETA = {
  'PTN-036|UI-01': UI_KEDOKTERAN,
  'PTN-077|UNEJ-01': UNEJ_KEDOKTERAN,
  'PTN-077|UNEJ-99': TANPA_SKOR,
};

const targetContoh = (o = {}) => bentukTarget({
  studentId: 'GEM-UJI-001',
  tahunSeleksi: 2027,
  pilihan: [
    { urutan: 1, idPtn: 'PTN-036', idProdi: 'UI-01', labelPribadi: 'impian' },
    { urutan: 2, idPtn: 'PTN-077', idProdi: 'UNEJ-01', labelPribadi: 'cadangan dekat rumah' },
  ],
  targetSkorPribadi: 700,
  ...o,
});

// ============================================================= VALIDASI
uji('target sah lolos validasi', () => {
  const r = validasiTarget(targetContoh());
  assert.deepEqual(r.masalah, []);
  assert.equal(r.sah, true);
});

uji('INVARIAN: lebih dari 2 pilihan ditolak (SNBT hanya mengizinkan 2)', () => {
  const t = targetContoh({
    pilihan: [
      { urutan: 1, idPtn: 'PTN-036', idProdi: 'UI-01' },
      { urutan: 2, idPtn: 'PTN-077', idProdi: 'UNEJ-01' },
      { urutan: 3, idPtn: 'PTN-056', idProdi: 'UGM-01' },
    ],
  });
  const r = validasiTarget(t);
  assert.equal(r.sah, false);
  assert.ok(r.masalah.some((m) => /maksimal 2/.test(m)), r.masalah.join('; '));
});

uji('INVARIAN: bentukTarget tidak pernah menelan masukan secara diam-diam', () => {
  // Versi pertama fungsi ini memotong pilihan ke-3 dan mengubah
  // targetSkorPribadi yang bukan angka jadi null. Keduanya membuat admin
  // mengira datanya tersimpan. Sekarang bentukTarget hanya menata bentuk;
  // yang menolak adalah validasiTarget, dengan pesan.
  const t = bentukTarget({
    studentId: 'X', tahunSeleksi: 2027, targetSkorPribadi: '7OO',
    pilihan: [{ idPtn: 'a', idProdi: '1' }, { idPtn: 'b', idProdi: '2' }, { idPtn: 'c', idProdi: '3' }],
  });
  assert.equal(t.pilihan.length, 3, 'pilihan ke-3 tidak boleh dibuang diam-diam');
  assert.equal(t.targetSkorPribadi, '7OO', 'salah ketik harus tetap terlihat, bukan jadi null');
  const r = validasiTarget(t);
  assert.equal(r.sah, false);
  assert.ok(r.masalah.some((m) => /maksimal 2/.test(m)));
  assert.ok(r.masalah.some((m) => /bukan angka/.test(m)));
});

uji('Pilihan 1 dan 2 menunjuk prodi yang sama -> ditolak', () => {
  const t = targetContoh({
    pilihan: [
      { urutan: 1, idPtn: 'PTN-077', idProdi: 'UNEJ-01' },
      { urutan: 2, idPtn: 'PTN-077', idProdi: 'UNEJ-01' },
    ],
  });
  const r = validasiTarget(t);
  assert.equal(r.sah, false);
  assert.ok(r.masalah.some((m) => /sama/.test(m)));
});

uji('prodi bernama sama di PTN BERBEDA boleh (itu justru inti perbandingan)', () => {
  // "Pendidikan Dokter" ada di 8 PTN di berkas sumber. Membandingkan Kedokteran
  // UI dengan Kedokteran UNEJ adalah kasus pakai utama fitur ini, jadi yang
  // diidentifikasi adalah PASANGAN (idPtn, idProdi), bukan nama prodinya.
  const t = targetContoh();
  assert.equal(t.pilihan[0].idProdi, 'UI-01');
  assert.equal(t.pilihan[1].idProdi, 'UNEJ-01');
  assert.notEqual(t.pilihan[0].idPtn, t.pilihan[1].idPtn, 'PTN-nya memang berbeda');
  assert.equal(validasiTarget(t).sah, true);

  const h = susunPerbandingan(t, PETA, 685);
  assert.equal(h.pilihan[0].namaProdi, h.pilihan[1].namaProdi, 'namanya sama di kartu');
  assert.notEqual(h.pilihan[0].namaPtn, h.pilihan[1].namaPtn, 'tapi kampusnya beda');
  assert.equal(h.pilihan[0].skorReferensi.minimum.nilai, 715);
  assert.equal(h.pilihan[1].skorReferensi.minimum.nilai, 672, 'skor acuan tidak boleh tertukar');
});

uji('idProdi sama tapi PTN berbeda tetap dua pilihan yang sah', () => {
  // Kasus nyata: UNEJ punya prodi bernama sama di kampus berbeda, dan dua PTN
  // bisa memakai kode prodi yang kebetulan sama. Yang membuat dua pilihan itu
  // "sama" adalah bila KEDUA kuncinya sama.
  const t = targetContoh({
    pilihan: [
      { urutan: 1, idPtn: 'PTN-036', idProdi: 'KODE-SAMA' },
      { urutan: 2, idPtn: 'PTN-077', idProdi: 'KODE-SAMA' },
    ],
  });
  assert.equal(validasiTarget(t).sah, true);
});

uji('tahunSeleksi kosong ditolak — tanpa itu data tahun lama & baru tercampur', () => {
  // Blueprint §1: "Sistem harus menyimpan riwayat perubahan agar target lama
  // tidak tercampur dengan target baru."
  const r = validasiTarget(targetContoh({ tahunSeleksi: null }));
  assert.equal(r.sah, false);
  assert.ok(r.masalah.some((m) => /tahunSeleksi/.test(m)));
});

uji('targetSkorPribadi boleh kosong, tapi tidak boleh ngawur', () => {
  assert.equal(validasiTarget(targetContoh({ targetSkorPribadi: null })).sah, true,
    'siswa yang belum berani memasang angka tidak boleh dipaksa mengarang');
  for (const v of [-10, 1500, 'abc']) {
    assert.equal(validasiTarget(targetContoh({ targetSkorPribadi: v })).sah, false, `nilai ${v}`);
  }
  assert.equal(validasiTarget(targetContoh({ targetSkorPribadi: 700 })).sah, true);
});

uji('pilihan tanpa idPtn/idProdi ditolak dengan nomor pilihannya', () => {
  const r = validasiTarget(targetContoh({
    pilihan: [{ urutan: 1, idPtn: '', idProdi: 'UI-01' }, { urutan: 2, idPtn: 'PTN-077', idProdi: '' }],
  }));
  assert.equal(r.sah, false);
  assert.ok(r.masalah.some((m) => /Pilihan 1: idPtn/.test(m)), r.masalah.join('; '));
  assert.ok(r.masalah.some((m) => /Pilihan 2: idProdi/.test(m)));
});

// ======================================================= VERSI & RIWAYAT
uji('versi baru menaikkan nomor dan MENYIMPAN snapshot versi lama', () => {
  const lama = targetContoh({ versi: 3, targetSkorPribadi: 700 });
  const r = buatVersiBaru(lama, { targetSkorPribadi: 720 }, { diubahOleh: 'owner', alasanPerubahan: 'siswa menaikkan target setelah TO 4' });
  assert.equal(r.ditolak, null);
  assert.equal(r.target.versi, 4);
  assert.equal(r.target.targetSkorPribadi, 720);
  assert.equal(r.riwayat.versi, 3, 'riwayat menyimpan versi LAMA');
  assert.equal(r.riwayat.snapshot.targetSkorPribadi, 700, 'angka lama tidak boleh hilang');
  assert.equal(r.riwayat.alasanPerubahan, 'siswa menaikkan target setelah TO 4');
});

uji('INVARIAN: perubahan tanpa alasan DITOLAK', () => {
  // Tanpa alasan, riwayat hanya menyimpan angka lama tanpa menjelaskan kenapa
  // berpindah -- tidak berguna saat konsultasi dan tidak bisa diaudit.
  const lama = targetContoh({ versi: 1 });
  for (const alasan of ['', null, undefined, '   ']) {
    const r = buatVersiBaru(lama, { targetSkorPribadi: 720 }, { alasanPerubahan: alasan });
    assert.ok(r.ditolak, `alasan ${JSON.stringify(alasan)} harus ditolak`);
    assert.equal(r.target.targetSkorPribadi, 700, 'target lama tidak boleh berubah');
    assert.match(r.ditolak.alasan, /alasanPerubahan wajib/);
  }
});

uji('perubahan yang menghasilkan target tidak sah ditolak, target lama utuh', () => {
  const lama = targetContoh({ versi: 2 });
  const r = buatVersiBaru(lama, { pilihan: [] }, { alasanPerubahan: 'coba kosongkan' });
  assert.ok(r.ditolak);
  assert.equal(r.target.versi, 2);
  assert.equal(r.target.pilihan.length, 2);
});

uji('snapshot riwayat adalah salinan dalam, bukan rujukan yang ikut berubah', () => {
  const lama = targetContoh({ versi: 1 });
  const r = buatVersiBaru(lama, { targetSkorPribadi: 750 }, { alasanPerubahan: 'x' });
  r.target.pilihan[0].labelPribadi = 'diubah setelahnya';
  assert.equal(r.riwayat.snapshot.pilihan[0].labelPribadi, 'impian',
    'riwayat harus tetap menggambarkan keadaan saat itu');
});

uji('target pertama kali dibuat tidak punya riwayat (belum ada yang digantikan)', () => {
  const r = buatVersiBaru(null, {
    studentId: 'GEM-UJI-002', tahunSeleksi: 2027,
    pilihan: [{ idPtn: 'PTN-077', idProdi: 'UNEJ-01' }],
  }, { alasanPerubahan: 'pengisian awal' });
  assert.equal(r.ditolak, null);
  assert.equal(r.target.versi, 1);
  assert.equal(r.riwayat, null);
});

uji('field yang tidak diganti ikut terbawa ke versi baru', () => {
  const lama = targetContoh({ versi: 5, tahunSeleksi: 2027, targetSkorPribadi: 700 });
  const r = buatVersiBaru(lama, { targetSkorPribadi: 710 }, { alasanPerubahan: 'naik 10 poin' });
  assert.equal(r.target.tahunSeleksi, 2027, 'tahunSeleksi tidak boleh hilang');
  assert.equal(r.target.pilihan.length, 2, 'pilihan tidak boleh hilang');
  assert.equal(r.target.studentId, 'GEM-UJI-001');
});

// ========================================================== PERBANDINGAN
uji('perbandingan 2 pilihan menghasilkan zona + formasi seperti sheet SIMULATOR', () => {
  // Angka persis dari berkas owner: siswa 685, UI Kedokteran min 715,
  // UNEJ Kedokteran min 672.
  const h = susunPerbandingan(targetContoh(), PETA, 685);
  assert.equal(h.pilihan.length, 2);
  assert.equal(h.pilihan[0].gapMinimum, -30);
  assert.equal(h.pilihan[1].gapMinimum, 13);
  assert.equal(h.pilihan[0].zona.id, ZONA.MERAH, 'UI Kedokteran -30 = Zona Merah');
  assert.equal(h.pilihan[1].zona.id, ZONA.HIJAU_KOMPETITIF);
  assert.equal(h.formasi.aman, false, 'Pilihan 1 merah -> formasi tidak aman');
  assert.ok(h.formasi.catatan.some((c) => /Zona Merah/.test(c)));
});

uji('setiap baris perbandingan membawa data yang dibutuhkan kartu', () => {
  const h = susunPerbandingan(targetContoh(), PETA, 685);
  for (const b of h.pilihan) {
    assert.ok(b.namaPtn && b.namaProdi, 'identitas harus ada');
    assert.ok(b.dayaTampung && typeof b.dayaTampung.nilai === 'number', 'daya tampung');
    assert.ok(b.skorReferensi?.minimum, 'skor acuan');
    assert.equal(b.skorReferensi.minimum.resmi, false, 'harus mengaku bukan angka resmi');
    assert.equal(b.skorReferensi.minimum.statusData, 'belum_verifikasi');
    assert.ok(b.syaratKhusus, 'syarat khusus perlu terlihat sejak dini');
    assert.ok(b.subtesKunci, 'arah belajar');
    assert.ok(Array.isArray(b.peringatan) && b.peringatan.length > 0, 'peringatan wajib ada');
  }
});

uji('INVARIAN: prodi di luar database -> tersedia:false + penjelasan, bukan kartu kosong', () => {
  // Ini kejadian NYATA, bukan tepi kasus: hanya 266 prodi dari 32 PTN yang
  // terdata. 125 PTN tidak punya satu pun prodi.
  const t = targetContoh({
    pilihan: [
      { urutan: 1, idPtn: 'PTN-999', idProdi: 'TIDAK-ADA', labelPribadi: 'impian' },
      { urutan: 2, idPtn: 'PTN-077', idProdi: 'UNEJ-01' },
    ],
  });
  const h = susunPerbandingan(t, PETA, 685);
  assert.equal(h.pilihan[0].tersedia, false);
  assert.ok(/belum ada di database/i.test(h.pilihan[0].alasan));
  assert.ok(/266 prodi/.test(h.pilihan[0].alasan), 'harus jujur soal cakupan database');
  assert.equal(h.pilihan[1].tersedia, true);
  assert.equal(h.formasi.label, 'Belum bisa dinilai');
});

uji('INVARIAN: prodi tanpa skor acuan -> zona TANPA_DATA, bukan merah atau hijau', () => {
  const t = targetContoh({
    pilihan: [
      { urutan: 1, idPtn: 'PTN-077', idProdi: 'UNEJ-99' },
      { urutan: 2, idPtn: 'PTN-077', idProdi: 'UNEJ-01' },
    ],
  });
  const h = susunPerbandingan(t, PETA, 685);
  assert.equal(h.pilihan[0].tersedia, true, 'prodinya ADA, hanya skornya yang belum');
  assert.equal(h.pilihan[0].zona.id, ZONA.TANPA_DATA);
  assert.equal(h.pilihan[0].gapMinimum, null);
  assert.equal(h.adaZonaTanpaData, true);
});

uji('INVARIAN: skor siswa kosong tercatat null, bukan 0', () => {
  // Number('') === 0. Kalau ini lolos, siswa yang belum pernah try out akan
  // terlihat punya skor 0 dan seluruh zonasinya jadi merah palsu.
  for (const s of [null, undefined, '', 'abc', NaN]) {
    const h = susunPerbandingan(targetContoh(), PETA, s);
    assert.equal(h.skorSiswa, null, `skor ${JSON.stringify(s)}`);
    assert.equal(h.pilihan[0].gapMinimum, null);
    assert.equal(h.pilihan[0].zona.id, ZONA.TANPA_DATA);
  }
});

uji('skor siswa berupa string numerik tetap diterima (data Firestore tidak seragam)', () => {
  const h = susunPerbandingan(targetContoh(), PETA, '685');
  assert.equal(h.skorSiswa, 685);
  assert.equal(h.pilihan[1].gapMinimum, 13);
});

uji('data prodi boleh diberikan sebagai Map atau objek biasa', () => {
  const sebagaiMap = new Map(Object.entries(PETA));
  const a = susunPerbandingan(targetContoh(), sebagaiMap, 685);
  const b = susunPerbandingan(targetContoh(), PETA, 685);
  assert.deepEqual(a.pilihan.map((x) => x.gapMinimum), b.pilihan.map((x) => x.gapMinimum));
});

uji('perbandingan tanpa data prodi sama sekali tidak melempar error', () => {
  const h = susunPerbandingan(targetContoh(), {}, 685);
  assert.equal(h.pilihan.length, 2);
  assert.ok(h.pilihan.every((b) => b.tersedia === false));
});

uji('labelPribadi siswa dibawa apa adanya, tidak ditafsirkan sistem', () => {
  // "impian" dan "cadangan dekat rumah" adalah sebutan siswa. Blueprint §3D:
  // pilihan kampus tetap keputusan siswa bersama orang tua & pembimbing.
  const h = susunPerbandingan(targetContoh(), PETA, 685);
  assert.equal(h.pilihan[0].labelPribadi, 'impian');
  assert.equal(h.pilihan[1].labelPribadi, 'cadangan dekat rumah');
});

uji('hasil perbandingan menyebut versi target yang dipakai', () => {
  // Supaya grafik perkembangan tidak membandingkan skor lama dengan target baru.
  const h = susunPerbandingan(targetContoh({ versi: 7 }), PETA, 685);
  assert.equal(h.versi, 7);
  assert.equal(h.tahunSeleksi, 2027);
  assert.equal(h.targetSkorPribadi, 700);
});

console.log(`\n  LULUS: ${lulus}  GAGAL: ${gagal}`);
if (gagal > 0) process.exit(1);
console.log('✅ Semua test lulus.');
