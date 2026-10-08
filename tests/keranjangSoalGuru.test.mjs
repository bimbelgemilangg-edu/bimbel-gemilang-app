// tests/keranjangSoalGuru.test.mjs
// ============================================================
// Uji keranjang soal tentor (src/utils/keranjangSoalGuru.js).
//
//     node tests/keranjangSoalGuru.test.mjs
//
// KENAPA INI PENTING
// Owner 2026-10-08: keranjang harus jadi kartu-kartu baca berisi soal
// lengkap + gambar + watermark logo Gemilang. Syaratnya satu: pilihan
// tentor TIDAK BOLEH HILANG saat ia pindah bab. Di halaman lama setiap
// ganti filter memanggil setTercentang([]) sehingga 15 soal yang sudah
// dicentang lenyap tanpa peringatan — itu akar keluhan "menu pilih
// membingungkan".
//
// Invarian yang dipaku di sini:
//   1. keranjang menyimpan BUTIR, jadi tetap bisa dirender setelah filter
//      berubah (bukan id yang jadi yatim),
//   2. operasi keranjang TIDAK memutasi array asal,
//   3. butir bertipe tak didukung renderer try out (mis. menjodohkan)
//      TETAP BOLEH masuk keranjang — ia sah dicetak. Memblokirnya berarti
//      mencabut kemampuan yang sudah ada (SOP janji #1),
//   4. judul naskah lintas bab tidak boleh mengaku satu bab.
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  teksSoalDari,
  identitasDari,
  benderaButir,
  masukKeranjang,
  masukKeranjangBanyak,
  keluarKeranjang,
  pindahUrutan,
  ringkasKeranjang,
  judulDariKeranjang,
  teksRincianMasuk,
} from '../src/utils/keranjangSoalGuru.js';

const butir = (id, tambahan = {}) => ({
  id,
  tipe: 'pg_sederhana',
  soal: `Teks soal nomor ${id} tentang lingkaran.`,
  opsiJawaban: ['a', 'b', 'c', 'd'],
  kunciJawaban: 'B',
  mataPelajaran: 'Matematika',
  jenjang: 'SMA/MA',
  materi: 'Lingkaran',
  tingkatKelas: '11',
  ...tambahan,
});

// ------------------------------------------------------------
// 1. Pembaca sadar-alias
// ------------------------------------------------------------

test('teks soal terbaca dari ketiga nama field yang beredar', () => {
  assert.equal(teksSoalDari({ soal: 'A' }), 'A');
  assert.equal(teksSoalDari({ teksSoal: 'B' }), 'B');
  assert.equal(teksSoalDari({ teks_soal: 'C' }), 'C');
  assert.equal(teksSoalDari({ soal: '', teksSoal: 'B' }), 'B', 'field kosong tidak boleh menang');
  assert.equal(teksSoalDari(null), '');
});

test('INVARIAN: butir yang hanya punya teksSoal TIDAK dituduh kosong', () => {
  // Inilah bug laten Bersihkan Soal: membaca `s.soal` saja membuat butir
  // sehat dituduh "Teks soal kosong" lalu ter-soft-delete.
  assert.ok(teksSoalDari({ teksSoal: 'Hanya camelCase.' }).length > 0);
});

test('identitas sadar-alias dan mengaku bila benar-benar tak ada', () => {
  assert.deepEqual(identitasDari({ mapel: 'Kimia', bab: 'Ikatan' }), {
    mapel: 'Kimia', jenjang: '(tanpa jenjang)', materi: 'Ikatan', kelas: '',
  });
  assert.equal(identitasDari({ mataPelajaran: 'Fisika' }).mapel, 'Fisika');
  assert.equal(identitasDari({ topik: 'Kinematika' }).materi, 'Kinematika');
  assert.equal(identitasDari(null).mapel, '(tanpa mapel)');
});

// ------------------------------------------------------------
// 2. Bendera mutu (menandai, bukan memblokir)
// ------------------------------------------------------------

test('bendera mutu menandai kunci AI, pembahasan penalaran, dan figur tertunda', () => {
  const b = benderaButir({
    id: 'x', tipe: 'pg_sederhana', soal: 'x', kunciJawaban: 'A',
    kunciTerverifikasi: false, pembahasanAsal: 'penalaran',
    potonganTertunda: [{ urutan: 1 }],
  });
  assert.ok(b.some((t) => /belum terverifikasi/.test(t)));
  assert.ok(b.some((t) => /penalaran model/.test(t)));
  assert.ok(b.some((t) => /menunggu potongan presisi/.test(t)));
});

