// tests/seksiNaskahTryOut.test.mjs
// ============================================================
// Test penyusun seksi naskah cetak try out (src/utils/seksiNaskahTryOut.js).
//
//     node tests/seksiNaskahTryOut.test.mjs
//
// KENAPA INI PENTING
// Owner minta tombol "print soal yang udah di tata ... tinggal print"
// langsung di halaman Terbitkan Try Out. Yang dijaga di sini ialah
// janji-janji yang bisa bocor diam-diam saat naskah dicetak:
//   1. nomor butir URUT LANJUT lintas seksi (1..N), bukan mulai lagi
//     dari 1 tiap subtes -- persis naskah UTBK/TKA asli;
//   2. mode "per soal individual" TIDAK mencetak kepala seksi per soal
//     (23 kepala "SOAL 1..23" di kertas = sampah tinta & bingung);
//   3. soal yang tidak disebut subtes mana pun TETAP tercetak (masuk
//     seksi "Soal Lainnya"), gak hilang diam-diam;
//   4. struktur subtes keranjang IDENTIK dengan rumus payload terbit
//     (bangunSubtesKeranjang satu-satunya sumber kebenaran);
//   5. kunci tidak bocor ke blok siswa, peringatan wajib ada di blok
//     kunci; tinggi perkiraan SELARAS INDEKS dengan blok (kalau tidak,
//     susunan halaman awal melenceng sebelum pengukuran layar tiba).
// ============================================================

import assert from 'node:assert/strict';
import {
  judulSeksiHtml,
  bangunSubtesKeranjang,
  rencanaSeksiNaskah,
  blokNaskahDariSeksi,
  perkiraanTinggiBlokSeksi,
} from '../src/utils/seksiNaskahTryOut.js';
import { susunNaskahDariBlok } from '../src/utils/naskahSoal.js';

const soal = (id, mapel) => ({
  id,
  mataPelajaran: mapel,
  soal: `Teks soal ${id}`,
  opsiJawaban: ['8', '10', '12', '14'],
  kunciJawaban: [0],
  pembahasan: `Karena ${id}`,
});

// ---- 1. bangunSubtesKeranjang = rumus payload tombol Terbitkan ----
const lima = [soal('a', 'Matematika'), soal('b', 'Matematika'), soal('c', 'IPA'), soal('d', 'IPA'), soal('e', 'Matematika')];

assert.deepEqual(bangunSubtesKeranjang(lima, { modeTimer: 'total' }), [],
  'mode total tidak punya subtes');

const subtesSoal = bangunSubtesKeranjang(lima, { modeTimer: 'per-subtes', granularitasSubtes: 'soal', durasiPerSoal: 4 });
assert.equal(subtesSoal.length, 5, 'granularitas soal: 1 subtes per butir');
assert.deepEqual(subtesSoal[0], { nama: 'Soal 1', durasiMenit: 4, soalIds: ['a'] });
assert.equal(bangunSubtesKeranjang(lima, { modeTimer: 'per-subtes', granularitasSubtes: 'soal' })[2].durasiMenit, 3,
  'durasi per soal jatuh ke default 3 menit');

const subtesMapel = bangunSubtesKeranjang(lima, { modeTimer: 'per-subtes', granularitasSubtes: 'mapel', durasiSubtes: { Matematika: 45 } });
assert.deepEqual(subtesMapel.map((s) => s.nama), ['Matematika', 'IPA'], 'urutan subtes = urutan kemunculan pertama di keranjang');
assert.deepEqual(subtesMapel[0].soalIds, ['a', 'b', 'e'], 'soal masuk subtes mapelnya');
assert.equal(subtesMapel[0].durasiMenit, 45, 'durasi subtes dari isian form');
assert.equal(subtesMapel[1].durasiMenit, 30, 'durasi subtes tanpa isian jatuh ke 30');
assert.deepEqual(bangunSubtesKeranjang(null, { modeTimer: 'per-subtes' }), [], 'input null aman');

// ---- 2. rencanaSeksiNaskah: kapan kepala seksi muncul & kapan tidak ----
const paketTotal = { modeTimer: 'total', daftarSoal: lima };
const renTotal = rencanaSeksiNaskah(paketTotal);
assert.equal(renTotal.seksi.length, 1, 'mode total: satu seksi');
assert.equal(renTotal.seksi[0].judul, '', 'mode total: tanpa kepala seksi');
assert.equal(renTotal.seksi[0].soalList.length, 5, 'mode total: semua soal tercetak');
assert.equal(renTotal.granularitas, 'tanpa');

const paketPerSoal = { modeTimer: 'per-subtes', daftarSoal: lima, subtes: subtesSoal };
const renPerSoal = rencanaSeksiNaskah(paketPerSoal);
assert.equal(renPerSoal.seksi.length, 1, 'granularitas soal: kepala seksi DITIADAKAN (satu seksi saja)');
assert.equal(renPerSoal.granularitas, 'soal');

const paketMapel = { modeTimer: 'per-subtes', daftarSoal: lima, subtes: subtesMapel };
const renMapel = rencanaSeksiNaskah(paketMapel);
assert.deepEqual(renMapel.seksi.map((s) => s.judul), ['Matematika', 'IPA'], 'kepala seksi mengikuti urutan subtes');
assert.deepEqual(renMapel.seksi[1].soalList.map((s) => s.id), ['c', 'd']);
assert.equal(renMapel.granularitas, 'mapel');

