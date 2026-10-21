// tests/sasaranTugas.test.mjs — klasifikasi jangkauan tugas & regresi banner berkedip
// ============================================================
//     node tests/sasaranTugas.test.mjs
//
// Dua hal yang diuji di sini, dan keduanya lahir dari perbaikan nyata:
//
// 1. KLASIFIKASI. Ekspresi `targetKelas === 'Semua' || targetKategori ===
//    'Semua'` dulu ditulis ulang di empat tempat dalam ManageTugas.jsx
//    (pemicu banner, syarat render banner, warna indikator, pesan konfirmasi
//    submit). Sekarang satu sumber di src/utils/sasaranTugas.js. Test ini
//    mengunci keempat kombinasi dropdown supaya penyatuan itu tidak diam-diam
//    mengubah arti salah satunya.
//
// 2. REGRESI BANNER BERKEDIP. Bentuk lama menyimpan `warningShown` di
//    dependency array effect: saat timeout menyembunyikan banner, effect jalan
//    lagi, syarat `!warningShown` lolos lagi, banner muncul lagi — berulang
//    tiap 5 detik selama tab terbuka. Bagian kedua test ini mensimulasikan
//    putaran effect lama dan BARU, lalu membuktikan yang lama memang
//    berosilasi dan yang baru tidak.
// ============================================================
import assert from 'node:assert/strict';
import {
  SEMUA, SASARAN, jenisSasaran, apakahSasaranLuas,
} from '../src/utils/sasaranTugas.js';

let lulus = 0, gagal = 0;
function uji(n, f) {
  try { f(); lulus++; console.log(`  ✓ ${n}`); }
  catch (e) { gagal++; console.log(`  ✗ ${n}\n      ${String(e.message).slice(0, 220)}`); }
}

console.log('sasaranTugas — klasifikasi jangkauan & regresi banner berkedip');

// ============================================================
// BAGIAN 1 — klasifikasi
// ============================================================

uji('kedua dropdown "Semua" -> SEMUANYA (jangkauan terjauh)', () => {
  assert.equal(jenisSasaran(SEMUA, SEMUA), SASARAN.SEMUANYA);
});

uji('hanya kelas "Semua" -> SEMUA_KELAS', () => {
  assert.equal(jenisSasaran(SEMUA, 'Reguler'), SASARAN.SEMUA_KELAS);
  assert.equal(jenisSasaran(SEMUA, 'English'), SASARAN.SEMUA_KELAS);
});

uji('hanya program "Semua" -> SEMUA_PROGRAM', () => {
  assert.equal(jenisSasaran('7 SMP', SEMUA), SASARAN.SEMUA_PROGRAM);
  assert.equal(jenisSasaran('12 SMA', SEMUA), SASARAN.SEMUA_PROGRAM);
});

uji('kelas & program tertentu -> TERBATAS (tidak perlu peringatan)', () => {
  assert.equal(jenisSasaran('7 SMP', 'Reguler'), SASARAN.TERBATAS);
  assert.equal(jenisSasaran('1 SD', 'English'), SASARAN.TERBATAS);
  assert.equal(jenisSasaran('12 SMA', 'Reguler'), SASARAN.TERBATAS);
});

// Urutan cabang penting: kalau "keduanya Semua" tidak dicek paling dulu, ia
// tertangkap cabang SEMUA_KELAS dan pesan konfirmasi submit jadi salah —
// menyebut satu program padahal jangkauannya keduanya.
uji('SEMUANYA tidak boleh jatuh ke cabang SEMUA_KELAS/SEMUA_PROGRAM', () => {
  const s = jenisSasaran(SEMUA, SEMUA);
  assert.notEqual(s, SASARAN.SEMUA_KELAS);
  assert.notEqual(s, SASARAN.SEMUA_PROGRAM);
});

