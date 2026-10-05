// tests/kwitansi.test.mjs
// ============================================================
// Test logika nominal -> teks yang TERCETAK DI KWITANSI RESMI.
//
//     node tests/kwitansi.test.mjs
//
// KENAPA INI PENTING
// `terbilang` dan `rp` mencetak kata-kata dan angka pada dokumen yang
// ditandatangani kasir lalu diarsipkan orang tua siswa. Kalau salah, yang
// rusak bukan tampilan layar -- yang rusak adalah dokumen. Dan kesalahannya
// TIDAK TERLIHAT sebagai bug: kwitansi bertuliskan "Nol rupiah" untuk
// nominal yang rusak tampak seperti kwitansi sah.
//
// Sebelum test ini ada, README mencatat modul ini "belum bisa diuji karena
// berkasnya meng-impor Firebase". Logika murninya sekarang dipindah ke
// src/utils/uangTeks.js sehingga bisa diimpor di Node apa adanya;
// src/utils/kwitansi.js me-re-export-nya supaya tidak ada pemanggil lama
// yang berubah.
//
// Test ditulis sebagai INVARIAN, bukan potret output -- sesuai
// docs/SOP-KESELAMATAN-PERUBAHAN.md janji #2.
//
// Empat bug nyata yang dikunci di sini (semuanya terverifikasi dengan
// menjalankan kode LAMA sebelum diperbaiki):
//   1. terbilang(-500000) === "Lima Ratus Ribu"  -> tanda minus HILANG
//      (Math.abs), padahal rp(-500000) === "Rp -500.000". Di satu lembar
//      kwitansi, angka dan hurufnya saling bertentangan.
//   2. terbilang(1e21) === "Satu" dan rp(1e21) === "Rp 1" -> parseInt pada
//      NUMBER bekerja lewat string, dan JS memakai notasi eksponen mulai
//      1e21: parseInt("1e+21") === 1.
//   3. terbilang(Infinity) === "Nol", rp(Infinity) === "Rp 0" -> nominal
//      rusak menyamar jadi nol yang sah.
//   4. rp MEMOTONG (parseInt) sementara rpFmt MEMBULATKAN (Math.round):
//      rp(250000.6) === "Rp 250.000" tapi rpFmt(250000.6) === "Rp 250.001".
//      Dua formatter untuk satu mata uang, di satu aplikasi.
// ============================================================

import assert from 'node:assert/strict';
import {
  angkaRupiah,
  terbilang,
  rp,
  rpFmt,
  angkaFmt,
  tanggalPanjang,
  prefixKwitansiBulan,
  TEKS_NOMINAL_TIDAK_SAH,
  RP_NOMINAL_TIDAK_SAH,
} from '../src/utils/uangTeks.js';

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

function bagian(judul) {
  console.log(`\n${judul}`);
}

// console.error dari jalur penolakan sengaja dibungkam: test memang
// memancing penolakan, dan jejaknya menenggelamkan hasil.
const errorAsli = console.error;
console.error = () => {};

console.log('uangTeks/kwitansi — nominal yang tercetak di dokumen resmi');

// ============================================================
bagian('1. TANDA TIDAK BOLEH HILANG (regresi bug #1)');
// ============================================================

uji('nominal negatif disebut "Minus", bukan disamarkan jadi positif', () => {
  assert.equal(terbilang(-500000), 'Minus Lima Ratus Ribu');
  assert.equal(terbilang(-1), 'Minus Satu');
  assert.equal(terbilang(-250000), 'Minus Dua Ratus Lima Puluh Ribu');
});

uji('INVARIAN: terbilang negatif SELALU berawalan Minus, positif tidak pernah', () => {
  const contoh = [1, 15, 999, 150000, 250000, 1200000, 999999999];
  for (const n of contoh) {
    assert.ok(!terbilang(n).startsWith('Minus'), `terbilang(${n}) tak boleh berawalan Minus`);
    assert.ok(terbilang(-n).startsWith('Minus '), `terbilang(-${n}) wajib berawalan Minus`);
  }
});

