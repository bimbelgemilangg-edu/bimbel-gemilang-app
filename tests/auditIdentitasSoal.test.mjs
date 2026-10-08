// tests/auditIdentitasSoal.test.mjs
// ============================================================
// Uji mesin audit identitas & kesehatan butir bank soal
// (src/utils/auditIdentitasSoal.js).
//
//     node tests/auditIdentitasSoal.test.mjs
//
// KENAPA INI PENTING
// Lahir dari permintaan owner 2026-10-08: sebelum fitur "tentor bisa
// akses bank soal" dibuka, harus dipastikan SETIAP butir punya identitas
// (mapel/jenjang/materi) dan tidak ada butir rusak. Bank soal diisi lima
// jalur tulis dengan kosakata field berbeda, jadi alat ukurnya wajib
// sadar-alias — kalau tidak, hasilnya bohong dua arah: menuduh soal sehat
// "tanpa identitas", atau meloloskan soal yang sebenarnya tak terjangkau
// penyaring.
//
// Yang diuji di sini adalah INVARIAN, bukan potret output:
//   - kanonisasi jenjang tidak pernah mengarang nilai tak dikenal,
//   - rencana perbaikan tidak pernah menimpa nilai berbeda yang terisi,
//   - butir esai tanpa rubrik TIDAK dituduh rusak (dinilai manusia),
//   - butir ber-status dihapus tidak ikut diaudit.
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  JENJANG_BAKU,
  jenjangBaku,
  ambilAlias,
  bacaIdentitas,
  periksaIdentitas,
  deteksiSoalRusak,
  rencanaPerbaikanIdentitas,
  hitungBiayaBaca,
  auditBankSoal,
  keCsvTanpaIdentitas,
  keCsvRusak,
} from '../src/utils/auditIdentitasSoal.js';

const soalSehat = (tambahan = {}) => ({
  nomor: 1,
  tipe: 'pg_sederhana',
  soal: 'Himpunan penyelesaian dari x + 2 = 5 adalah ....',
  teksSoal: 'Himpunan penyelesaian dari x + 2 = 5 adalah ....',
  opsiJawaban: ['{2}', '{3}', '{4}', '{5}'],
  kunciJawaban: 'B',
  mataPelajaran: 'Matematika',
  mapel: 'Matematika',
  jenjang: 'SMA/MA',
  tingkatKelas: '12',
  kelas: '12',
  materi: 'Persamaan Linear',
  bab: 'Persamaan Linear',
  pembahasan: 'Pindahkan ruas: x = 5 - 2 = 3.',
  status: 'aktif',
  ...tambahan,
});

// ------------------------------------------------------------
// 1. Kanonisasi jenjang
// ------------------------------------------------------------

test('jenjang kosakata lama dipetakan ke baku', () => {
  assert.equal(jenjangBaku('SMA').baku, 'SMA/MA');
  assert.equal(jenjangBaku('smp').baku, 'SMP/MTs');
  assert.equal(jenjangBaku('SD').baku, 'SD/MI');
  assert.equal(jenjangBaku('  SMA/MA  ').baku, 'SMA/MA');
  assert.equal(jenjangBaku('smk').baku, 'SMK');
  assert.equal(jenjangBaku('UTBK').baku, 'UTBK/SNBT');
});

test('jenjang yang SUDAH baku tidak ditandai berubah', () => {
  for (const j of JENJANG_BAKU) {
    const hasil = jenjangBaku(j);
    assert.equal(hasil.baku, j, `${j} harus tetap ${j}`);
    assert.equal(hasil.diubah, false, `${j} tidak boleh dianggap berubah`);
    assert.equal(hasil.dikenal, true);
  }
});

test('jenjang tak dikenali TIDAK dikarang — dikenal:false, baku kosong', () => {
  const hasil = jenjangBaku('Perguruan Tinggi');
  assert.equal(hasil.dikenal, false);
  assert.equal(hasil.baku, '');
  assert.equal(hasil.diubah, false);
});

