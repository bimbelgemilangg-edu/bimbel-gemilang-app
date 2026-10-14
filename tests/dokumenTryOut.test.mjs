// tests/dokumenTryOut.test.mjs
// ============================================================
// Uji logika pemecahan paket try out menjadi dokumen per test
// (src/utils/dokumenTryOut.js) — tulang punggung tampilan
// "tumpukan dokumen" siswa (permintaan owner 14 Okt 2026).
//
// Yang dikunci di sini (perilaku yang TIDAK boleh regress):
//   1. paket 3 subtes -> 3 dokumen berurutan ke-1..ke-3;
//   2. mode per-subtes: test ke-K terkunci sampai giliran tiba
//      (konsisten dengan larangan mundur di TryOutView);
//   3. sesi berjalan di subtes ke-2: test ke-1 'SUDAH DIAMBIL',
//      test ke-2 aktif, test ke-3 terkunci;
//   4. skor per dokumen JUJUR per test (bukan skor paket utuh);
//   5. mode 'total': semua dokumen terbuka (satu pengerjaan utuh);
//   6. paket belum buka / lewat deadline tidak bisa dibuka.
// ============================================================
import assert from 'node:assert/strict';
import { bangunDokumenTryOut, susunDokumenTryOut, statusPaketTryOut } from '../src/utils/dokumenTryOut.js';

let lulus = 0, gagal = 0;
function uji(nama, fn) {
  try { fn(); lulus++; console.log(`  ✓ ${nama}`); }
  catch (e) {
    gagal++;
    console.log(`  ✗ ${nama}\n      ${String(e?.message || e).split('\n').join('\n      ').slice(0, 300)}`);
  }
}

const KINI = new Date('2026-10-14T10:00:00+07:00').getTime();
const buka = KINI - 3600_000; // sejam lalu
const tutup = KINI + 3600_000; // sejam lagi

const soal = (id) => ({ id, tipe: 'pg_sederhana', opsiJawaban: ['a', 'b', 'c', 'd'], kunciJawaban: 'A' });
const paketTigaSubtes = {
  id: 'pkt1',
  judul: 'TRY OUT PEMAHAMAN TKA SMP - Sabtu, 17 Okt',
  modeTimer: 'per-subtes',
  waktuBuka: buka,
  waktuTutup: tutup,
  daftarSoal: [soal('m1'), soal('m2'), soal('b1'), soal('b2'), soal('i1')],
  subtes: [
    { nama: 'Matematika', soalIds: ['m1', 'm2'], durasiMenit: 30 },
    { nama: 'Bahasa Indonesia', soalIds: ['b1', 'b2'], durasiMenit: 25 },
    { nama: 'Bahasa Inggris', soalIds: ['i1'], durasiMenit: 20 },
  ],
};

uji('paket 3 subtes jadi 3 dokumen berurutan + meta per test', () => {
  const dok = bangunDokumenTryOut(paketTigaSubtes, { kini: KINI });
  assert.equal(dok.length, 3);
  assert.deepEqual(dok.map((d) => d.urutan?.ke), [1, 2, 3]);
  assert.equal(dok[0].judul, 'Matematika');
  assert.equal(dok[0].jumlahSoal, 2);
  assert.equal(dok[0].durasiMenit, 30);
  assert.equal(dok[2].jumlahSoal, 1);
  assert.equal(dok[0].paketId, 'pkt1');
  assert.equal(dok[1].subtesIndex, 1);
});

uji('tanpa sesi: test 1 terbuka, test 2-3 terkunci (per-subtes)', () => {
  const dok = bangunDokumenTryOut(paketTigaSubtes, { kini: KINI });
  assert.equal(dok[0].bisaDibuka, true);
  assert.equal(dok[0].stamp, 'SIAP DIKERJAKAN');
  assert.equal(dok[1].terkunci, true);
  assert.equal(dok[2].terkunci, true);
  assert.equal(dok[1].bisaDibuka, false);
  assert.match(dok[2].catatan, /test sebelumnya/i);
});