const satuSubtes = { modeTimer: 'per-subtes', daftarSoal: lima, subtes: [subtesMapel[0]] };
assert.equal(rencanaSeksiNaskah(satuSubtes).seksi.length, 1, 'satu subtes: kepala seksi tidak berguna');

// soal yang tidak disebut subtes mana pun TETAP harus tercetak
const paketBocor = { modeTimer: 'per-subtes', daftarSoal: lima, subtes: [{ nama: 'Matematika', soalIds: ['a', 'b'] }, { nama: 'IPA', soalIds: ['c', 'd'] }] };
const renBocor = rencanaSeksiNaskah(paketBocor);
assert.deepEqual(renBocor.seksi.map((s) => s.judul), ['Matematika', 'IPA', 'Soal Lainnya'], 'sisa soal masuk seksi penyelamat');
assert.equal(renBocor.seksi[2].soalList.length, 1);
const semuaTerCetak = renBocor.seksi.flatMap((s) => s.soalList).map((s) => s.id).sort();
assert.deepEqual(semuaTerCetak, ['a', 'b', 'c', 'd', 'e'], 'tidak ada soal yang hilang dari rencana cetak');

// subtes berisi id asing (data rusak/edit lama) tidak melahirkan seksi hantu
const paketIdAsing = { modeTimer: 'per-subtes', daftarSoal: lima, subtes: [{ nama: 'X', soalIds: ['zzz'] }, { nama: 'IPA', soalIds: ['c', 'd'] }] };
assert.deepEqual(rencanaSeksiNaskah(paketIdAsing).seksi.map((s) => s.judul), ['IPA', 'Soal Lainnya']);
assert.deepEqual(rencanaSeksiNaskah({ daftarSoal: null }).seksi, [{ judul: '', soalList: [] }], 'paket kosong aman');

// ---- 3. blokNaskahDariSeksi: nomor urut lanjut & kepala seksi ----
const blokSiswa = blokNaskahDariSeksi('siswa', { judul: 'Try Out X' }, renMapel.seksi, 90);
assert.equal(blokSiswa.length, 1 + 2 + 5, 'kop + 2 kepala seksi + 5 butir');
assert.ok(blokSiswa[0].includes('NASKAH SOAL'), 'blok 0 kepala dokumen siswa');
assert.ok(blokSiswa[1].includes('nsk-seksi') && blokSiswa[1].includes('Matematika'), 'blok 1 kepala seksi pertama');
const nomorUrut = [2, 3, 4, 6, 7].map((i) => blokSiswa[i].match(/nsk-no">(\d+)\.</)?.[1]);
assert.deepEqual(nomorUrut, ['1', '2', '3', '4', '5'], 'nomor butir urut lanjut lintas seksi');
assert.ok(blokSiswa[4].includes('nsk-seksi') === false && blokSiswa[5].includes('nsk-seksi'), 'kepala seksi kedua hadir tepat sebelum butir pertama seksinya');
assert.ok(!blokSiswa.some((b) => b.includes('Kunci:')), 'kunci tidak bocor ke blok siswa');

const blokKunci = blokNaskahDariSeksi('kunci', { judul: 'Try Out X' }, renMapel.seksi, 90);
assert.ok(blokKunci[0].includes('PEGANGAN GURU'), 'blok kunci berkepala peringatan');
assert.ok(blokKunci[3].includes('Kunci:'), 'baris kunci hadir di mode kunci');
const nomorKunci = [4, 6, 7].map((i) => blokKunci[i].match(/nsk-no">(\d+)\.</)?.[1]);
assert.deepEqual(nomorKunci, ['3', '4', '5'], 'nomor kunci selaras dengan nomor siswa');

// ---- 4. perkiraan tinggi SELARAS INDEKS dengan blok ----
const perkiraan = perkiraanTinggiBlokSeksi('siswa', renMapel.seksi, 90);
assert.equal(perkiraan.length, blokSiswa.length, 'tinggi perkiraan selaras indeks dengan blok');
assert.equal(perkiraan[0], 26, 'kepala dokumen 26mm');
assert.equal(perkiraan[1], 9, 'kepala seksi 9mm');
assert.ok(perkiraan.slice(2).every((t) => Number.isFinite(t) && t > 0), 'tiap butir punya taksiran positif');

// ---- 5. ujung-ke-ujung: fragmen naskah memuat seksi & kaki halaman ----
const hasil = susunNaskahDariBlok(blokSiswa, { kertas: 'A4', jumlahKolom: 2, tinggiPerkiraanMm: perkiraan.slice(1) });
assert.ok(hasil.fragmen.includes('nsk-seksi'), 'fragmen cetak memuat kepala seksi');
assert.ok(hasil.fragmen.includes('Matematika'), 'judul seksi tampil di fragmen (huruf besar urusan CSS cetak)');
assert.ok(hasil.fragmen.includes(`— 1 / ${hasil.jumlahHalaman} —`), 'kaki halaman hadir');
assert.ok(hasil.jumlahHalaman >= 1 && hasil.jumlahKolom === 2);
assert.ok(judulSeksiHtml('A & B').includes('&amp;'), 'judul seksi di-escape supaya aman disuntikkan');

console.log('OK tests/seksiNaskahTryOut.test.mjs — seksi naskah try out: nomor lanjut, kepala seksi jujur, tiada soal hilang');