test('jenjang kosong aman (tidak crash, tidak menuduh)', () => {
  for (const v of ['', null, undefined, '   ']) {
    const hasil = jenjangBaku(v);
    assert.equal(hasil.baku, '');
    assert.equal(hasil.dikenal, false);
  }
});

// ------------------------------------------------------------
// 2. Pembaca sadar-alias
// ------------------------------------------------------------

test('mapel terbaca dari alias mataPelajaran saja', () => {
  const id = bacaIdentitas({ mataPelajaran: 'Kimia' });
  assert.equal(id.mapel, 'Kimia');
  assert.equal(id.mapelDari, 'mataPelajaran');
});

test('teks soal terbaca dari alias `soal` saja (jalur Import Hasil Scan)', () => {
  const id = bacaIdentitas({ soal: 'Sebuah kubus memiliki rusuk 6 cm.' });
  assert.equal(id.teksSoal, 'Sebuah kubus memiliki rusuk 6 cm.');
  assert.equal(id.teksDari, 'soal');
});

test('materi kosong tapi bab terisi dilaporkan sebagai masalah ALIAS, bukan hilang', () => {
  const hasil = periksaIdentitas({ mataPelajaran: 'Fisika', jenjang: 'SMA/MA', bab: 'Kinematika' });
  assert.deepEqual(hasil.hilang.filter((h) => h === 'materi'), [], 'materi tidak boleh dituduh hilang total');
  assert.equal(hasil.hanyaAlias.length, 1);
  assert.match(hasil.hanyaAlias[0], /bab/);
  assert.equal(hasil.lengkap, true, 'informasinya ADA (tersimpan di bab)');
  assert.equal(hasil.terjangkau, false, 'tapi penyaring membaca `materi`, jadi tak terjangkau');
});

test('identitas lengkap DAN terjangkau bila mapel + jenjang baku + materi ada', () => {
  const hasil = periksaIdentitas(soalSehat());
  assert.equal(hasil.lengkap, true);
  assert.equal(hasil.terjangkau, true);
  assert.deepEqual(hasil.hilang, []);
  assert.deepEqual(hasil.takBaku, []);
});

test('jenjang "SMA": identitas ADA tapi TIDAK TERJANGKAU penyaring', () => {
  const hasil = periksaIdentitas(soalSehat({ jenjang: 'SMA' }));
  assert.equal(hasil.lengkap, true, 'kita tahu ini SMA — informasinya tidak hilang');
  assert.equal(hasil.terjangkau, false, 'tapi tentor memilih "SMA/MA"; string tidak cocok');
  assert.equal(hasil.takBaku.length, 1);
  assert.match(hasil.takBaku[0], /SMA\/MA/);
});

test('jenjang benar-benar asing: tidak lengkap dan tidak terjangkau', () => {
  const hasil = periksaIdentitas(soalSehat({ jenjang: 'Perguruan Tinggi' }));
  assert.equal(hasil.lengkap, false);
  assert.equal(hasil.terjangkau, false);
  assert.match(hasil.takBaku[0], /bukan kosakata baku/);
});

// ------------------------------------------------------------
// 3. Deteksi butir rusak
// ------------------------------------------------------------

test('soal sehat tidak dituduh rusak', () => {
  assert.deepEqual(deteksiSoalRusak(soalSehat()).rusak, []);
});

test('kunci di luar rentang opsi = rusak (bug yang membuat soal selalu salah)', () => {
  const hasil = deteksiSoalRusak(soalSehat({ kunciJawaban: 'E' }));
  assert.equal(hasil.rusak.length, 1);
  assert.match(hasil.rusak[0], /di luar rentang/);
});

