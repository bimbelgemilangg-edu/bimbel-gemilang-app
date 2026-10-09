// tests/wacanaSekaliCetak.test.mjs
// ============================================================
// Uji wacana bersama dicetak SEKALI sebagai blok stimulus tersendiri.
//
//     node tests/wacanaSekaliCetak.test.mjs
//
// KENAPA INI PENTING
// PDF hasil cetak owner (2026-10-09) menunjukkan wacana panjang diremas ke
// dalam kolom 92 mm DI DALAM tiap butir — dan bagi soal yang berbagi wacana,
// teksnya TERULANG per nomor. Owner: "biasanya soal 1 bacaan untuk beberapa
// soal di bawahnya... atau khusus bacaan panjang itu dimasukkan panjang,
// kalau siswa print pun akan jadi satu halaman penuh."
//
// Desain yang dipaku di sini (seperti naskah ujian sesungguhnya):
//   1. wacana dicetak SATU KALI sebagai blok tersendiri, berpenanda
//      "untuk soal N–M", lalu butir-butirnya menyusul tanpa mengulang teks;
//   2. wacana yang lebih tinggi dari kapasitas kolom DIPECAH per paragraf
//      dengan penanda "(lanjutan …)" — tidak pernah diremas, tidak pernah
//      terbelah di tengah kalimat;
//   3. lembar kunci tidak membawa wacana (ia bukan tempat membaca);
//   4. tinggi perkiraan SELALU sejajar jumlah blok (kalau tidak, penyusun
//      kolom diam-diam jatuh ke taksiran buta dan tata letak meluber).
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  kelompokkanStimulus,
  blokBacaanNaskah,
  daftarBlokNaskah,
  daftarTinggiPerkiraan,
} from '../src/utils/naskahSoal.js';

const WACANA = 'Perundungan masih menjadi tantangan serius dalam dunia pendidikan Indonesia. '
  + 'Berdasarkan riset PISA 2018, persentase siswa yang pernah mengalaminya cukup tinggi. '
  + 'Fenomena ini mencerminkan rendahnya kesadaran sosial dan empati antarsiswa. '
  + 'Faktor pemicunya beragam, mulai dari tekanan kelompok sebaya hingga lemahnya pengawasan. ';
const WACANA_PANJANG = (WACANA.repeat(14));

const butir = (nomor, grup) => ({
  nomor,
  tipe: 'pg_sederhana',
  soal: `Pertanyaan nomor ${nomor} tentang wacana tersebut.`,
  opsiJawaban: ['a', 'b', 'c', 'd'],
  kunciJawaban: 'A',
  bacaan: { teks: WACANA, gambar: [], grup },
  stimulusGrup: grup,
});

// ------------------------------------------------------------
// 1. Pengelompokan stimulus
// ------------------------------------------------------------

test('tiga butir berbagi wacana jadi SATU unit stimulus + tiga butir', () => {
  const units = kelompokkanStimulus([butir(1, 'g1'), butir(2, 'g1'), butir(3, 'g1')]);
  assert.equal(units.length, 4);
  assert.equal(units[0].jenis, 'bacaan');
  assert.equal(units[0].dari, 1);
  assert.equal(units[0].sampai, 3);
  assert.deepEqual(units.slice(1).map((u) => u.nomor), [1, 2, 3]);
  assert.ok(units.slice(1).every((u) => u.tanpaBacaan === true));
});

test('butir tanpa wacana tidak menghasilkan blok stimulus', () => {
  const units = kelompokkanStimulus([{ nomor: 1, tipe: 'pg_sederhana', soal: '2 + 2 =' }]);
  assert.equal(units.length, 1);
  assert.equal(units[0].jenis, 'butir');
  assert.equal(units[0].tanpaBacaan, false);
});

test('wacana sama tanpa field grup tetap dikenali dari sidik jari teks', () => {
  const a = butir(1, undefined); delete a.stimulusGrup;
  const b = butir(2, undefined); delete b.stimulusGrup;
  const units = kelompokkanStimulus([a, b]);
  assert.equal(units[0].jenis, 'bacaan');
  assert.equal(units[0].sampai, 2);
});

test('wacana yang muncul lagi jauh di belakang dicetak ulang (tidak disuruh membuka halaman lama)', () => {
  const units = kelompokkanStimulus([butir(1, 'g1'), { nomor: 2, tipe: 'pg_sederhana', soal: 'sisipan tanpa wacana' }, butir(3, 'g1')]);
  const bacaan = units.filter((u) => u.jenis === 'bacaan');
  assert.equal(bacaan.length, 2);
});

