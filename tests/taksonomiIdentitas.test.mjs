// tests/taksonomiIdentitas.test.mjs
// ============================================================
// Uji titik tulis identitas bank soal: `terapkanTaksonomi`
// (src/utils/mesinTaksonomiSoal.js) + kosakata jenjang baku
// (src/utils/jenjangBaku.js).
//
//     node tests/taksonomiIdentitas.test.mjs
//
// KENAPA INI PENTING
// Owner 2026-10-08 mau membuka fitur "tentor bisa akses bank soal"
// dengan alur pilih jenjang -> mapel -> materi. Semua penyaring itu
// membandingkan string PERSIS, sedangkan bank soal diisi lima jalur
// tulis dengan dua kosakata jenjang berbeda ('SMA' vs 'SMA/MA') dan dua
// nama field materi berbeda (`bab` vs `materi`). Hasilnya: soal yang
// sehat lenyap dari layar tentor tanpa error apa pun.
//
// Uji di bawah memaku tiga janji:
//   1. titik tulis selalu menghasilkan kosakata baku,
//   2. nilai lama TIDAK pernah dibuang (disimpan di jenjangSebelumBaku),
//   3. nilai yang tidak dikenali TIDAK pernah dikarang,
//   4. `deteksiJenjangKelas` tetap berperilaku lama (dipakai petaKonten
//      yang sudah teruji) — kanonisasi hanya di titik tulis.
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  terapkanTaksonomi,
  deteksiTaksonomiSoal,
  deteksiJenjangKelas,
} from '../src/utils/mesinTaksonomiSoal.js';
import { JENJANG_BAKU, jenjangBaku, sudahBaku } from '../src/utils/jenjangBaku.js';

const tak = (tambahan = {}) => ({
  jenjang: 'SMA',
  kelas: '12',
  mapel: 'Matematika',
  kodeMapel: 'mtk',
  bab: 'Barisan dan Deret',
  topik: 'Deret Aritmetika',
  kelompok: 'Wajib',
  sumber: 'impor.json',
  yakin: 0.8,
  ...tambahan,
});

// ------------------------------------------------------------
// 1. Kanonisasi jenjang di titik tulis
// ------------------------------------------------------------

test('jenjang kosakata lama diseragamkan ke baku saat ditulis', () => {
  const hasil = terapkanTaksonomi({}, tak());
  assert.equal(hasil.jenjang, 'SMA/MA');
});

test('nilai lama TIDAK dibuang — disimpan jujur di jenjangSebelumBaku', () => {
  const hasil = terapkanTaksonomi({ jenjang: 'SMP' }, tak({ jenjang: '' }));
  assert.equal(hasil.jenjang, 'SMP/MTs');
  assert.equal(hasil.jenjangSebelumBaku, 'SMP');
});

test('jenjang yang sudah baku tidak ditandai berubah', () => {
  const hasil = terapkanTaksonomi({}, tak({ jenjang: 'SMA/MA' }));
  assert.equal(hasil.jenjang, 'SMA/MA');
  assert.equal(hasil.jenjangSebelumBaku, undefined);
});

test('jejak nilai lama HANYA ditulis bila ada yang benar-benar ditimpa', () => {
  // Jenjang datang dari deteksi taksonomi, dokumen belum punya jenjang:
  // tidak ada informasi yang hilang, jadi tidak ada yang perlu diselamatkan.
  const tanpaLama = terapkanTaksonomi({}, tak({ jenjang: 'SMA' }));
  assert.equal(tanpaLama.jenjang, 'SMA/MA');
  assert.equal(tanpaLama.jenjangSebelumBaku, undefined);

  // Dokumen SUDAH punya jenjang kosakata lama: nilainya wajib diselamatkan.
  const adaLama = terapkanTaksonomi({ jenjang: 'SMA' }, tak({ jenjang: '' }));
  assert.equal(adaLama.jenjang, 'SMA/MA');
  assert.equal(adaLama.jenjangSebelumBaku, 'SMA');
});

test('INVARIAN: jenjang tak dikenali TIDAK dikarang, ditulis apa adanya', () => {
  const hasil = terapkanTaksonomi({}, tak({ jenjang: 'Perguruan Tinggi' }));
  assert.equal(hasil.jenjang, 'Perguruan Tinggi');
  assert.equal(jenjangBaku('Perguruan Tinggi').dikenal, false);
});

test('jenjang kosong tetap kosong (tidak menebak)', () => {
  const hasil = terapkanTaksonomi({}, tak({ jenjang: '' }));
  assert.equal(hasil.jenjang, undefined);
});

