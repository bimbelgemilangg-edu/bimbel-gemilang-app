// tests/bersihkanArtefakScan.test.mjs
// ============================================================
// Test pembersih artefak scan & pendeteksi bacaan terjebak
// (src/utils/bersihkanArtefakScan.js).
//
//     node tests/bersihkanArtefakScan.test.mjs
//
// KENAPA INI PENTING
// Fixture di bawah BUKAN rekaan: semuanya dikutip apa adanya dari berkas
// HTML keluaran Gemini untuk "02 Silogisme @my99dreams.pdf" yang dikirim
// owner 2026-10-11 (40 soal UTBK TPS-PU lewat /admin/bank-soal/import).
// PDF sumbernya scan murni tanpa text layer, dua kolom, ber-watermark --
// jadi kotorannya berulang di setiap berkas serupa. Test ini memaku bahwa
// kotoran mekanis itu tidak lagi lolos ke bank soal, dan bahwa bacaan yang
// tercecer di sebuah opsi kini DITUNJUK lokasinya, bukan dibiarkan jadi
// perburuan manual di puluhan soal.
// ============================================================

import assert from 'node:assert/strict';
import {
  bersihkanArtefakTeks,
  bersihkanArtefakSoal,
  cariPotonganTerjebak,
  tandaiBacaanTerjebak,
  hitungKandidatBacaan,
  pindahkanBacaanTerjebak,
  wariskanBacaanYatim,
  bersihkanAwalanOpsi,
} from '../src/utils/bersihkanArtefakScan.js';

let lulus = 0;
let gagal = 0;
const kegagalan = [];
function uji(nama, fn) {
  try {
    fn();
    lulus += 1;
    console.log(`  ✓ ${nama}`);
  } catch (e) {
    gagal += 1;
    const pesan = String(e && e.message ? e.message : e);
    kegagalan.push({ nama, pesan });
    console.log(`  ✗ ${nama}`);
    console.log(`      ${pesan.split('\n').join('\n      ').slice(0, 400)}`);
  }
}
function bagian(j) { console.log(`\n${j}`); }

// ============================================================
bagian('1. PENANDA KOLOM PEMINDAI');
// ============================================================

uji('marker "=== PAGE n COL m ===" dibuang (sampel soal 21)', () => {
  const t = bersihkanArtefakTeks('=== PAGE 5 COL 2 ===\n————EEE\nBerdasarkan paragraf 3, apabila pengusaha tidak\nmengurangi jumlah produksi.');
  assert.ok(!t.includes('PAGE 5'), t);
  assert.ok(!t.includes('==='), t);
  assert.ok(t.includes('Berdasarkan paragraf 3'), t);
});

uji('marker + nomor kolom sebelah ikut dibuang (sampel soal 8, opsi D)', () => {
  const t = bersihkanArtefakTeks('Jika bukan lampu yang menyala, maka Tina pergi. === PAGE 3 COL 1 === 10. 11 12.');
  assert.equal(t, 'Jika bukan lampu yang menyala, maka Tina pergi.');
});

uji('marker di tengah opsi tidak membuang teks opsi aslinya', () => {
  const t = bersihkanArtefakTeks('Pantai daerah X ramai dikunjungi wisatawan === PAGE 4 COL 1 === tetapi ekosistem tidak dijaga.');
  assert.ok(t.startsWith('Pantai daerah X ramai dikunjungi wisatawan'), t);
  assert.ok(t.endsWith('tetapi ekosistem tidak dijaga.'), t);
  assert.ok(!t.includes('PAGE'), t);
});

// ============================================================
bagian('2. WATERMARK BERKAS SUMBER');
// ============================================================

uji('watermark asli dibuang (sampel soal 17)', () => {
  const t = bersihkanArtefakTeks('r+ siswa mengenakan pakaian dinas lapangan.\nBELAJAR MINIMAL,\nHBSIL MAKSIMAL\nPremis1 :p—7q');
  assert.ok(!t.includes('BELAJAR'), t);
  assert.ok(!t.includes('MAKSIMAL'), t);
  assert.ok(t.includes('Premis1'), t);
});