test('kunci kosong dibenderai, kecuali esai (kunci esai = rubrik, boleh kosong)', () => {
  assert.ok(benderaButir({ tipe: 'pg_sederhana', soal: 'x', kunciJawaban: '' }).some((t) => /kunci jawaban kosong/.test(t)));
  assert.ok(benderaButir({ tipe: 'pg_kompleks', soal: 'x', kunciJawaban: [] }).some((t) => /kunci jawaban kosong/.test(t)));
  assert.deepEqual(benderaButir({ tipe: 'esai', soal: 'x', kunciJawaban: '' }), []);
});

test('INVARIAN: tipe tak didukung try out hanya DIBENDERA, tidak memblokir cetak', () => {
  const b = benderaButir({ id: 'j1', tipe: 'menjodohkan', soal: 'x', pasangan: [{ kiri: 'a', kanan: 'b' }] });
  assert.ok(b.some((t) => /belum didukung renderer try out/.test(t)));
  assert.match(b.join(' '), /tetap bisa dicetak/);
  // dan ia TETAP bisa masuk keranjang:
  const r = masukKeranjang([], butir('j1', { tipe: 'menjodohkan' }));
  assert.equal(r.status, 'baru');
  assert.equal(r.keranjang.length, 1);
});

test('butir sehat tanpa kunci AI tidak berbendera', () => {
  assert.deepEqual(benderaButir(butir('s1')), []);
});

// ------------------------------------------------------------
// 3. Operasi keranjang
// ------------------------------------------------------------

test('masuk keranjang: baru, lalu duplikat ditolak sopan', () => {
  const a = masukKeranjang([], butir('1'));
  assert.equal(a.status, 'baru');
  assert.equal(a.keranjang.length, 1);
  const b = masukKeranjang(a.keranjang, butir('1'));
  assert.equal(b.status, 'sudahAda');
  assert.equal(b.keranjang.length, 1, 'duplikat tidak boleh menumpuk');
});

test('INVARIAN: array asal tidak pernah dimutasi', () => {
  const asal = [butir('1')];
  const salinan = [...asal];
  masukKeranjang(asal, butir('2'));
  keluarKeranjang(asal, '1');
  pindahUrutan(asal, '1', 1);
  assert.deepEqual(asal, salinan);
  assert.equal(asal.length, 1);
});

test('butir tanpa id ditolak (tidak bisa dijadikan key React/dokumen)', () => {
  const r = masukKeranjang([], { soal: 'tanpa id' });
  assert.equal(r.status, 'tanpaId');
  assert.equal(r.keranjang.length, 0);
});

test('keranjang menyimpan BUTIR sehingga tetap ter-render setelah filter berubah', () => {
  const { keranjang } = masukKeranjangBanyak([], [butir('1'), butir('2', { materi: 'Turunan' })]);
  // filter berpindah ke bab lain; keranjang tidak kehilangan apa pun
  assert.equal(keranjang.length, 2);
  assert.equal(teksSoalDari(keranjang[1]).includes('nomor 2'), true);
  assert.equal(identitasDari(keranjang[1]).materi, 'Turunan');
});

test('masuk banyak: rincian jujur (baru / sudah ada / dilewati)', () => {
  const tahap1 = masukKeranjangBanyak([], [butir('1'), butir('2')]);
  assert.deepEqual(tahap1.rincian, { baru: 2, sudahAda: 0, dilewati: 0 });
  const tahap2 = masukKeranjangBanyak(tahap1.keranjang, [butir('2'), butir('3'), { soal: 'tanpa id' }]);
  assert.deepEqual(tahap2.rincian, { baru: 1, sudahAda: 1, dilewati: 1 });
  assert.equal(tahap2.keranjang.length, 3);
});

test('keluar keranjang menghapus tepat satu butir', () => {
  const { keranjang } = masukKeranjangBanyak([], [butir('1'), butir('2'), butir('3')]);
  const sisa = keluarKeranjang(keranjang, '2');
  assert.equal(sisa.length, 2);
  assert.deepEqual(sisa.map((s) => s.id), ['1', '3']);
  assert.equal(keluarKeranjang(keranjang, 'tidak-ada').length, 3);
});