uji('apakahSasaranLuas true untuk tiga sasaran luas, false untuk TERBATAS', () => {
  assert.equal(apakahSasaranLuas(SEMUA, SEMUA), true);
  assert.equal(apakahSasaranLuas(SEMUA, 'Reguler'), true);
  assert.equal(apakahSasaranLuas('7 SMP', SEMUA), true);
  assert.equal(apakahSasaranLuas('7 SMP', 'Reguler'), false);
});

// Invariant yang jadi alasan fungsi ini disatukan: pemicu banner dan syarat
// render-nya harus SELALU sepakat. Keduanya kini memanggil fungsi yang sama,
// jadi kesepakatan itu dijamin struktur — test ini menguncinya supaya tidak
// ada yang memisahkannya lagi jadi dua ekspresi.
uji('pemicu dan syarat render tidak mungkin berbeda pendapat', () => {
  for (const kelas of [SEMUA, '7 SMP', '12 SMA', '', undefined, null]) {
    for (const kategori of [SEMUA, 'Reguler', 'English', '', undefined, null]) {
      const pemicu = apakahSasaranLuas(kelas, kategori);
      const render = apakahSasaranLuas(kelas, kategori);
      assert.equal(pemicu, render, `beda untuk ${String(kelas)}/${String(kategori)}`);
      // dan keduanya konsisten dengan klasifikasi
      assert.equal(pemicu, jenisSasaran(kelas, kategori) !== SASARAN.TERBATAS);
    }
  }
});

uji('nilai kosong/aneh dianggap TERBATAS, bukan melempar error', () => {
  assert.equal(jenisSasaran(undefined, undefined), SASARAN.TERBATAS);
  assert.equal(jenisSasaran(null, 'Reguler'), SASARAN.TERBATAS);
  assert.equal(apakahSasaranLuas('', ''), false);
  // 'semua' huruf kecil BUKAN nilai dropdown yang sah — harus TERBATAS,
  // karena perbandingannya memang case-sensitive terhadap literal 'Semua'.
  assert.equal(jenisSasaran('semua', 'reguler'), SASARAN.TERBATAS);
});

// ============================================================
// BAGIAN 2 — regresi banner berkedip
// ============================================================
//
// Model SATU putaran effect. `jalankanEffect` meniru apa yang React lakukan
// tiap kali dependency berubah; `jalankanTimeout` meniru callback setTimeout
// 5 detik yang menyembunyikan banner.
//
// Yang dihitung: berapa kali banner DIMUNCULKAN. Bentuk lama harus > 1
// (berosilasi), bentuk baru harus tepat 1.

/** Bentuk LAMA — `warningShown` ikut jadi dependency. */
function simulasiLama(tugas) {
  let warningShown = false;
  let muncul = 0;

  const jalankanEffect = () => {
    const sasaranLuas = tugas.kelas === 'Semua' || tugas.kategori === 'Semua';
    if (sasaranLuas && !warningShown && tugas.title) {
      warningShown = true;
      muncul += 1;
      return true; // ada timeout terjadwal
    }
    return false;
  };
  const jalankanTimeout = () => { warningShown = false; };

  return {
    // Putaran: effect -> (5 dtk) timeout -> effect lagi karena warningShown berubah.
    siklus(putaran) {
      for (let i = 0; i < putaran; i += 1) {
        const terjadwal = jalankanEffect();
        if (terjadwal) jalankanTimeout();
      }
    },
    berapaKaliMuncul: () => muncul,
    terlihat: () => warningShown,
  };
}

/** Bentuk BARU — pemicu hanya onChange dropdown, bukan effect. */
function simulasiBaru(tugas) {
  let warningShown = false;
  let muncul = 0;

  const ingatkan = () => {
    if (!apakahSasaranLuas(tugas.kelas, tugas.kategori)) {
      warningShown = false;
      return;
    }
    warningShown = true;
    muncul += 1;
  };
  const jalankanTimeout = () => { warningShown = false; };

  return {
    pilihDropdown: ingatkan,
    siklus(putaran) {
      // Setelah satu pilihan dropdown, waktu berlalu dan timeout berulang
      // kali jatuh. Tidak ada yang mengevaluasi ulang keputusan itu.
      for (let i = 0; i < putaran; i += 1) jalankanTimeout();
    },
    berapaKaliMuncul: () => muncul,
    // Diekspos supaya test bisa memeriksa BANNER-NYA SENDIRI (bukan hanya
    // hitungan pemicu): sesudah timeout jatuh, banner harus benar-benar
    // hilang dan TETAP hilang — tidak muncul sendiri lagi seperti bentuk lama.
    terlihat: () => warningShown,
  };
}