uji('varian salah-baca OCR ikut dibuang (WINIMAL / MBKSIMAL / embel nomor)', () => {
  const t = bersihkanArtefakTeks('memenuhi target penjualan.\nBELAJAR WINIMAL, 30.\nHASIL MBKSIMAL\nJawaban C');
  assert.ok(!t.includes('WINIMAL'), t);
  assert.ok(!t.includes('MBKSIMAL'), t);
  assert.ok(t.includes('Jawaban C'), t);
});

uji('kalimat ASLI yang kebetulan menyebut belajar/hasil TIDAK dibuang', () => {
  const asli = 'Siswa yang belajar minimal dua jam setiap hari akan memperoleh hasil maksimal pada ujian akhir semester.';
  assert.equal(bersihkanArtefakTeks(asli), asli);
});

// ============================================================
bagian('3. NOMOR KOLOM SEBELAH & GARIS SAMPAH');
// ============================================================

uji('baris nomor urut lepas dibuang (sampel soal 16)', () => {
  const t = bersihkanArtefakTeks('Jika pantai di daerah X ramai dikunjungi\nwisatawan, perekonomian meningkat.\n17.\n18\n19,\nJika ekosistem tidak dijaga dengan baik.');
  assert.ok(!/\n17\.\n/.test(t), t);
  assert.ok(t.includes('Jika ekosistem tidak dijaga'), t);
});

uji('baris garbage pemisah kolom dibuang', () => {
  const t = bersihkanArtefakTeks('Berdasarkan paragraf 3.\n————EEE\nJawaban D');
  assert.ok(!t.includes('EEE'), t);
  assert.ok(t.includes('Jawaban D'), t);
});

uji('angka yang MEMANG isi soal tidak dibuang', () => {
  const asli = 'Berapakah hasil dari 12.5 + 3.25?';
  assert.equal(bersihkanArtefakTeks(asli), asli);
  const asli2 = 'Perhatikan data: 400 unit dari sebelumnya 1.200 unit.';
  assert.equal(bersihkanArtefakTeks(asli2), asli2);
});

// ============================================================
bagian('4. KESELAMATAN ISI');
// ============================================================

uji('rumus LaTeX dan baris isi tidak disentuh', () => {
  const asli = 'Jika $x^2=4$ maka $x=2$.\nPremis 1: $p \\rightarrow q$\nJawaban: B';
  assert.equal(bersihkanArtefakTeks(asli), asli);
});

uji('bersihkanArtefakSoal memetakan semua field teks, tidak mutasi', () => {
  const mentah = {
    teks_soal: '=== PAGE 6 COL 1 ===\nBerdasarkan bacaan tersebut, manakah simpulan yang benar?',
    opsi_jawaban: ['A. Harga kayu jati mahal. === PAGE 6 COL 2 ===', { teks: 'BELAJAR MINIMAL,\nFungsi hutan dialihkan.' }],
    pembahasan: 'BELAJAR MINIMAL,\nPremis 1: P > Q',
    bacaan: { teks: '=== PAGE 5 COL 1 ===\nIndustri batik tersebar di beberapa daerah.' },
    kunci_jawaban: 'C',
  };
  const bersih = bersihkanArtefakSoal(mentah);
  assert.ok(!bersih.teks_soal.includes('PAGE'), bersih.teks_soal);
  assert.ok(!bersih.opsi_jawaban[0].includes('PAGE'), bersih.opsi_jawaban[0]);
  assert.ok(!bersih.opsi_jawaban[1].teks.includes('BELAJAR'), bersih.opsi_jawaban[1].teks);
  assert.ok(!bersih.pembahasan.includes('BELAJAR'), bersih.pembahasan);
  assert.ok(!bersih.bacaan.teks.includes('PAGE'), bersih.bacaan.teks);
  assert.equal(bersih.kunci_jawaban, 'C');
  // objek asal tidak boleh berubah
  assert.ok(mentah.teks_soal.includes('PAGE'), 'input termutasi');
});