test('pindah urutan: naik, turun, dan berhenti di ujung tanpa melempar', () => {
  const { keranjang } = masukKeranjangBanyak([], [butir('1'), butir('2'), butir('3')]);
  assert.deepEqual(pindahUrutan(keranjang, '2', -1).map((s) => s.id), ['2', '1', '3']);
  assert.deepEqual(pindahUrutan(keranjang, '2', 1).map((s) => s.id), ['1', '3', '2']);
  assert.deepEqual(pindahUrutan(keranjang, '1', -1).map((s) => s.id), ['1', '2', '3'], 'sudah di atas: tetap');
  assert.deepEqual(pindahUrutan(keranjang, '3', 1).map((s) => s.id), ['1', '2', '3'], 'sudah di bawah: tetap');
  assert.deepEqual(pindahUrutan(keranjang, 'gaib', 1).map((s) => s.id), ['1', '2', '3']);
});

test('input kosong/janggal tidak melempar', () => {
  for (const k of [null, undefined, [], 'bukan array']) {
    assert.equal(masukKeranjang(k, butir('1')).keranjang.length, 1);
    assert.deepEqual(keluarKeranjang(k, '1'), []);
    assert.deepEqual(pindahUrutan(k, '1', 1), []);
    assert.equal(ringkasKeranjang(k).jumlah, 0);
  }
  assert.equal(masukKeranjangBanyak(null, null).keranjang.length, 0);
});

// ------------------------------------------------------------
// 4. Ringkasan & judul jujur
// ------------------------------------------------------------

test('ringkasan menghitung per materi/mapel/jenjang + bendera', () => {
  const { keranjang } = masukKeranjangBanyak([], [
    butir('1'),
    butir('2'),
    butir('3', { materi: 'Turunan', mataPelajaran: 'Matematika' }),
    butir('4', { materi: 'Ikatan', mataPelajaran: 'Kimia', kunciTerverifikasi: false }),
  ]);
  const r = ringkasKeranjang(keranjang);
  assert.equal(r.jumlah, 4);
  assert.deepEqual(r.perMateri[0], { nama: 'Lingkaran', jumlah: 2 });
  assert.equal(r.perMapel.length, 2);
  assert.equal(r.berbendera, 1);
  assert.equal(r.tanpaIdentitas, 0);
});

test('butir tanpa identitas terhitung di ringkasan', () => {
  const { keranjang } = masukKeranjangBanyak([], [butir('1', { mataPelajaran: '', materi: '', jenjang: '' })]);
  assert.equal(ringkasKeranjang(keranjang).tanpaIdentitas, 1);
});

test('INVARIAN: judul naskah lintas bab tidak mengaku satu bab', () => {
  const satu = masukKeranjangBanyak([], [butir('1'), butir('2')]).keranjang;
  assert.equal(judulDariKeranjang(satu), 'SMA/MA · Matematika · Lingkaran');

  const campur = masukKeranjangBanyak([], [butir('1'), butir('2', { materi: 'Turunan' }), butir('3', { materi: 'Limit' })]).keranjang;
  const judul = judulDariKeranjang(campur);
  assert.match(judul, /3 materi/);
  assert.ok(!judul.includes('Lingkaran'), 'tidak boleh mengaku satu bab padahal tiga');
});

test('keranjang kosong mengaku kosong', () => {
  assert.equal(judulDariKeranjang([]), 'Keranjang kosong');
});

test('teks rincian menyebut angka sebenarnya dan tidak berbohong saat nol', () => {
  assert.equal(teksRincianMasuk({ baru: 5, sudahAda: 2, dilewati: 1 }), '✓ 5 soal masuk keranjang, 2 sudah ada di keranjang, 1 dilewati (tanpa id).');
  assert.equal(teksRincianMasuk({ baru: 0, sudahAda: 0, dilewati: 0 }), 'Tidak ada soal baru yang bisa dimasukkan.');
  assert.equal(teksRincianMasuk({ baru: 3, sudahAda: 0, dilewati: 0 }), '✓ 3 soal masuk keranjang.');
});