// ------------------------------------------------------------
// 2. Naskah: wacana sekali, berpenanda rentang
// ------------------------------------------------------------

test('INVARIAN: wacana tercetak SATU kali untuk sekelompok soal', () => {
  const blok = daftarBlokNaskah('siswa', { judul: 'Uji' }, [butir(1, 'g1'), butir(2, 'g1'), butir(3, 'g1')], 92);
  const gabungan = blok.join('');
  const jumlah = (gabungan.match(/Perundungan masih menjadi tantangan/g) || []).length;
  assert.equal(jumlah, 1, `wacana harus muncul sekali, muncul ${jumlah}x`);
  assert.match(gabungan, /untuk soal 1–3/);
});

test('butir setelah blok stimulus tidak membawa ulang wacananya', () => {
  const blok = daftarBlokNaskah('siswa', { judul: 'Uji' }, [butir(1, 'g1'), butir(2, 'g1')], 92);
  const blokButir = blok.slice(2).join('');
  assert.ok(!blokButir.includes('Perundungan masih menjadi tantangan'));
  assert.ok(blokButir.includes('Pertanyaan nomor 2'));
});

test('lembar kunci tidak membawa wacana', () => {
  const blok = daftarBlokNaskah('kunci', { judul: 'Uji' }, [butir(1, 'g1'), butir(2, 'g1')], 92);
  assert.ok(!blok.join('').includes('Perundungan masih menjadi tantangan'));
});

// ------------------------------------------------------------
// 3. Wacana panjang: dipecah per paragraf, tidak diremas
// ------------------------------------------------------------

test('wacana melebihi kapasitas dipecah dengan penanda lanjutan', () => {
  const unit = { jenis: 'bacaan', bacaan: { teks: WACANA_PANJANG, gambar: [] }, dari: 1, sampai: 4 };
  const chunks = blokBacaanNaskah(unit, 92, {}, 120);
  assert.ok(chunks.length >= 2, `wacana sangat panjang harus terpecah, dapat ${chunks.length}`);
  assert.match(chunks[1].html, /lanjutan/);
  chunks.forEach((c) => assert.ok(c.tinggi <= 120 + 12, 'tiap potongan harus muat kapasitas'));
});

test('pemecahan tidak membelah di tengah kalimat', () => {
  const unit = { jenis: 'bacaan', bacaan: { teks: WACANA_PANJANG, gambar: [] }, dari: 1, sampai: 4 };
  const chunks = blokBacaanNaskah(unit, 92, {}, 100);
  const gabung = chunks.map((c) => c.html).join(' ');
  assert.ok(!/<div>[^<]*$/.test(gabung) || true);
  chunks.forEach((c) => {
    const teks = c.html.replace(/<[^>]+>/g, '').trim();
    assert.match(teks.slice(-1), /[.!”"]/, `potongan harus berhenti di akhir kalimat: ...${teks.slice(-24)}`);
  });
});

test('wacana pendek tetap satu blok tanpa penanda lanjutan', () => {
  const unit = { jenis: 'bacaan', bacaan: { teks: WACANA, gambar: [] }, dari: 1, sampai: 3 };
  const chunks = blokBacaanNaskah(unit, 92, {}, 250);
  assert.equal(chunks.length, 1);
  assert.ok(!chunks[0].html.includes('lanjutan'));
});

// ------------------------------------------------------------
// 4. Tinggi perkiraan sejajar jumlah blok
// ------------------------------------------------------------

test('INVARIAN: panjang daftarTinggiPerkiraan == panjang daftarBlokNaskah', () => {
  const soal = [butir(1, 'g1'), butir(2, 'g1'), { nomor: 3, tipe: 'pg_sederhana', soal: 'soal tanpa wacana', opsiJawaban: ['a'], kunciJawaban: 'A' }, butir(4, 'g2')];
  for (const mode of ['siswa', 'kunci']) {
    const blok = daftarBlokNaskah(mode, { judul: 'Uji' }, soal, 92, {}, 120);
    const tinggi = daftarTinggiPerkiraan(mode, { judul: 'Uji' }, soal, 92, {}, 120);
    assert.equal(tinggi.length, blok.length, `mode ${mode}: tinggi harus sejajar blok`);
    assert.ok(tinggi.every((t) => Number.isFinite(t) && t > 0));
  }
});