test('pg_kompleks tanpa kunci = rusak (skor selalu 0)', () => {
  const hasil = deteksiSoalRusak({
    tipe: 'pg_kompleks',
    soal: 'Pernyataan yang benar tentang senyawa ion adalah ....',
    pernyataan: ['Lelehannya menghantarkan listrik', 'Titik lelehnya tinggi', 'Tak pernah larut'],
    kunciJawaban: [],
  });
  assert.ok(hasil.rusak.some((r) => /Kunci pg_kompleks kosong/.test(r)));
});

test('kunci pg_kompleks di luar rentang pernyataan = rusak', () => {
  const hasil = deteksiSoalRusak({
    tipe: 'pg_kompleks',
    soal: 'Pilih pernyataan yang benar tentang ikatan kovalen.',
    pernyataan: ['A benar', 'B benar'],
    kunciJawaban: ['A', 'D'],
  });
  assert.ok(hasil.rusak.some((r) => /di luar rentang/.test(r)));
});

test('benar_salah: baris tanpa kunci sah = rusak', () => {
  const hasil = deteksiSoalRusak({
    tipe: 'benar_salah',
    soal: 'Tentukan nilai kebenaran pernyataan berikut.',
    tabelBenarSalah: [
      { pernyataan: 'Fotosintesis di kloroplas', kunci: 'benar' },
      { pernyataan: 'Respirasi di ribosom', kunci: '' },
    ],
  });
  assert.ok(hasil.rusak.some((r) => /tanpa kunci sah/.test(r)));
});

test('menjodohkan tanpa pasangan dan pasangan bolong = rusak', () => {
  assert.ok(deteksiSoalRusak({ tipe: 'menjodohkan', soal: 'Pasangkan tokoh dan penemuannya.', pasangan: [] }).rusak.length > 0);
  const bolong = deteksiSoalRusak({
    tipe: 'menjodohkan',
    soal: 'Pasangkan tokoh dan penemuannya.',
    pasangan: [{ kiri: 'Bohr', kanan: 'Model kulit atom' }, { kiri: 'Rutherford', kanan: '' }],
  });
  assert.ok(bolong.rusak.some((r) => /bolong/.test(r)));
});

test('isian_singkat tanpa kunci & tanpa ekuivalen = rusak; dengan ekuivalen = aman', () => {
  assert.ok(deteksiSoalRusak({ tipe: 'isian_singkat', soal: 'Perubahan wujud padat ke gas disebut ....', kunciJawaban: '' }).rusak.length > 0);
  const aman = deteksiSoalRusak({ tipe: 'isian_singkat', soal: 'Perubahan wujud padat ke gas disebut ....', kunciJawaban: '', jawabanEkuivalen: ['sublimasi'] });
  assert.deepEqual(aman.rusak, []);
});

test('INVARIAN: esai tanpa rubrik TIDAK dituduh rusak (dinilai manusia)', () => {
  const hasil = deteksiSoalRusak({ tipe: 'esai', soal: 'Jelaskan langkah menentukan volume kubus tanpa rumus jadi.', kunciJawaban: '' });
  assert.deepEqual(hasil.rusak, []);
  assert.ok(hasil.perluDicek.some((r) => /rubrik/.test(r)));
});

test('tipe warisan draft lama = perlu dicek, bukan rusak; tipe asing = rusak', () => {
  const warisan = deteksiSoalRusak({ tipe: 'pg', soal: 'Soal pilihan ganda gaya draft materi lama.', opsiJawaban: ['a', 'b', 'c'], kunciJawaban: 'A' });
  assert.deepEqual(warisan.rusak, []);
  assert.ok(warisan.perluDicek.some((r) => /warisan/.test(r)));

  const asing = deteksiSoalRusak({ tipe: 'pg_ganda_tiga', soal: 'Tipe yang tidak dikenal sistem sama sekali.', opsiJawaban: ['a', 'b'], kunciJawaban: 'A' });
  assert.ok(asing.rusak.some((r) => /Tipe tak dikenal/.test(r)));
});