uji('INVARIAN: kata-kata tidak boleh bertentangan dengan angka di lembar yang sama', () => {
  // Inilah inti bug #1: rp mempertahankan minus, terbilang tidak.
  const contoh = [-500000, -250000, -1500, 150000, 250000, 1200000];
  for (const n of contoh) {
    const minusDiAngka = rp(n).includes('-');
    const minusDiKata = terbilang(n).startsWith('Minus');
    assert.equal(minusDiAngka, minusDiKata,
      `rp(${n})="${rp(n)}" vs terbilang="${terbilang(n)}": tanda tidak sepakat`);
  }
});

uji('nol tidak diberi tanda (bukan "Minus Nol")', () => {
  assert.equal(terbilang(0), 'Nol');
  assert.equal(rp(0), 'Rp 0');
});

// ============================================================
bagian('2. NOMINAL BESAR & NOTASI EKSPONEN (regresi bug #2)');
// ============================================================

uji('1e21 tidak lagi runtuh jadi "Satu"', () => {
  assert.notEqual(terbilang(1e21), 'Satu');
  assert.notEqual(rp(1e21), 'Rp 1');
  assert.equal(terbilang(1e21), 'Seribu Kuintiliun');
});

uji('nominal di atas miliar punya tingkat yang benar, bukan "Miliar Miliar"', () => {
  assert.equal(terbilang(1e12), 'Satu Triliun');
  assert.equal(terbilang(1e15), 'Satu Kuadriliun');
  assert.equal(terbilang(1e18), 'Satu Kuintiliun');
  assert.ok(!terbilang(1e21).includes('Miliar Miliar'));
});

uji('nominal khas bimbel tetap benar (tidak berubah oleh perbaikan)', () => {
  assert.equal(terbilang(150000), 'Seratus Lima Puluh Ribu');
  assert.equal(terbilang(250000), 'Dua Ratus Lima Puluh Ribu');
  assert.equal(terbilang(1200000), 'Satu Juta Dua Ratus Ribu');
  assert.equal(terbilang(2500000), 'Dua Juta Lima Ratus Ribu');
  assert.equal(terbilang(1000), 'Seribu');
  assert.equal(terbilang(11), 'Sebelas');
  assert.equal(terbilang(12), 'Dua Belas');
  assert.equal(terbilang(21), 'Dua Puluh Satu');
  assert.equal(terbilang(100), 'Seratus');
  assert.equal(terbilang(101), 'Seratus Satu');
});

uji('INVARIAN: terbilang cocok dengan referensi independen (0..1200 + nominal nyata)', () => {
  // Referensi ditulis TERPISAH dari implementasi, supaya kalau implementasi
  // salah, keduanya tidak salah dengan cara yang sama.
  const S = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh',
    'delapan', 'sembilan', 'sepuluh', 'sebelas'];
  const ref = (x) => {
    x = Math.floor(x);
    if (x === 0) return '';
    if (x < 12) return S[x];
    if (x < 20) return `${ref(x - 10)} belas`;
    if (x < 100) {
      const p = `${ref(Math.floor(x / 10))} puluh`;
      return x % 10 ? `${p} ${ref(x % 10)}` : p;
    }
    if (x < 200) return `seratus${x - 100 ? ` ${ref(x - 100)}` : ''}`;
    if (x < 1000) {
      const r = `${ref(Math.floor(x / 100))} ratus`;
      return x % 100 ? `${r} ${ref(x % 100)}` : r;
    }
    if (x < 2000) return `seribu${x - 1000 ? ` ${ref(x - 1000)}` : ''}`;
    if (x < 1e6) {
      const r = `${ref(Math.floor(x / 1000))} ribu`;
      return x % 1000 ? `${r} ${ref(x % 1000)}` : r;
    }
    if (x < 1e9) {
      const r = `${ref(Math.floor(x / 1e6))} juta`;
      return x % 1e6 ? `${r} ${ref(x % 1e6)}` : r;
    }
    const r = `${ref(Math.floor(x / 1e9))} miliar`;
    return x % 1e9 ? `${r} ${ref(x % 1e9)}` : r;
  };
  const norm = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim();

  const sampel = [];
  for (let i = 0; i <= 1200; i += 1) sampel.push(i);
  for (const v of [1500, 2000, 10000, 100000, 999999, 1000000, 1000001,
    1500000, 2500000, 50000000, 100000000, 999999999]) sampel.push(v);
  for (const v of [50000, 75000, 150000, 250000, 300000, 450000, 600000,
    1200000, 2500000]) sampel.push(v); // nominal SPP/pendaftaran nyata

  let selisih = 0;
  let contoh = '';
  for (const v of sampel) {
    const a = norm(terbilang(v));
    const b = norm(ref(v)) || 'nol';
    if (a !== b) { selisih += 1; if (!contoh) contoh = `${v}: dapat "${a}", harap "${b}"`; }
  }
  assert.equal(selisih, 0, `${selisih} dari ${sampel.length} nilai menyimpang. Contoh ${contoh}`);
});