// ============================================================
bagian('5. BACAAN TERJEBAK (kasus batik, sampel soal 19 -> 20-22)');
// ============================================================

// Dikutip apa adanya (dipangkas panjangnya) dari opsi E soal nomor 19:
// wacana batik milik soal 20-22 menempel sebagai EKOR opsi tersebut.
const OPSI_E_SOAL_19 = 'Semakin tinggi kemungkinan seorang wanila tinggal di kota, semakin tinggi pengetahuannya mengenai dampak pernikahan dini. === PAGE 5 COL 1 === Teks berikut di k k iawab Fi Industri batik di Indonesia tersebar di beberapa daerah d i Pulau Jawa yang kemudian menjadi nama dari jeuis-jenis batik. Seperti batik Pekalongan, batik Indonesia, dan batik Cirebon. Setiap batik di daerah memiliki kekhasan motif masing-masing. Misalnya, batik Pekalongan dikenal dengan motif flora dan fauna yang berwarna-warni dan desainnya tidak terpaku dengan pakem seperti pada batik Solo dan Indonesia. Saat ini, industri batik mengalami fluktuasi. Tidak ada industri batik yang dapat bertahan secara terus-menerus, Walaupun sempat maju dan berkembang pesat pada tahun 1970-an, beberapa industri batik di Jawa mengalami penurunan produksi.';

uji('cariPotonganTerjebak menemukan wacana setelah penanda kolom', () => {
  const potong = cariPotonganTerjebak(OPSI_E_SOAL_19, 80);
  assert.ok(potong, 'potongan tidak ketemu');
  assert.ok(potong.teks.startsWith('Teks berikut'), potong.teks.slice(0, 60));
  assert.ok(potong.teks.includes('Industri batik'), 'isi wacana tidak ikut');
});

uji('opsi biasa yang panjangnya wajar TIDAK dituduh menjebak bacaan', () => {
  const opsi = [
    'Fungsi hutan tidak dialihkan menjadi lahan pertanian jika harga kayu jati mahal.',
    'Fungsi hutan dialihkan menjadi lahan pertanian jika harga kayu jati tidak mahal.',
    'Harga kayu jati semakin mahal jika fungsi hutan dialihkan menjadi lahan pertanian.',
    'Harga kayu jati semakin mahal jika fungsi hutan tidak dialihkan menjadi lahan pertanian.',
    'Harga kayu jati tidak semakin mahal jika fungsi hutan dialihkan menjadi lahan pertanian.',
  ];
  for (const o of opsi) assert.equal(cariPotonganTerjebak(o, 80), null, o);
});

uji('tandaiBacaanTerjebak menunjuk lokasi persis untuk soal yatim', () => {
  const daftar = [
    { nomor: 19, teks_soal: 'Simpulan apa yang dapat ditarik dari paragraf 3?', bacaan: null, opsi_jawaban: ['a', 'b', 'c', 'd', OPSI_E_SOAL_19], errors: [], valid: false },
    {
      nomor: 20,
      teks_soal: 'Berdasarkan paragraf 3, manakah simpulan di bawah ini yang BENAR?',
      bacaan: null,
      opsi_jawaban: ['a', 'b', 'c', 'd', 'e'],
      errors: ['Soal ini menunjuk "teks/bacaan tersebut" tapi TIDAK punya bacaan sama sekali (field bacaan kosong, teks_soal pendek) -- x'],
      valid: false,
    },
  ];
  const hasil = tandaiBacaanTerjebak(daftar);
  assert.equal(hasil[0].errors.length, 0, 'soal 19 tidak boleh diberi error');
  const pesan = hasil[1].errors.join('\n');
  assert.ok(pesan.includes('KANDIDAT BACAAN KETEMU'), pesan);
  assert.ok(pesan.includes('opsi E'), `lokasi opsi tidak disebut: ${pesan}`);
  assert.ok(pesan.includes('nomor 19'), `nomor sumber tidak disebut: ${pesan}`);
});