test('placeholder gambar yatim = rusak (siswa melihat {{GAMBAR_2}} mentah)', () => {
  const hasil = deteksiSoalRusak({
    tipe: 'pg_sederhana',
    soal: 'Perhatikan grafik berikut {{GAMBAR_2}} lalu jawab.',
    opsiJawaban: ['a', 'b', 'c', 'd'],
    kunciJawaban: 'A',
    gambarUrls: ['https://contoh.test/g1.png'],
    gambar: [{ id: 'GAMBAR_1', deskripsi: 'grafik' }],
  });
  assert.ok(hasil.rusak.some((r) => /Placeholder gambar tanpa pasangan/.test(r)));
});

test('placeholder yang PUNYA pasangan tidak dituduh', () => {
  const hasil = deteksiSoalRusak({
    tipe: 'pg_sederhana',
    soal: 'Perhatikan gambar {{GAMBAR_1}} berikut.',
    opsiJawaban: ['a', 'b', 'c', 'd'],
    kunciJawaban: 'A',
    gambarUrls: ['https://contoh.test/g1.png'],
    gambar: [{ id: 'GAMBAR_1', deskripsi: 'grafik' }],
  });
  assert.deepEqual(hasil.rusak, []);
});

test('aksara CJK dan aksara kontrol = rusak', () => {
  // Fixture CJK sengaja disusun dari kode karakter, bukan ditulis langsung:
  // penjaga gerbang CI menolak aksara CJK yang terselip di repo, dan sebuah
  // berkas uji yang memuatnya secara harfiah akan jadi ranjau bila cakupan
  // penjaga itu kelak diperluas ke tests/. Maksud ujinya tetap sama.
  const cjk = String.fromCharCode(0x8fd9, 0x662f, 0x4ec0, 0x4e48); // "zhe shi shen me"
  assert.ok(deteksiSoalRusak({ tipe: 'esai', soal: `${cjk} Jelaskan artinya.`, kunciJawaban: 'rubrik' }).rusak.some((r) => /China\/Jepang\/Korea/.test(r)));
  // \b di bawah adalah backspace (aksara kontrol) — jejak "\frac" yang
  // termakan escape backslash-tunggal di JSON.
  assert.ok(deteksiSoalRusak({ tipe: 'esai', soal: 'Nilai dari \bfrac{1}{2} adalah', kunciJawaban: 'rubrik' }).rusak.some((r) => /aksara kontrol/.test(r)));
});

test('dokumen kosong/null tidak melempar', () => {
  for (const d of [null, undefined, {}]) {
    assert.ok(Array.isArray(deteksiSoalRusak(d).rusak));
    assert.ok(Array.isArray(periksaIdentitas(d).hilang));
  }
});

// ------------------------------------------------------------
// 4. Rencana perbaikan (dry-run)
// ------------------------------------------------------------

test('rencana: jenjang lama diseragamkan + nilai lama disimpan jujur', () => {
  const rencana = rencanaPerbaikanIdentitas([{ id: 'x1', data: soalSehat({ jenjang: 'SMA' }) }]);
  assert.equal(rencana.length, 1);
  assert.equal(rencana[0].perubahan.jenjang, 'SMA/MA');
  assert.equal(rencana[0].perubahan.jenjangSebelumBaku, 'SMA');
});

test('rencana: materi diisi dari bab bila kosong', () => {
  const dok = soalSehat();
  delete dok.materi;
  const rencana = rencanaPerbaikanIdentitas([{ id: 'x2', data: dok }]);
  assert.equal(rencana[0].perubahan.materi, 'Persamaan Linear');
});

test('INVARIAN: nilai berbeda yang sama-sama terisi TIDAK PERNAH ditimpa', () => {
  const rencana = rencanaPerbaikanIdentitas([{
    id: 'x3',
    data: soalSehat({ mapel: 'Matematika', mataPelajaran: 'Matematika Tingkat Lanjut', kelas: '12', tingkatKelas: '11' }),
  }]);
  const perubahan = rencana[0]?.perubahan || {};
  assert.equal(perubahan.mapel, undefined, 'mapel tidak boleh ditimpa');
  assert.equal(perubahan.mataPelajaran, undefined, 'mataPelajaran tidak boleh ditimpa');
  assert.equal(perubahan.kelas, undefined);
  assert.equal(perubahan.tingkatKelas, undefined);
});

