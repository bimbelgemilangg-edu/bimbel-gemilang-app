// tests/logMengajar.test.mjs
// ============================================================
// PENGAWAL register bug B-26 (3 Nov 2026): angka gaji guru TIDAK BOLEH ikut
// terkirim ke browser guru. `TeacherHistory.jsx` dulu memakai
// `const { _nominal, ...rest } = d.data()` — membuang field bernama `_nominal`
// yang tidak pernah ada, sehingga field asli `nominal` lolos dan terbaca lewat
// DevTools, persis yang dilarang komentar panjang di atas fungsi itu.
// Test ini mengunci perilaku yang benar + mereproduksi bug lama supaya
// perbaikannya tidak bisa diam-diam dikembalikan.
// ============================================================
import assert from 'node:assert/strict';
import {
  FIELD_RAHASIA_LOG, buangNominal, buangNominalSemua,
  tanggalLog, urutLogTerbaru, logDalamBulan, siapkanLogBulan,
} from '../src/utils/logMengajar.js';

let lulus = 0, gagal = 0;
function uji(nama, fn) {
  try { fn(); lulus++; console.log('  ✓', nama); } catch (e) { gagal++; console.log('  ✗', nama, '\n   ', String(e.message).slice(0, 300)); }
}

console.log('logMengajar: gaji tidak ikut ke sisi guru, urutan & bulan benar');

const CONTOH = {
  id: 'log1',
  teacherId: 'docAni',
  namaGuru: 'Ani Sari',
  tanggal: '2026-11-02',
  siswaHadir: 4,
  siswaTotal: 5,
  nominal: 150000,
  status: 'Lunas',
};

uji('REGRESI B-26: pola lama {_nominal, ...rest} membiarkan gaji lolos', () => {
  // Pola lama yang salah ditiru apa adanya: `_nominal` tidak pernah ada di data.
  const { _nominal, ...rest } = CONTOH;
  assert.equal(rest.nominal, 150000, 'inilah bugnya: nominal tetap ada di data sisi guru');
  assert.equal(buangNominal(CONTOH).nominal, undefined, 'fungsi bersama membuangnya');
});

uji('buangNominal membuang SEMUA field bernilai uang', () => {
  const hasil = buangNominal({ ...CONTOH, _nominal: 1, gaji: 2, honor: 3, nominalGaji: 4 });
  FIELD_RAHASIA_LOG.forEach((k) => assert.equal(hasil[k], undefined, `${k} wajib hilang`));
  assert.equal(hasil.namaGuru, 'Ani Sari', 'field non-uang tidak boleh ikut terbuang');
  assert.equal(hasil.siswaHadir, 4);
  assert.equal(hasil.siswaTotal, 5);
});

uji('buangNominal tidak memutasi dokumen asal & aman untuk input rusak', () => {
  const asli = { ...CONTOH };
  buangNominal(asli);
  assert.equal(asli.nominal, 150000, 'dokumen asal tidak boleh berubah');
  assert.deepEqual(buangNominal(null), {});
  assert.deepEqual(buangNominal('bukan-objek'), {});
  assert.deepEqual(buangNominalSemua(null), []);
});

uji('buangNominalSemua membersihkan seluruh daftar', () => {
  const hasil = buangNominalSemua([CONTOH, { ...CONTOH, id: 'log2', nominal: 9 }]);
  assert.equal(hasil.length, 2);
  assert.ok(hasil.every((h) => h.nominal === undefined));
});

uji('tanggalLog menerima "YYYY-MM-DD" dan "YYYY-MM-DD HH:mm"', () => {
  assert.equal(tanggalLog({ tanggal: '2026-11-02' }), '2026-11-02');
  assert.equal(tanggalLog({ tanggal: '2026-11-02 15:30' }), '2026-11-02');
  assert.equal(tanggalLog({}), '');
  assert.equal(tanggalLog(null), '');
});

uji('urutLogTerbaru: terbaru dulu, lalu dipotong', () => {
  const daftar = [
    { tanggal: '2026-10-01' }, { tanggal: '2026-11-02' }, { tanggal: '2026-10-20' },
  ];
  assert.deepEqual(urutLogTerbaru(daftar, 2).map((d) => d.tanggal), ['2026-11-02', '2026-10-20']);
  assert.equal(urutLogTerbaru(daftar, 10).length, 3, 'batas lebih besar dari isi tidak memotong');
});

uji('urutLogTerbaru: batas tidak sah kembali ke 30, input rusak tidak melempar', () => {
  const banyak = Array.from({ length: 40 }, (_, i) => ({ tanggal: `2026-11-${String(i + 1).padStart(2, '0')}` }));
  assert.equal(urutLogTerbaru(banyak, 0).length, 30);
  assert.equal(urutLogTerbaru(banyak, 'x').length, 30);
  assert.deepEqual(urutLogTerbaru(null), []);
});

uji('logDalamBulan menyaring per bulan pilihan', () => {
  assert.equal(logDalamBulan({ tanggal: '2026-11-02' }, '2026-11'), true);
  assert.equal(logDalamBulan({ tanggal: '2026-11-02 07:00' }, '2026-11'), true);
  assert.equal(logDalamBulan({ tanggal: '2026-10-31' }, '2026-11'), false);
  assert.equal(logDalamBulan({ tanggal: '' }, '2026-11'), false, 'log tanpa tanggal tidak dihitung');
  assert.equal(logDalamBulan({ tanggal: '2026-11-02' }, ''), false);
});

uji('siapkanLogBulan: bersih dari gaji, hanya bulan itu, terurut terbaru', () => {
  const hasil = siapkanLogBulan([
    { ...CONTOH, id: 'a', tanggal: '2026-11-01' },
    { ...CONTOH, id: 'b', tanggal: '2026-11-20' },
    { ...CONTOH, id: 'c', tanggal: '2026-10-05' },
    { ...CONTOH, id: 'd', tanggal: '' }, // tanpa tanggal → dibuang
  ], '2026-11');
  assert.deepEqual(hasil.map((h) => h.id), ['b', 'a']);
  assert.ok(hasil.every((h) => h.nominal === undefined));
});

console.log(`\n${lulus} lulus, ${gagal} gagal`);
if (gagal) process.exit(1);