uji('tandaiBacaanTerjebak tidak menambah apa pun bila bacaan sudah ada', () => {
  const daftar = [{
    nomor: 20,
    teks_soal: 'Berdasarkan paragraf 3, manakah simpulan yang BENAR?',
    bacaan: { teks: 'Industri batik tersebar di beberapa daerah di Pulau Jawa.' },
    opsi_jawaban: ['a', 'b'],
    errors: [],
    valid: true,
  }];
  const hasil = tandaiBacaanTerjebak(daftar);
  assert.equal(hasil[0].errors.length, 0);
});

uji('soal yang tidak menunjuk bacaan TIDAK dicari-cari kandidatnya', () => {
  const daftar = [{
    nomor: 5, teks_soal: 'Jika harga bahan baku naik, maka biaya produksi meningkat.',
    bacaan: null, opsi_jawaban: ['a', 'b'], errors: ['kunci kosong'], valid: false,
  }];
  const hasil = tandaiBacaanTerjebak(daftar);
  assert.deepEqual(hasil[0].errors, ['kunci kosong']);
});

// ============================================================
bagian('6. AKSI SATU KLIK — pindahkanBacaanTerjebak');
// ============================================================

function daftarKasusBatik() {
  return [
    { nomor: 19, paket: 1, teks_soal: 'Simpulan apa yang dapat ditarik dari paragraf 3?', bacaan: null, opsi_jawaban: ['a', 'b', 'c', 'd', OPSI_E_SOAL_19], errors: [], valid: true },
    ...[20, 21, 22].map((n) => ({
      nomor: n,
      paket: 1,
      teks_soal: `Berdasarkan paragraf 3, manakah simpulan nomor ${n} yang BENAR?`,
      bacaan: null,
      opsi_jawaban: ['a', 'b', 'c', 'd', 'e'],
      errors: ['Soal ini menunjuk "teks/bacaan tersebut" tapi TIDAK punya bacaan sama sekali (field bacaan kosong, teks_soal pendek) -- x'],
      valid: false,
    })),
    { nomor: 23, paket: 1, teks_soal: 'Soal biasa tanpa penunjuk bacaan.', bacaan: null, opsi_jawaban: ['a', 'b'], errors: [], valid: true },
  ];
}

uji('hitungKandidatBacaan menghitung runtutan yatim yang punya kandidat', () => {
  assert.equal(hitungKandidatBacaan(daftarKasusBatik()), 3);
});

uji('bacaan DIPOTONG dari opsi E soal 19 (tidak ada dua salinan)', () => {
  const { daftar } = pindahkanBacaanTerjebak(daftarKasusBatik());
  const opsiE = daftar[0].opsi_jawaban[4];
  assert.ok(!opsiE.includes('Industri batik'), `wacana masih ada di opsi: ${opsiE.slice(-80)}`);
  assert.ok(opsiE.startsWith('Semakin tinggi kemungkinan'), 'teks opsi asli harus tetap utuh');
});

uji('bacaan dibagikan ke SELURUH runtutan yatim (20, 21, 22), bukan cuma satu', () => {
  const { daftar, diselamatkan } = pindahkanBacaanTerjebak(daftarKasusBatik());
  assert.deepEqual(diselamatkan.map((d) => d.nomor), [20, 21, 22]);
  for (const i of [1, 2, 3]) {
    assert.ok(daftar[i].bacaan && daftar[i].bacaan.teks.includes('Industri batik'), `soal ${daftar[i].nomor} belum dapat bacaan`);
    assert.equal(daftar[i].bacaanDiselamatkan, true);
    assert.ok(daftar[i].catatan_admin.includes('VERIFIKASI MANUAL'), 'catatan verifikasi wajib ada');
    assert.ok(!daftar[i].errors.some((e) => e.includes('TIDAK punya bacaan')), 'error yatim harus tuntas');
    assert.equal(daftar[i].valid, true, 'soal harus jadi valid setelah diselamatkan');
  }
});