uji('sesi berjalan di subtes ke-2: ke-1 SUDAH DIAMBIL, ke-3 terkunci', () => {
  const sesi = { status: 'berjalan', subtesAktifIndex: 1, jawaban: { m1: 0, m2: 1 } };
  const dok = bangunDokumenTryOut(paketTigaSubtes, { kini: KINI, sesi });
  assert.equal(dok[0].terlewatUrutan, true);
  assert.equal(dok[0].stamp, 'SUDAH DIAMBIL');
  assert.equal(dok[0].bisaDibuka, false);
  assert.equal(dok[1].bisaDibuka, true);
  assert.equal(dok[1].stamp, 'SEDANG DIKERJAKAN');
  assert.equal(dok[2].terkunci, true);
});

uji('skor per dokumen jujur per test, bukan skor paket utuh', () => {
  const sesi = { status: 'selesai', subtesAktifIndex: 2, jawaban: { m1: 0, m2: 0, b1: 0, b2: 1, i1: 0 } };
  const dok = bangunDokumenTryOut(paketTigaSubtes, { kini: KINI, sesi });
  assert.equal(dok[0].skor, 100);          // 2/2 benar
  assert.equal(dok[1].skor, 50);           // 1/2 benar
  assert.equal(dok[2].skor, 100);          // 1/1 benar
  assert.equal(dok[0].stamp, 'SELESAI · 100%');
  assert.equal(dok[0].bisaDibuka, false);  // selesai ya selesai, buka lewat hasil
});

uji('mode total: semua dokumen terbuka bersamaan + catatan satu duduk', () => {
  const pkt = { ...paketTigaSubtes, id: 'pkt2', modeTimer: 'total' };
  const dok = bangunDokumenTryOut(pkt, { kini: KINI });
  assert.equal(dok.every((d) => d.bisaDibuka), true);
  assert.match(dok[1].catatan, /satu pengerjaan utuh/i);
  assert.equal(dok[0].terkunci, false);
});

uji('paket belum buka: semua dokumen TERJADWAL & tidak bisa dibuka', () => {
  const pkt = { ...paketTigaSubtes, id: 'pkt3', waktuBuka: KINI + 86400_000 };
  const dok = bangunDokumenTryOut(pkt, { kini: KINI });
  assert.equal(dok.every((d) => d.stamp === 'TERJADWAL'), true);
  assert.equal(dok.every((d) => d.bisaDibuka), false);
  assert.equal(statusPaketTryOut(pkt, null, KINI), 'belum-buka');
});

uji('paket lewat deadline tanpa sesi: stamp LEWAT (jalur jujur)', () => {
  const pkt = { ...paketTigaSubtes, id: 'pkt4', waktuTutup: KINI - 1000 };
  const dok = bangunDokumenTryOut(pkt, { kini: KINI });
  assert.equal(dok.every((d) => d.stamp === 'LEWAT'), true);
  assert.equal(dok.every((d) => d.bisaDibuka), false);
});

uji('paket tanpa subtes eksplisit -> satu dokumen utuh', () => {
  const pkt = { id: 'pkt5', judul: 'Latihan Campuran', modeTimer: 'total', waktuBuka: buka, waktuTutup: tutup, daftarSoal: [soal('x1'), soal('x2')] };
  const dok = bangunDokumenTryOut(pkt, { kini: KINI });
  assert.equal(dok.length, 1);
  assert.equal(dok[0].urutan, null);
  assert.equal(dok[0].jumlahSoal, 2);
  assert.equal(dok[0].bisaDibuka, true);
});

uji('susunDokumenTryOut: urut waktu buka lalu urutan test', () => {
  const awal = { ...paketTigaSubtes, id: 'pktA', waktuBuka: KINI - 9999_000, subtes: paketTigaSubtes.subtes.slice(0, 2), daftarSoal: paketTigaSubtes.daftarSoal.slice(0, 4) };
  const dok = susunDokumenTryOut([paketTigaSubtes, awal], { kini: KINI });
  assert.equal(dok.length, 5);
  assert.equal(dok[0].paketId, 'pktA');
  assert.equal(dok[2].paketId, 'pkt1');
  assert.deepEqual(dok.slice(2).map((d) => d.urutan?.ke), [1, 2, 3]);
});

console.log(`\n# dokumenTryOut: ${lulus} lulus, ${gagal} gagal`);
if (gagal > 0) process.exit(1);