// ============================================================
bagian('3. NOMINAL RUSAK HARUS TERLIHAT RUSAK (regresi bug #3)');
// ============================================================

uji('Infinity TIDAK boleh tercetak sebagai nol yang tampak sah', () => {
  assert.equal(terbilang(Infinity), TEKS_NOMINAL_TIDAK_SAH);
  assert.equal(rp(Infinity), RP_NOMINAL_TIDAK_SAH);
  assert.notEqual(terbilang(Infinity), 'Nol');
  assert.notEqual(rp(Infinity), 'Rp 0');
});

uji('NaN dan -Infinity juga ditolak', () => {
  for (const v of [NaN, -Infinity]) {
    assert.equal(terbilang(v), TEKS_NOMINAL_TIDAK_SAH, `terbilang(${v})`);
    assert.equal(rp(v), RP_NOMINAL_TIDAK_SAH, `rp(${v})`);
  }
});

uji('INVARIAN: penolakan tidak pernah melempar (halaman tidak boleh blank)', () => {
  // Repo ini pernah kena React crash total gara-gara .map() dipanggil ke
  // string (lihat komentar safeArray di skoringSoalKompleks.js). Fungsi
  // pencetak uang harus lebih tahan banting: apa pun masuknya, ia
  // mengembalikan string, bukan melempar.
  const aneh = [NaN, Infinity, -Infinity, {}, [], () => {}, Symbol.iterator, true, false];
  for (const v of aneh) {
    assert.equal(typeof terbilang(v), 'string', `terbilang(${String(v)})`);
    assert.equal(typeof rp(v), 'string', `rp(${String(v)})`);
  }
});

uji('string campur ditolak, tidak diambil sebagian seperti parseInt', () => {
  assert.equal(terbilang('12abc'), TEKS_NOMINAL_TIDAK_SAH);
  assert.equal(rp('12abc'), RP_NOMINAL_TIDAK_SAH);
  assert.equal(terbilang('Rp 250000'), TEKS_NOMINAL_TIDAK_SAH);
});

uji('string numerik murni tetap diterima (data lama Firestore sering teks)', () => {
  assert.equal(terbilang('250000'), 'Dua Ratus Lima Puluh Ribu');
  assert.equal(rp('250000'), 'Rp 250.000');
  assert.equal(rp(' 150000 '), 'Rp 150.000');
  assert.equal(rp('-50000'), 'Rp -50.000');
});