uji('soal BUKAN yatim di belakang runtutan tidak ikut mendapat bacaan', () => {
  const { daftar } = pindahkanBacaanTerjebak(daftarKasusBatik());
  assert.equal(daftar[4].bacaan, null, 'soal 23 tidak boleh kebagian bacaan');
  assert.equal(daftar[4].bacaanDiselamatkan, undefined);
});

uji('sesudah diselamatkan tidak ada kandidat tersisa (idempoten)', () => {
  const sekali = pindahkanBacaanTerjebak(daftarKasusBatik());
  assert.equal(hitungKandidatBacaan(sekali.daftar), 0);
  const dua = pindahkanBacaanTerjebak(sekali.daftar);
  assert.equal(dua.diselamatkan.length, 0);
});

uji('masukan tidak dimutasi', () => {
  const asal = daftarKasusBatik();
  pindahkanBacaanTerjebak(asal);
  assert.ok(asal[0].opsi_jawaban[4].includes('Industri batik'), 'opsi asal termutasi');
  assert.equal(asal[1].bacaan, null, 'bacaan asal termutasi');
});

// ============================================================
bagian('7. SAMPEL KEDUA (47 soal): huruf opsi dobel, page-foot, watermark buku lain');
// ============================================================

uji('huruf opsi dobel + garbage margin dibuang dari teks opsi', () => {
  const kasus = [
    ['S (A) Simpulan pasti benar.', 'Simpulan pasti benar.'],
    ['yy (C) Simpulan pasti salah.', 'Simpulan pasti salah.'],
    ['3 <{ (A) Hanya bidang usaha', 'Hanya bidang usaha'],
    ['1 ©) Hanya tarian X', 'Hanya tarian X'],
    ['_.§ (B) Hampir semua usaha', 'Hampir semua usaha'],
    ['(A) Simpulan pasti benar.', 'Simpulan pasti benar.'],
    ['A) Simpulan pasti benar.', 'Simpulan pasti benar.'],
  ];
  for (const [masuk, harap] of kasus) assert.equal(bersihkanAwalanOpsi(masuk), harap, masuk);
});

uji('opsi polos TIDAK dipotong (termasuk opsi bahasa Inggris berawal "A ")', () => {
  for (const t of ['Simpulan mungkin benar.', 'Energi terbarukan meningkat.', 'A study shows growth.', '2020 terjadi pandemi.']) {
    assert.equal(bersihkanAwalanOpsi(t), t, t);
  }
});

uji('page-foot & watermark buku lain dibuang inline', () => {
  const t = bersihkanArtefakTeks('Berdasarkan paragraf. Page 45 ge 34 of 310 Wangsit Om Jerg Belojar Minimal dan Hasil mveksimnal Jadi jawaban C.');
  assert.ok(!t.includes('Page 45'), t);
  assert.ok(!t.includes('34 of 310'), t);
  assert.ok(!t.includes('Wangsit'), t);
  assert.ok(!t.includes('mveksimnal'), t);
  assert.ok(t.includes('Jadi jawaban C.'), t);
});

uji('kalimat asli yang mirip watermark TIDAK dipotong', () => {
  const asli = 'Belajar minimal dua jam setiap hari meningkatkan hasil.';
  assert.equal(bersihkanArtefakTeks(asli), asli);
  const asli2 = 'Usaha itu mencapai hasil maksimal pada 2020.';
  assert.equal(bersihkanArtefakTeks(asli2), asli2);
});

uji('kaki halaman distributor & watermark pemindai pihak ketiga dibuang', () => {
  const t = bersihkanArtefakTeks('Page 5 of 282 Personal use only | scanned by @my99dreams ebook rapi & halaman lengkap hanya di 0878 8548 0008 Isi asli tetap ada.');
  assert.ok(!t.includes('Page 5'), t);
  assert.ok(!t.includes('of 282'), t);
  assert.ok(!t.includes('scanned by'), t);
  assert.ok(!t.includes('0878'), t);
  assert.ok(t.includes('Isi asli tetap ada.'), `isi ikut terbuang: ${t}`);
});