test('rencana: mapel salah jenjang dipetakan ke padanan Kurikulum Merdeka', () => {
  // Kasus nyata owner: butir SMP tertag Sosiologi padahal IPS.
  const rencana = rencanaPerbaikanIdentitas([{
    id: 'sos1',
    data: soalSehat({ mataPelajaran: 'Sosiologi', mapel: 'Sosiologi', jenjang: 'SMP/MTs', materi: 'Interaksi Sosial' }),
  }]);
  assert.equal(rencana.length, 1);
  assert.equal(rencana[0].perubahan.mapel, 'IPS');
  assert.equal(rencana[0].perubahan.mataPelajaran, 'IPS');
  assert.equal(rencana[0].perubahan.mapelSebelumKurikulum, 'Sosiologi', 'nilai lama tidak boleh hilang');
});

test('rencana: mapel yang SAH untuk jenjangnya tidak disentuh', () => {
  const rencana = rencanaPerbaikanIdentitas([
    { id: 'ok1', data: soalSehat({ mataPelajaran: 'Biologi', mapel: 'Biologi', jenjang: 'SMA/MA' }) },
    { id: 'ok2', data: soalSehat({ mataPelajaran: 'Sosiologi', mapel: 'Sosiologi', jenjang: 'SMA/MA' }) },
  ]);
  assert.deepEqual(rencana, []);
});

test('rencana: dokumen yang sudah utuh tidak menghasilkan perubahan apa pun', () => {
  assert.deepEqual(rencanaPerbaikanIdentitas([{ id: 'x4', data: soalSehat() }]), []);
});

test('rencana: input kosong/janggal aman', () => {
  assert.deepEqual(rencanaPerbaikanIdentitas([]), []);
  assert.deepEqual(rencanaPerbaikanIdentitas(null), []);
  assert.deepEqual(rencanaPerbaikanIdentitas([{ id: 'x5' }]), []);
});

// ------------------------------------------------------------
// 5. Biaya baca (kejujuran kuota)
// ------------------------------------------------------------

test('biaya baca dinyatakan dalam persen jatah harian', () => {
  assert.equal(hitungBiayaBaca(0).persenJatah, 0);
  assert.equal(hitungBiayaBaca(5000).persenJatah, 10);
  assert.equal(hitungBiayaBaca(50000).persenJatah, 100);
  assert.match(hitungBiayaBaca(1200).kalimat, /1\.200 dokumen/);
  assert.equal(hitungBiayaBaca(-5).baca, 0, 'jumlah negatif tidak menghasilkan angka aneh');
  assert.equal(hitungBiayaBaca('bukan angka').baca, 0);
});

// ------------------------------------------------------------
// 6. Laporan agregat
// ------------------------------------------------------------

const daftarCampuran = [
  { id: 'a1', data: soalSehat() },
  { id: 'a2', data: soalSehat({ jenjang: 'SMA', materi: '', bab: 'Trigonometri' }) },
  { id: 'a3', data: soalSehat({ kunciJawaban: 'Z' }) },
  { id: 'a4', data: soalSehat({ mataPelajaran: '', mapel: '' }) },
  { id: 'a5', data: soalSehat({ status: 'dihapus' }) },
];

test('laporan: butir ber-status dihapus dikecualikan dari hitungan', () => {
  const l = auditBankSoal(daftarCampuran);
  assert.equal(l.totalSemua, 5);
  assert.equal(l.dikecualikan, 1);
  assert.equal(l.total, 4);
});

