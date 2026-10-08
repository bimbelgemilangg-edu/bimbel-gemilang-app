// tests/logikaSubtesTryOut.test.mjs
// ============================================================
// Uji murni logika navigasi subtes try out (src/utils/logikaSubtesTryOut.js).
// Lahir dari keluhan owner 2026-10-08: siswa mode "per soal individual"
// finish mendadak di soal 4 (tombol "Selesai Subtes Ini" ternyata
// mengumpulkan SELURUH try out) dan ada siswa yang soalnya gak keluar
// (indeks subtes resume menunjuk keluar array). Kedua perilaku itu
// sekarang diputuskan fungsi murni di sini, jadi regression-nya bisa
// ketahuan CI tanpa harus mencoba try out beneran.
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  putusanTombolLanjut,
  putusanWaktuHabis,
  indexSubtesAman,
  filterSubtesMenurutSoalTersedia,
  deteksiGranularitasSubtes,
  isoKeDatetimeLocal,
} from '../src/utils/logikaSubtesTryOut.js';

test('tombol lanjut: masih ada soal di subtes berjalan -> soal berikutnya', () => {
  const p = putusanTombolLanjut({
    modeTimer: 'per-subtes', indexSoalAktif: 2, jumlahSoalAktif: 10, subtesAktifIndex: 0, jumlahSubtes: 3,
  });
  assert.equal(p.aksi, 'soal-berikutnya');
  assert.equal(p.label, 'Selanjutnya');
});

test('tombol lanjut: soal terakhir subtes TAPI masih ada subtes -> pindah subtes, BUKAN selesai', () => {
  // INI BUG LAMANYA: label "Selesai Subtes Ini" dulu memanggil
  // selesaikanTryOut() -> siswa finish di soal 4. Sekarang wajib
  // 'subtes-berikutnya'.
  const p = putusanTombolLanjut({
    modeTimer: 'per-subtes', indexSoalAktif: 0, jumlahSoalAktif: 1, subtesAktifIndex: 3, jumlahSubtes: 23,
  });
  assert.equal(p.aksi, 'subtes-berikutnya');
  assert.equal(p.label, 'Selesai Subtes Ini');
});

test('tombol lanjut: mode per-soal = tiap subtes 1 soal, soal terakhir subtes terakhir -> selesai', () => {
  const p = putusanTombolLanjut({
    modeTimer: 'per-subtes', indexSoalAktif: 0, jumlahSoalAktif: 1, subtesAktifIndex: 22, jumlahSubtes: 23,
  });
  assert.equal(p.aksi, 'selesai');
  assert.equal(p.label, 'Kumpulkan Try Out');
});

test('tombol lanjut: mode total tanpa subtes -> selesai di soal terakhir', () => {
  const p = putusanTombolLanjut({
    modeTimer: 'total', indexSoalAktif: 29, jumlahSoalAktif: 30, subtesAktifIndex: 0, jumlahSubtes: 0,
  });
  assert.equal(p.aksi, 'selesai');
});

test('tombol lanjut: jumlahSoalAktif 0 tidak bikin aksi aneh', () => {
  const p = putusanTombolLanjut({
    modeTimer: 'per-subtes', indexSoalAktif: 0, jumlahSoalAktif: 0, subtesAktifIndex: 0, jumlahSubtes: 5,
  });
  // 0 soal: idxSoal(0) < nSoal-1(-1) salah; subtes masih ada -> pindah subtes
  assert.equal(p.aksi, 'subtes-berikutnya');
});

test('waktu habis: masih ada subtes -> pindah; subtes terakhir -> selesai', () => {
  assert.equal(putusanWaktuHabis({ subtesAktifIndex: 0, jumlahSubtes: 4 }).aksi, 'subtes-berikutnya');
  assert.equal(putusanWaktuHabis({ subtesAktifIndex: 3, jumlahSubtes: 4 }).aksi, 'selesai');
});