// ============================================================
bagian('8. WARISAN BACAAN (kasus bab 4: wacana hanya di soal pertama rentang)');
// ============================================================

const BACAAN_JATI = { teks: 'Jati yang tumbuh di Indonesia, terutama di Pulau Jawa, telah diakui kualitasnya...', gambar: [], grup: 'bacaan_2' };

uji('soal yatim mewarisi bacaan dari pembawa terdekat & dibenderai', () => {
  const daftar = [
    { nomor: 30, teks_soal: 'Teks panjang pembawa wacana.', bacaan: BACAAN_JATI, opsi_jawaban: ['a'], errors: [], valid: true },
    { nomor: 31, teks_soal: 'Berdasarkan paragraf 3, manakah simpulan yang BENAR?', bacaan: null, opsi_jawaban: ['a', 'b'], errors: ['Soal ini menunjuk "teks/bacaan tersebut" tapi TIDAK punya bacaan sama sekali (field bacaan kosong, teks_soal pendek) -- x'], valid: false },
  ];
  const hasil = wariskanBacaanYatim(daftar);
  assert.ok(hasil[1].bacaan && hasil[1].bacaan.teks.includes('Jati yang tumbuh'), 'bacaan tidak diwariskan');
  assert.equal(hasil[1].bacaanWarisan, true);
  assert.equal(hasil[1].bacaan.diwariskanDari, 30);
  assert.ok(!hasil[1].errors.some((e) => e.includes('TIDAK punya bacaan sama sekali')), 'error yatim harus diganti');
  assert.ok(hasil[1].errors.some((e) => e.includes('BACAAN WARISAN')), 'peringatan warisan wajib ada');
  assert.equal(hasil[1].valid, false, 'tetap butuh mata manusia');
  assert.ok(hasil[1].catatan_admin.includes('VERIFIKASI rentang'), hasil[1].catatan_admin);
});

uji('tidak mewarisi lintas pembawa bacaan lain & di luar jendela', () => {
  const yatimJauh = { nomor: 45, teks_soal: 'Berdasarkan bacaan tersebut, manakah yang benar?', bacaan: null, opsi_jawaban: ['a'], errors: ['x'], valid: false };
  const jarak = Array.from({ length: 7 }, (_, k) => ({ nomor: 38 + k, teks_soal: 'Soal biasa tanpa penunjuk.', bacaan: null, opsi_jawaban: ['a'], errors: [], valid: true }));
  const daftar = [{ nomor: 37, teks_soal: 'pembawa.', bacaan: BACAAN_JATI, opsi_jawaban: ['a'], errors: [], valid: true }, ...jarak, yatimJauh];
  const hasil = wariskanBacaanYatim(daftar);
  assert.equal(hasil[hasil.length - 1].bacaan, null, 'jendela 6 tidak boleh dilompati');
});

uji('soal yang punya bacaan sendiri tidak disentuh', () => {
  const daftar = [
    { nomor: 1, teks_soal: 'x', bacaan: BACAAN_JATI, opsi_jawaban: ['a'], errors: [], valid: true },
    { nomor: 2, teks_soal: 'Berdasarkan paragraf 3, manakah yang BENAR?', bacaan: { teks: 'milik sendiri', grup: 'bacaan_9' }, opsi_jawaban: ['a'], errors: [], valid: true },
  ];
  const hasil = wariskanBacaanYatim(daftar);
  assert.equal(hasil[1].bacaan.teks, 'milik sendiri');
  assert.equal(hasil[1].bacaanWarisan, undefined);
});

console.log(`\n${'='.repeat(60)}`);
console.log(`  LULUS : ${lulus}`);
console.log(`  GAGAL : ${gagal}`);
console.log('='.repeat(60));
if (gagal > 0) {
  console.log('\nRingkasan kegagalan:');
  kegagalan.forEach((k, i) => console.log(`  ${i + 1}. ${k.nama}\n     ${k.pesan.split('\n')[0]}`));
  console.error('\n❌ ADA TEST YANG GAGAL.');
  process.exit(1);
}
console.log('\n✅ Semua test lulus.');