test('laporan: ikutDikecualikan=true memasukkan semua (untuk audit menyeluruh)', () => {
  const l = auditBankSoal(daftarCampuran, { ikutDikecualikan: true });
  assert.equal(l.total, 5);
  assert.equal(l.dikecualikan, 0);
});

test('laporan: jenjang ganda terdeteksi sebagai penghalang kesiapan tentor', () => {
  const l = auditBankSoal(daftarCampuran);
  assert.equal(l.jenjang.takBaku.length, 1);
  assert.equal(l.jenjang.takBaku[0].nilai, 'SMA');
  assert.equal(l.jenjang.takBaku[0].seharusnya, 'SMA/MA');
  assert.equal(l.kesiapanTentor.siap, false);
  assert.ok(l.kesiapanTentor.penghalang.length >= 2);
});

test('laporan: bank yang bersih dinyatakan SIAP untuk tentor', () => {
  const l = auditBankSoal([{ id: 'b1', data: soalSehat() }, { id: 'b2', data: soalSehat({ nomor: 2 }) }]);
  assert.equal(l.kesiapanTentor.siap, true);
  assert.deepEqual(l.kesiapanTentor.penghalang, []);
  assert.equal(l.ringkasan.rusak, 0);
  assert.equal(l.ringkasan.terjangkau, 2);
  assert.equal(l.ringkasan.identitasLengkap, 2);
  assert.equal(l.ringkasan.persenTerjangkau, 100);
  assert.equal(l.ringkasan.tersembunyi, 0);
});

test('laporan: butir rusak & tanpa identitas terpisah, tidak saling menelan', () => {
  const l = auditBankSoal(daftarCampuran);
  assert.equal(l.butirRusak.length, 1);
  assert.equal(l.butirRusak[0].id, 'a3');
  // a2 (materi kosong + jenjang SMA) dan a4 (mapel kosong) = tanpa identitas
  assert.deepEqual(l.tanpaIdentitas.map((t) => t.id).sort(), ['a2', 'a4']);
  assert.ok(l.ringkasan.materiLewatBab >= 1);
});

test('laporan: butir "tersembunyi" dihitung terpisah dari yang benar-benar tanpa identitas', () => {
  // a2 = jenjang 'SMA' + materi kosong tapi bab ada  -> identitas ADA, tak terjangkau
  // a4 = mapel kosong                                 -> benar-benar tanpa identitas
  const l = auditBankSoal(daftarCampuran);
  assert.equal(l.ringkasan.tersembunyi, 1);
  const a2 = l.tanpaIdentitas.find((t) => t.id === 'a2');
  const a4 = l.tanpaIdentitas.find((t) => t.id === 'a4');
  assert.equal(a2.lengkapTapiTersembunyi, true);
  assert.equal(a4.lengkapTapiTersembunyi, false);
});

test('laporan: kelompok hierarki jenjang→mapel→materi terbentuk', () => {
  const l = auditBankSoal(daftarCampuran);
  assert.ok(l.perKelompok.length >= 2);
  for (const k of l.perKelompok) {
    assert.equal(k.jumlah, k.siap + k.tersembunyi + k.rusak, 'tiap butir masuk tepat satu keadaan');
    assert.ok(k.jumlah > 0);
  }
});

test('laporan: input kosong menghasilkan angka nol, bukan NaN', () => {
  const l = auditBankSoal([]);
  assert.equal(l.total, 0);
  assert.equal(l.ringkasan.persenTerjangkau, 0);
  assert.equal(l.kesiapanTentor.siap, true, 'bank kosong tidak punya penghalang');
  for (const c of l.cakupan) assert.equal(Number.isNaN(c.persen), false);
});

test('laporan: dokumen tanpa pembungkus {id,data} tetap terbaca', () => {
  const l = auditBankSoal([soalSehat()]);
  assert.equal(l.total, 1);
  assert.equal(l.ringkasan.terjangkau, 1);
});

// ------------------------------------------------------------
// 7. Ekspor CSV
// ------------------------------------------------------------

