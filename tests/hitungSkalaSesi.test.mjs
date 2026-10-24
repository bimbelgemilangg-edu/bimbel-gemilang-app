// tests/hitungSkalaSesi.test.mjs — skala UTBK otomatis dari sesi try out
// Catatan: jawaban pg_sederhana tersimpan sebagai INDEKS opsi (0-3), bukan
// huruf -- persis bentuk yang ditulis TryOutView.jsx dan dibaca skorSatuSoal.
//     node tests/hitungSkalaSesi.test.mjs
import assert from 'node:assert/strict';
import { hitungSkalaSesi, sesiTerbaru } from '../src/utils/hitungSkalaSesi.js';
import { hitungTotalSkor, pilihSoalDinilai } from '../src/utils/skorSoalTryOut.js';
import { persenKeSkala } from '../src/utils/skorSkalaUtbk.js';

let lulus = 0, gagal = 0;
function uji(n, f) {
  try { f(); lulus++; console.log(`  ✓ ${n}`); }
  catch (e) { gagal++; console.log(`  ✗ ${n}\n      ${String(e.message).slice(0, 200)}`); }
}
console.log('hitungSkalaSesi — skor otomatis tanpa input manual');

const soal = (id, mapel, kunci = 'A') => ({ id, mapel, tipe: 'pg_sederhana', opsiJawaban: ['a', 'b', 'c', 'd'], kunciJawaban: kunci });
const paketUtbk = {
  daftarSoal: [
    soal('pk1', 'TPS/Pengetahuan Kuantitatif'), soal('pk2', 'TPS/Pengetahuan Kuantitatif'),
    soal('pu1', 'TPS/Penalaran Umum'), soal('pu2', 'TPS/Penalaran Umum'),
    soal('mtk1', 'Matematika'), // soal kurikulum di paket campuran: TIDAK ikut skala
  ],
};
const sesi = (jawaban, status = 'selesai') => ({ status, jawaban });

uji('semua benar -> skala maksimum 1000', () => {
  const r = hitungSkalaSesi(sesi({ pk1: 0, pk2: 0, pu1: 0, pu2: 0, mtk1: 1 }), paketUtbk);
  assert.equal(r.total, 1000);
  assert.equal(r.perSubtes.length, 2, 'soal Matematika tidak ikut');
});

uji('semua salah -> skala minimum 100, bukan 0', () => {
  const r = hitungSkalaSesi(sesi({ pk1: 1, pk2: 1, pu1: 1, pu2: 1 }), paketUtbk);
  assert.equal(r.total, 100);
});

uji('setengah benar -> 550 (linear; satu komponen = bobot ternormalisasi)', () => {
  const r = hitungSkalaSesi(sesi({ pk1: 0, pk2: 1, pu1: 0, pu2: 1 }), paketUtbk);
  assert.equal(r.total, 550);
  assert.equal(r.perSubtes.find((p) => p.kode === 'PK').persen, 50);
});

uji('sesi berjalan/belum mulai tidak dinilai', () => {
  for (const st of ['berjalan', 'belum', null]) {
    const r = hitungSkalaSesi(sesi({ pk1: 0 }, st), paketUtbk);
    assert.equal(r.total, null, String(st));
    assert.ok(r.alasan);
  }
});

uji('paket kurikulum murni -> null + alasan, bukan skala palsu', () => {
  const r = hitungSkalaSesi(sesi({ mtk1: 0 }), { daftarSoal: [soal('mtk1', 'Matematika')] });
  assert.equal(r.total, null);
  assert.match(r.alasan, /kurikulum/);
});

uji('soal tak dijawab tidak dihitung benar tapi tetap masuk penyebut', () => {
  const r = hitungSkalaSesi(sesi({ pk1: 0 }), paketUtbk); // pk2,pu1,pu2 kosong
  assert.equal(r.perSubtes.reduce((a, b) => a + b.total, 0), 4);
  assert.equal(r.total, persenKe(1, 4));
});
function persenKe(b, t) { return Math.round(100 + (900 * b) / t); }

uji('sesiTerbaru memilih yang paling akhir, mengabaikan yang belum selesai', () => {
  const list = [
    { id: 'a', status: 'selesai', waktuMulaiMs: 100 },
    { id: 'b', status: 'selesai', waktuMulaiMs: 300 },
    { id: 'c', status: 'berjalan', waktuMulaiMs: 900 },
  ];
  assert.equal(sesiTerbaru(list).id, 'b');
  assert.equal(sesiTerbaru([]), null);
});

uji('BUG-2026-10-24: soalDinilaiIds membuat hitung ulang memakai penyebut siswa', () => {
  const paketMentah = {
    daftarSoal: [
      soal('pk1', 'TPS/Pengetahuan Kuantitatif'),
      soal('pk2', 'TPS/Pengetahuan Kuantitatif'),
      soal('x1', 'TPS/Penalaran Umum'), // tidak pernah diterima siswa (filter akses)
    ],
  };
  const jawaban = { pk1: 0, pk2: 0 };
  const sesi = { status: 'selesai', jawaban, soalDinilaiIds: ['pk1', 'pk2'] };
  // sisi siswa (daftar terfilter) vs cara lama admin (paket mentah)
  assert.equal(hitungTotalSkor(pilihSoalDinilai(paketMentah.daftarSoal, sesi), jawaban).totalSkorPersen, 100);
  assert.equal(hitungTotalSkor(paketMentah.daftarSoal, jawaban).totalSkorPersen, 67);
  // skala sisi baca wajib memakai penyebut sesi, bukan paket mentah
  const r = hitungSkalaSesi(sesi, paketMentah);
  assert.equal(r.perSubtes.length, 1);
  assert.equal(r.perSubtes[0].total, 2);
  assert.equal(r.total, 1000);
});

uji('BUG-2026-10-24: skala memakai skor proporsional (pg_kompleks separuh)', () => {
  const kompleks = {
    id: 'k1', mapel: 'TPS/Penalaran Umum', tipe: 'pg_kompleks',
    opsiJawaban: ['a', 'b', 'c', 'd'], kunciJawaban: ['A', 'C'],
  };
  const paket = { daftarSoal: [kompleks] };
  const sesi = { status: 'selesai', jawaban: { k1: ['A'] } }; // 1 dari 2 kunci -> 0.5
  const r = hitungSkalaSesi(sesi, paket);
  assert.equal(r.perSubtes[0].skor, 0.5);
  assert.equal(r.perSubtes[0].persen, 50);
  assert.equal(r.perSubtes[0].benar, 0, 'kredit penuh memang 0, tapi persen tidak boleh ikut 0');
  assert.equal(r.total, persenKeSkala(50));
});

console.log(`\n  LULUS: ${lulus}  GAGAL: ${gagal}`);
if (gagal > 0) process.exit(1);
console.log('✅ Semua test lulus.');