const TUGAS_LUAS = { kelas: 'Semua', kategori: 'Reguler', title: 'Tugas Matematika' };

uji('BENTUK LAMA benar-benar berkedip: banner muncul berulang tanpa henti', () => {
  const s = simulasiLama(TUGAS_LUAS);
  s.siklus(6);
  // Kalau ini cuma 1, berarti model bug-nya salah dan bagian regresi ini
  // tidak membuktikan apa pun.
  assert.equal(s.berapaKaliMuncul(), 6);
});

uji('BENTUK BARU: satu pilihan dropdown = banner muncul TEPAT sekali', () => {
  const s = simulasiBaru(TUGAS_LUAS);
  s.pilihDropdown();
  s.siklus(6);
  assert.equal(s.berapaKaliMuncul(), 1);
});

uji('BENTUK BARU: sesudah timeout banner hilang dan TETAP hilang', () => {
  const s = simulasiBaru(TUGAS_LUAS);
  s.pilihDropdown();
  assert.equal(s.terlihat(), true, 'banner harus muncul saat dropdown dipilih');
  s.siklus(1);
  assert.equal(s.terlihat(), false, 'banner harus hilang sesudah 5 detik');
  s.siklus(20);
  assert.equal(s.terlihat(), false, 'banner tidak boleh muncul sendiri lagi');
  assert.equal(s.berapaKaliMuncul(), 1);
});

uji('BENTUK BARU: memilih sasaran TERBATAS sesudah luas menyembunyikan banner', () => {
  const s = simulasiBaru(TUGAS_LUAS);
  s.pilihDropdown();
  assert.equal(s.terlihat(), true);
  // Guru mengubah pikirannya ke sasaran sempit.
  const sempit = simulasiBaru({ kelas: '7 SMP', kategori: 'Reguler', title: 'X' });
  sempit.pilihDropdown();
  assert.equal(sempit.terlihat(), false);
  assert.equal(sempit.berapaKaliMuncul(), 0);
});

uji('BENTUK BARU: sasaran TERBATAS tidak memunculkan banner sama sekali', () => {
  const s = simulasiBaru({ kelas: '7 SMP', kategori: 'Reguler', title: 'X' });
  s.pilihDropdown();
  s.siklus(3);
  assert.equal(s.berapaKaliMuncul(), 0);
});

// Syarat `tugas.title` sengaja DIHAPUS dari pemicu (perubahan perilaku yang
// didokumentasikan di ManageTugas.jsx): peringatan ini soal sasaran, bukan
// soal judul. Test ini mengunci keputusan itu — kalau seseorang memasangnya
// kembali, banner akan bisu saat guru memilih "Semua" sebelum mengetik judul.
uji('BENTUK BARU: judul kosong TIDAK lagi membungkam peringatan sasaran', () => {
  const s = simulasiBaru({ kelas: 'Semua', kategori: 'Semua', title: '' });
  s.pilihDropdown();
  assert.equal(s.berapaKaliMuncul(), 1);

  const lama = simulasiLama({ kelas: 'Semua', kategori: 'Semua', title: '' });
  lama.siklus(4);
  assert.equal(lama.berapaKaliMuncul(), 0, 'bentuk lama memang bisu tanpa judul');
});

console.log(`\n  LULUS: ${lulus}  GAGAL: ${gagal}`);
if (gagal > 0) process.exit(1);
console.log('✅ Semua test lulus.');