test('checkup: butir kembar persis terhitung sebagai duplikat', () => {
  const l = auditBankSoal([
    { id: 'd1', data: soalSehat() },
    { id: 'd2', data: soalSehat() },
  ]);
  assert.equal(l.checkup.duplikatPersis, 1);
  assert.equal(l.checkup.kembarBedaKunci, 0);
});

test('checkup: perintah sama + gambar beda BUKAN duplikat, dan dihitung jujur', () => {
  const denganGambar = (url) => soalSehat({ gambarUrls: [url], gambar: [{ id: 'GAMBAR_1', deskripsi: 'x' }] });
  const l = auditBankSoal([
    { id: 'g1', data: denganGambar('https://a/1.png') },
    { id: 'g2', data: denganGambar('https://a/2.png') },
  ]);
  assert.equal(l.checkup.duplikatPersis, 0);
  assert.equal(l.checkup.perintahSamaGambarBeda, 1);
});

test('checkup: kembar tapi kunci beda tidak dituduh duplikat', () => {
  const l = auditBankSoal([
    { id: 'k1', data: soalSehat() },
    { id: 'k2', data: soalSehat({ kunciJawaban: 'D' }) },
  ]);
  assert.equal(l.checkup.duplikatPersis, 0);
  assert.equal(l.checkup.kembarBedaKunci, 1);
});

test('checkup: fragmentasi materi terukur dari sapuan yang sama', () => {
  const l = auditBankSoal([
    { id: 'f1', data: soalSehat({ materi: 'A' }) },
    { id: 'f2', data: soalSehat({ materi: 'B' }) },
    { id: 'f3', data: soalSehat({ materi: 'C' }) },
    { id: 'f4', data: soalSehat({ materi: 'D' }) },
  ]);
  assert.equal(l.checkup.simpulMateri, 4);
  assert.equal(l.checkup.simpulSatuButir, 4);
  assert.equal(l.checkup.rataButirPerSimpul, 1);
  assert.equal(l.checkup.materiTerpecah.length, 1);
  assert.equal(l.checkup.materiTerpecah[0].rata, 1);
});

test('CSV meng-escape tanda kutip dan memuat kepala kolom', () => {
  const l = auditBankSoal([{ id: 'c1', data: soalSehat({ mataPelajaran: '', mapel: '', soal: 'Soal "berkutip" tanpa mapel.' }) }]);
  const csv = keCsvTanpaIdentitas(l);
  assert.match(csv.split('\n')[0], /^"id","mapel"/);
  assert.match(csv, /""berkutip""/);
});

test('CSV butir rusak memuat alasannya', () => {
  const l = auditBankSoal([{ id: 'c2', data: soalSehat({ kunciJawaban: 'Z' }) }]);
  const csv = keCsvRusak(l);
  assert.match(csv, /"c2","pg_sederhana"/);
  assert.match(csv, /di luar rentang/);
});

test('CSV dari laporan kosong hanya kepala kolom', () => {
  const l = auditBankSoal([]);
  assert.equal(keCsvTanpaIdentitas(l).split('\n').length, 1);
  assert.equal(keCsvRusak(l).split('\n').length, 1);
  assert.equal(keCsvTanpaIdentitas(null).split('\n').length, 1);
});

// ------------------------------------------------------------
// 8. Alias generik
// ------------------------------------------------------------

test('ambilAlias mengambil yang pertama berisi dan mengaku kosong', () => {
  assert.deepEqual(ambilAlias({ b: 'isi' }, ['a', 'b']), { nilai: 'isi', dari: 'b' });
  assert.deepEqual(ambilAlias({ a: '   ' }, ['a', 'b']), { nilai: '', dari: '' });
  assert.deepEqual(ambilAlias(null, ['a']), { nilai: '', dari: '' });
  assert.deepEqual(ambilAlias({ a: [] }, ['a']), { nilai: '', dari: '' }, 'array kosong = tidak berisi');
});