test('semua nilai baku lolos pemeriksaan sudahBaku', () => {
  for (const j of JENJANG_BAKU) {
    assert.equal(sudahBaku(j), true, `${j} harus diakui baku`);
    assert.equal(jenjangBaku(j).diubah, false, `${j} tidak boleh dianggap perlu diubah`);
  }
  assert.equal(sudahBaku('SMA'), false);
  assert.equal(sudahBaku(''), false);
  assert.equal(sudahBaku(null), false);
});

// ------------------------------------------------------------
// 2. Alias `materi` (yang benar-benar dibaca penyaring)
// ------------------------------------------------------------

test('materi diisi dari bab bila kosong — penyaring hierarki bisa melihatnya', () => {
  const hasil = terapkanTaksonomi({}, tak());
  assert.equal(hasil.bab, 'Barisan dan Deret');
  assert.equal(hasil.materi, 'Barisan dan Deret');
});

test('INVARIAN: materi pilihan admin TIDAK ditimpa bab (walau force)', () => {
  const hasil = terapkanTaksonomi({ materi: 'Induksi Matematika' }, tak(), { force: true });
  assert.equal(hasil.materi, 'Induksi Matematika');
});

test('materi jatuh ke topik bila bab kosong', () => {
  const hasil = terapkanTaksonomi({}, tak({ bab: '', topik: 'Limit' }));
  assert.equal(hasil.materi, 'Limit');
});

// ------------------------------------------------------------
// 3. Semantik force (kompatibilitas mundur)
// ------------------------------------------------------------

test('force:false tidak menimpa field yang sudah terisi', () => {
  const hasil = terapkanTaksonomi(
    { mapel: 'Fisika', mataPelajaran: 'Fisika', bab: 'Kinematika', kelompok: 'Peminatan' },
    tak(),
    { force: false },
  );
  assert.equal(hasil.mapel, 'Fisika');
  assert.equal(hasil.mataPelajaran, 'Fisika');
  assert.equal(hasil.bab, 'Kinematika');
  assert.equal(hasil.kelompok, 'Peminatan');
});

test('force:true menimpa taksonomi (perilaku lama dipertahankan)', () => {
  const hasil = terapkanTaksonomi({ mapel: 'Fisika', bab: 'Kinematika' }, tak(), { force: true });
  assert.equal(hasil.mapel, 'Matematika');
  assert.equal(hasil.bab, 'Barisan dan Deret');
});

test('penanda taksonomi otomatis selalu tertulis', () => {
  const hasil = terapkanTaksonomi({}, tak());
  assert.equal(hasil.taksonomiAuto, true);
  assert.equal(hasil.taksonomiYakin, 0.8);
  assert.equal(typeof hasil.taksonomiAt, 'number');
});

test('dokumen asal tidak termutasi (murni)', () => {
  const asal = { mapel: 'Kimia', jenjang: 'SMA' };
  terapkanTaksonomi(asal, tak(), { force: true });
  assert.deepEqual(asal, { mapel: 'Kimia', jenjang: 'SMA' });
});

// ------------------------------------------------------------
// 4. Penjaga kompatibilitas: deteksi tetap seperti dulu
// ------------------------------------------------------------

test('COMPAT: deteksiJenjangKelas tetap mengembalikan kosakata pendek', () => {
  // petaKonten.js (teruji) dan inferensi kelas di dalam mesin taksonomi
  // membandingkan `jenjang === 'SMA'`. Kanonisasi sengaja TIDAK di sini.
  const hasil = deteksiJenjangKelas('Soal matematika kelas 12 SMA tentang turunan');
  assert.equal(hasil.jenjang, 'SMA');
});

test('inferensi kelas dari jenjang SMA tetap jalan setelah perubahan', () => {
  const hasil = deteksiJenjangKelas('Materi kelas XII tentang integral');
  assert.equal(hasil.jenjang, 'SMA');
  assert.equal(hasil.kelas, '12');
});

test('ujung-ke-ujung: deteksi -> tulis menghasilkan identitas terjangkau', () => {
  const butir = {
    teksSoal: 'Suku ke-10 dari barisan aritmetika 2, 5, 8, ... adalah',
    opsiJawaban: ['29', '32', '35', '38'],
    kunciJawaban: 'A',
    topik: 'Barisan dan Deret',
  };
  const t = deteksiTaksonomiSoal(butir, { fileName: 'matematika-kelas12.json', jenjang: 'SMA', kelas: '12' });
  const dok = terapkanTaksonomi({ ...butir }, t, { force: true });
  assert.equal(dok.jenjang, 'SMA/MA');
  assert.ok(dok.materi, 'materi harus terisi agar terjangkau penyaring');
  assert.ok(dok.mataPelajaran || dok.mapel, 'mapel harus terisi');
});