uji('null/undefined/"" tetap nol -- kontrak lama dipertahankan', () => {
  // Banyak pemanggil mengoper field yang belum termuat. Mengubah ini jadi
  // penolakan akan meneriakkan "tidak sah" ke seluruh layar owner.
  for (const v of [null, undefined, '']) {
    assert.equal(terbilang(v), 'Nol', `terbilang(${String(v)})`);
    assert.equal(rp(v), 'Rp 0', `rp(${String(v)})`);
  }
});

uji('angkaRupiah menandai sah/tidak-sah dengan benar', () => {
  assert.deepEqual(angkaRupiah(250000), { sah: true, nilai: 250000 });
  assert.deepEqual(angkaRupiah(-250000), { sah: true, nilai: -250000 });
  assert.deepEqual(angkaRupiah(null), { sah: true, nilai: 0 });
  assert.equal(angkaRupiah(Infinity).sah, false);
  assert.equal(angkaRupiah('12abc').sah, false);
  assert.equal(angkaRupiah({}).sah, false);
  assert.equal(angkaRupiah(true).sah, false);
});

// ============================================================
bagian('4. DUA FORMATTER WAJIB SEPAKAT (regresi bug #4)');
// ============================================================

uji('rp dan rpFmt menghasilkan string yang IDENTIK untuk semua masukan', () => {
  const contoh = [0, 1, 0.5, 1.5, -0.5, 1500.6, 250000.6, 250000, -500000,
    1234.49, 1234.5, 1e12, null, undefined, '', '250000', NaN, Infinity, '12abc'];
  for (const n of contoh) {
    assert.equal(rp(n), rpFmt(n), `rp(${String(n)})="${rp(n)}" vs rpFmt="${rpFmt(n)}"`);
  }
});

uji('INVARIAN: nominal pecahan dibulatkan, BUKAN dipotong', () => {
  // parseInt(250000.6) === 250000 (dipotong) -- itu perilaku lama yang
  // membuat kwitansi berbeda dari layar owner.
  assert.equal(rp(250000.6), 'Rp 250.001');
  assert.equal(rp(1500.6), 'Rp 1.501');
  assert.equal(angkaFmt(1500.6), '1.501');
});

uji('angkaFmt = rp tanpa prefiks "Rp "', () => {
  for (const n of [0, 1500, 1500.6, 250000, -500000, null, undefined]) {
    assert.equal(`Rp ${angkaFmt(n)}`, rp(n), `angkaFmt(${String(n)})`);
  }
});

uji('perilaku yang dikunci tests/keuangan.test.mjs:579 tidak berubah', () => {
  assert.equal(rpFmt(null), 'Rp 0');
  assert.equal(rpFmt(1500.6), 'Rp 1.501');
  assert.equal(angkaFmt(undefined), '0');
});

// ============================================================
bagian('5. tanggalPanjang & prefixKwitansiBulan (ikut dipindah ke modul murni)');
// ============================================================

uji('tanggalPanjang memakai nama bulan Indonesia', () => {
  assert.equal(tanggalPanjang('2026-10-05'), '5 Oktober 2026');
  assert.equal(tanggalPanjang('2026-01-01'), '1 Januari 2026');
  assert.equal(tanggalPanjang('2026-12-31'), '31 Desember 2026');
});

uji('tanggalPanjang tidak melempar untuk masukan rusak', () => {
  assert.equal(tanggalPanjang('bukan-tanggal'), 'bukan-tanggal');
  assert.equal(typeof tanggalPanjang(''), 'string');   // -> tanggal hari ini
  assert.equal(typeof tanggalPanjang(null), 'string');
});

uji('prefixKwitansiBulan berformat KWT-YYYYMM-', () => {
  assert.equal(prefixKwitansiBulan(new Date(2026, 9, 5)), 'KWT-202610-');
  assert.equal(prefixKwitansiBulan(new Date(2026, 0, 1)), 'KWT-202601-');
  assert.match(prefixKwitansiBulan(new Date(2026, 8, 30)), /^KWT-\d{6}-$/);
});

// ============================================================
// RINGKASAN
// ============================================================
console.error = errorAsli;

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