test('indexSubtesAman: indeks resume dalam rentang -> tidak disesuaikan', () => {
  assert.deepEqual(indexSubtesAman(5, 23), { index: 5, disesuaikan: false });
});

test('indexSubtesAman: indeks resume keluar array -> di-clamp & ditandai', () => {
  // Kasus keluhan "soalnya gak keluar": sesi menyimpan indeks 12 tapi
  // subtes tinggal 9 (akses mapel siswa berubah di tengah jalan).
  assert.deepEqual(indexSubtesAman(12, 9), { index: 8, disesuaikan: true });
});

test('indexSubtesAman: nilai aneh (null/minus/NaN) -> 0 tanpa crash', () => {
  assert.deepEqual(indexSubtesAman(null, 4), { index: 0, disesuaikan: false });
  assert.deepEqual(indexSubtesAman(-3, 4), { index: 0, disesuaikan: false });
  assert.deepEqual(indexSubtesAman('abc', 4), { index: 0, disesuaikan: false });
});

test('indexSubtesAman: subtes kosong -> index 0, ditandai kalau resume bukan 0', () => {
  assert.deepEqual(indexSubtesAman(3, 0), { index: 0, disesuaikan: true });
  assert.deepEqual(indexSubtesAman(0, 0), { index: 0, disesuaikan: false });
});

test('filterSubtes: subtes yang soalnya habis tersaring dibuang, sisanya utuh', () => {
  const subtes = [
    { nama: 'Soal 1', durasiMenit: 4, soalIds: ['a'] },
    { nama: 'Soal 2', durasiMenit: 4, soalIds: ['b'] },
    { nama: 'Soal 3', durasiMenit: 4, soalIds: ['c'] },
  ];
  const hasil = filterSubtesMenurutSoalTersedia(subtes, new Set(['a', 'c']));
  assert.deepEqual(hasil.map((s) => s.nama), ['Soal 1', 'Soal 3']);
  // input asli tidak boleh termutasi
  assert.equal(subtes[1].soalIds.length, 1);
});

test('filterSubtes: menerima array biasa dan input kosong', () => {
  assert.deepEqual(filterSubtesMenurutSoalTersedia([{ nama: 'x', soalIds: ['a'] }], ['a']).length, 1);
  assert.deepEqual(filterSubtesMenurutSoalTersedia(null, ['a']), []);
});

test('deteksiGranularitas: paket per-soal (23 subtes @1 soal) terbaca "soal"', () => {
  const paket = {
    modeTimer: 'per-subtes',
    totalSoal: 3,
    subtes: [
      { nama: 'Soal 1', soalIds: ['a'], durasiMenit: 4 },
      { nama: 'Soal 2', soalIds: ['b'], durasiMenit: 4 },
      { nama: 'Soal 3', soalIds: ['c'], durasiMenit: 4 },
    ],
  };
  assert.equal(deteksiGranularitasSubtes(paket), 'soal');
});

test('deteksiGranularitas: paket per-mapel terbaca "mapel", mode total -> null', () => {
  const perMapel = {
    modeTimer: 'per-subtes',
    totalSoal: 40,
    subtes: [{ nama: 'Matematika', soalIds: ['a', 'b', 'c'] }, { nama: 'IPA', soalIds: ['d'] }],
  };
  assert.equal(deteksiGranularitasSubtes(perMapel), 'mapel');
  assert.equal(deteksiGranularitasSubtes({ modeTimer: 'total' }), null);
});

test('isoKeDatetimeLocal: ISO UTC jadi nilai input lokal, input rusak jadi ""', () => {
  // 2026-10-10T07:00:00Z di zona waktu apa pun harus jadi HH:mm lokal
  // yang konsisten dengan Date setempat -- yang kita uji formatnya.
  const iso = '2026-10-10T07:00:00.000Z';
  const hasil = isoKeDatetimeLocal(iso);
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, '0');
  assert.equal(hasil, `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`);
  assert.equal(isoKeDatetimeLocal(null), '');
  assert.equal(isoKeDatetimeLocal('bukan-tanggal'), '');
});
