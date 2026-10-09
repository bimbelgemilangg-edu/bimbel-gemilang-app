// tests/bacaanLebarPenuh.test.mjs
// ============================================================
// Uji: WACANA PANJANG DICETAK LEBAR PENUH (tanpa kanan-kiri) sebagai
//      PITA di atas halaman; wacana di kolom pakai huruf lebih kecil.
//
//     node tests/bacaanLebarPenuh.test.mjs
//
// KENAPA INI PENTING
// PDF hasil cetak owner "Bimbel Gemilang System test.pdf" (2026-10-09) diukur
// titik demi titik (sumbu dalam mm, A4 = 210 x 297, isi kertas habis ~289 mm):
//   - halaman 1: wacana dialog 184 mm masuk KOLOM KANAN sendirian, kolom kiri
//     cuma berisi kop -> separuh kertas kosong, dan tabel Benar/Salah berakhir
//     di y=295 mm (menabrak kaki halaman);
//   - halaman 2: cerpen 272 mm di kolom kiri, opsi (A) dan (B) jatuh di
//     y=285-298 mm -> TERPOTONG tepi kertas;
//   - halaman 3: butir sepanjang itu kebetulan dapat satu kolom sendirian
//     sehingga melebar penuh -> justru halaman paling rapi.
// Owner: "perkecil font bacaan dan rapikan agar muat kanan kiri, atau khusus
// bacaan panjang gausah kanan kiri."
//
// Yang dipaku di sini:
//   1. wacana panjang naik ke PITA LEBAR PENUH di atas halaman (satu baris
//      lebar, tanpa kanan-kiri); soal-soalnya tetap dua kolom DI BAWAH pita,
//      jadi tidak ada kertas terbuang dan urutan baca-kerjakan alami;
//   2. kop boleh ikut naik ke pita -> tidak ada halaman berisi kop saja;
//   3. pita tidak pernah dicampur butir biasa (barisnya jadi terlalu panjang);
//   4. tata letak satu kolom (A5) tidak ikut-ikutan memakai pita;
//   5. urutan cetak & kelengkapan blok tidak pernah berubah;
//   6. tidak ada kolom yang meluber kapasitas, termasuk di halaman berpita;
//   7. huruf bacaan di dalam kolom diperkecil.
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GAYA_NASKAH,
  ambangBacaanPanjangMm,
  blokBacaanNaskah,
  butuhLebarPenuh,
  daftarBlokNaskah,
  daftarBlokPenuh,
  daftarTinggiPerkiraan,
  estimasiTinggiBacaan,
  kertasDariKode,
  kapasitasKolomMm,
  susunKeKolom,
  susunNaskahDariBlok,
  tinggiLebarPenuhMm,
} from '../src/utils/naskahSoal.js';

const A4 = kertasDariKode('A4');
const KAPASITAS = kapasitasKolomMm(A4);       // 267 mm
const AMBANG = ambangBacaanPanjangMm(KAPASITAS);
const WACANA = 'Perundungan masih menjadi tantangan serius dalam dunia pendidikan Indonesia. '
  + 'Berdasarkan riset PISA 2018, persentase siswa yang pernah mengalaminya cukup tinggi. '
  + 'Fenomena ini mencerminkan rendahnya kesadaran sosial dan empati antarsiswa. ';
const WACANA_PANJANG = WACANA.repeat(16);

const butir = (nomor, teks = `Pertanyaan nomor ${nomor}.`) => ({
  nomor,
  tipe: 'pg_sederhana',
  soal: teks,
  opsiJawaban: ['opsi satu', 'opsi dua', 'opsi tiga', 'opsi empat'],
  kunciJawaban: 'A',
});

/** Urutan cetak sesungguhnya: pita dulu (atas), lalu kolom kiri-kanan. */
const urutanCetak = (halaman, lebarHalaman) => halaman
  .map((kolomLista, h) => [...(lebarHalaman[h] || []), ...kolomLista.flat()])
  .flat();

// ------------------------------------------------------------
// 1. Wacana panjang -> pita lebar penuh, soal tetap dua kolom di bawahnya
// ------------------------------------------------------------

test('wacana panjang naik ke PITA lebar penuh, soal berikutnya tetap dua kolom', () => {
  const { halaman, lebarHalaman, peringatan } = susunKeKolom([26, 300, 40, 40, 40], KAPASITAS, 2);
  assert.deepEqual(peringatan, [], '300 mm di kolom = ~165 mm saat lebar: masih muat satu halaman');
  assert.deepEqual(lebarHalaman[0], [0, 1], 'kop + wacana panjang jadi pita halaman 1');
  assert.equal(halaman[0].flat().length >= 2, true, 'sisa soal mengisi kolom di bawah pita');
  assert.ok(halaman[0].length <= 2, 'tetap maksimal dua kolom');
});

test('pita hanya berisi wacana panjang (+kop), tidak pernah butir biasa', () => {
  const tinggi = [26, 300, 40, 250, 30, 30];
  const { lebarHalaman } = susunKeKolom(tinggi, KAPASITAS, 2);
  lebarHalaman.forEach((pita) => {
    pita.forEach((i) => {
      assert.ok(i === 0 || tinggi[i] > AMBANG, `blok ${i} (${tinggi[i]} mm) bukan wacana panjang`);
    });
  });
});

test('kop ikut naik ke pita bila muat (tidak ada halaman berisi kop saja)', () => {
  const { halaman, lebarHalaman } = susunKeKolom([26, 300, 60, 60], KAPASITAS, 2);
  assert.deepEqual(lebarHalaman[0], [0, 1]);
  assert.ok(!halaman.some((h) => h.flat().length === 1 && h.flat()[0] === 0),
    'kop tidak boleh sendirian menghabiskan satu halaman');
});

test('kop TIDAK dipaksa naik bila wacananya lebih dari satu halaman penuh', () => {
  const { halaman, lebarHalaman, peringatan } = susunKeKolom([26, 900, 40], KAPASITAS, 2);
  assert.deepEqual(peringatan, [1], '900 mm tetap dilaporkan: melebihi satu halaman penuh');
  assert.deepEqual(halaman[0].flat(), [0], 'kop berdiri sendiri supaya wacana tidak terpotong');
  assert.deepEqual(lebarHalaman[1], [1]);
});

test('tata letak satu kolom tidak pernah memakai pita', () => {
  const { lebarHalaman } = susunKeKolom([26, 300, 40], KAPASITAS, 1);
  assert.ok(lebarHalaman.every((p) => p.length === 0), 'satu kolom sudah selebar kertas');
});

test('INVARIAN: semua blok tercetak, urut, tidak ada yang ganda atau hilang', () => {
  const tinggi = [26, 40, 300, 50, 45, 500, 30, 260, 20];
  const { halaman, lebarHalaman } = susunKeKolom(tinggi, KAPASITAS, 2);
  assert.deepEqual(urutanCetak(halaman, lebarHalaman), tinggi.map((_, i) => i));
});

test('tidak ada kolom yang meluber kapasitas, termasuk di halaman berpita', () => {
  const tinggi = [26, 40, 300, 50, 45, 500, 30, 260, 20];
  const { halaman, lebarHalaman, luapan } = susunKeKolom(tinggi, KAPASITAS, 2);
  halaman.forEach((kolomLista, h) => {
    const pita = lebarHalaman[h] || [];
    const tPita = pita.reduce((a, i) => a + (i === 0 ? tinggi[i] : tinggiLebarPenuhMm(tinggi[i])), 0);
    kolomLista.forEach((kol) => {
      const jumlah = kol.reduce((a, i) => a + tinggi[i], 0);
      assert.ok(jumlah <= KAPASITAS, `halaman ${h + 1} kolom ${kol} = ${jumlah} mm`);
      if (pita.length && kol.length) {
        assert.ok(tPita + Math.max(...kol.map((i) => tinggi[i])) <= KAPASITAS + 60,
          `halaman ${h + 1}: pita ${Math.round(tPita)} mm + kolom meluber`);
      }
    });
    // pita boleh melewati satu halaman HANYA bila halamannya ditandai mengalir
    assert.ok(tPita <= KAPASITAS || luapan[h] === true,
      `halaman ${h + 1}: pita ${Math.round(tPita)} mm > satu halaman tapi tidak ditandai mengalir`);
  });
});

test('bendera blokPenuh dihormati untuk wacana yang masih muat satu kolom', () => {
  // 200 mm < kapasitas (267) tapi > ambang panjang (166): owner minta wacana
  // semacam ini TIDAK dicetak kanan-kiri
  const { lebarHalaman } = susunKeKolom([26, 200, 40], KAPASITAS, 2, { blokPenuh: [false, true, false] });
  assert.deepEqual(lebarHalaman[0], [0, 1]);
});

test('bendera blokPenuh TIDAK membuang halaman untuk blok yang terukur pendek', () => {
  const { lebarHalaman } = susunKeKolom([26, 90, 40], KAPASITAS, 2, { blokPenuh: [false, true, false] });
  assert.ok(lebarHalaman.every((p) => p.length === 0), '90 mm jauh di bawah ambang -> tetap dua kolom');
});

test('dua wacana panjang beruntun tidak ditumpuk di satu pita bila tidak muat', () => {
  const { halaman, lebarHalaman } = susunKeKolom([26, 400, 400, 30], KAPASITAS, 2);
  assert.equal(lebarHalaman.length, halaman.length, 'pita sejajar halaman');
  assert.deepEqual(lebarHalaman[0], [0, 1]);
  assert.deepEqual(lebarHalaman[1], [2], 'wacana kedua dapat halaman sendiri');
});

// ------------------------------------------------------------
// 2. Fragmen HTML + CSS
// ------------------------------------------------------------

test('fragmen menandai halaman berpita dengan class dan wadah nsk-band', () => {
  const blok = daftarBlokNaskah('siswa', { judul: 'TKA Bahasa Indonesia' }, [butir(1), butir(2)], 92);
  const { fragmen, halamanLebarPenuh } = susunNaskahDariBlok(blok, { kertas: 'A4', jumlahKolom: 2, tinggiBlokMm: [26, 300, 40] });
  assert.match(fragmen, /nsk-hal nsk-hal--lebar/, 'harus ada halaman ber-class lebar penuh');
  assert.match(fragmen, /<div class="nsk-band">/, 'wacana panjang dibungkus pita');
  assert.deepEqual(halamanLebarPenuh, [1], 'laporan ke guru: halaman 1 berpita');
});

test('wacana super panjang menandai halamannya agar MENGALIR (tidak terpotong)', () => {
  const { peringatan, luapan, lebarHalaman } = susunKeKolom([26, 900, 40], KAPASITAS, 2);
  assert.deepEqual(peringatan, [1]);
  assert.equal(luapan[1], true, 'halaman berpita 900 mm harus dibiarkan mengalir');
  assert.equal(luapan[0], false);
  assert.ok(lebarHalaman[1].includes(1));
});

test('CSS: pita benar-benar lebar penuh dan boleh mengalir', () => {
  assert.match(GAYA_NASKAH, /nsk-hal--lebar \{ display: flex; flex-direction: column; \}/);
  assert.match(GAYA_NASKAH, /nsk-band \{ width: 100%;/);
  assert.match(GAYA_NASKAH, /nsk-band \.nsk-butir, \.naskah \.nsk-band \.nsk-bacaan \{ break-inside: auto/);
  assert.match(GAYA_NASKAH, /nsk-hal--luapan \{ height: auto !important; overflow: visible !important; \}/);
});

test('CSS: huruf bacaan di kolom diperkecil (owner: "perkecil font bacaan")', () => {
  const kolom = GAYA_NASKAH.match(/\.naskah \.nsk-bacaan \{[^}]*font-size:\s*([\d.]+)pt/);
  assert.ok(kolom, 'aturan .nsk-bacaan harus ada');
  assert.ok(Number(kolom[1]) <= 10, `font bacaan kolom harus <= 10pt, dapat ${kolom[1]}pt`);
  const pita = GAYA_NASKAH.match(/nsk-band \.nsk-bacaan \{[^}]*font-size:\s*([\d.]+)pt/);
  assert.ok(pita, 'aturan bacaan di pita harus ada');
  assert.ok(Number(pita[1]) >= Number(kolom[1]), 'di pita barisnya panjang, huruf boleh lebih besar');
});

// ------------------------------------------------------------
// 3. Blok bacaan: panjang -> lebar penuh, pendek -> kolom
// ------------------------------------------------------------

test('wacana panjang jadi blok lebar penuh (class khusus + tanda penuh)', () => {
  const unit = { jenis: 'bacaan', bacaan: { teks: WACANA_PANJANG, gambar: [] }, dari: 1, sampai: 3 };
  const chunks = blokBacaanNaskah(unit, 92, {}, KAPASITAS, 2);
  assert.ok(chunks.every((c) => c.penuh === true), 'semua potongan wacana panjang bertanda penuh');
  assert.ok(chunks.every((c) => c.html.includes('nsk-bacaan-panjang')), 'memakai class lebar penuh');
  // Tinggi yang dilaporkan adalah versi LEBAR KOLOM (satuan baku seluruh
  // mesin: lapisan ukur DOM pun mengukur pada lebar kolom). Versi lebarnya
  // ditaksir susunKeKolom lewat FAKTOR_TINGGI_LEBAR_PENUH.
  const tKolom = estimasiTinggiBacaan(unit.bacaan, 92, {});
  const tLapor = chunks.reduce((a, c) => a + c.tinggi, 0);
  assert.ok(tLapor >= tKolom * 0.9,
    `tinggi dilaporkan harus versi kolom (${tKolom}), dapat ${tLapor}`);
  assert.ok(tinggiLebarPenuhMm(tLapor) < tLapor, 'versi lebar penuh pasti lebih pendek');
  chunks.forEach((c) => assert.ok(tinggiLebarPenuhMm(c.tinggi) <= KAPASITAS + 1,
    'tiap potongan harus muat satu halaman saat dicetak lebar penuh'));
});

test('wacana sedang tetap di kolom, huruf kecil, tanpa tanda penuh', () => {
  const unit = { jenis: 'bacaan', bacaan: { teks: WACANA, gambar: [] }, dari: 1, sampai: 3 };
  const chunks = blokBacaanNaskah(unit, 92, {}, KAPASITAS, 2);
  assert.equal(chunks.length, 1);
  assert.ok(!chunks[0].penuh, 'wacana pendek tidak perlu pita');
  assert.match(chunks[0].html, /class="nsk-bacaan"/);
  assert.ok(!chunks[0].html.includes('nsk-bacaan-panjang'));
  assert.ok(chunks[0].tinggi <= AMBANG, 'masih di bawah ambang panjang');
});

test('ambang panjang = 62% kapasitas kolom dan pembantu tinggi lebar konsisten', () => {
  assert.ok(Math.abs(ambangBacaanPanjangMm(200) - 124) < 0.01);
  assert.equal(butuhLebarPenuh(201, 200), true);
  assert.equal(butuhLebarPenuh(200, 200), false);
  assert.ok(Math.abs(tinggiLebarPenuhMm(100) - 55) < 0.01);
  assert.equal(tinggiLebarPenuhMm('bukan angka'), 0);
});

// ------------------------------------------------------------
// 4. daftarBlokPenuh sejajar daftarBlokNaskah
// ------------------------------------------------------------

test('INVARIAN: panjang daftarBlokPenuh == panjang daftarBlokNaskah', () => {
  const soal = [
    { ...butir(1), bacaan: { teks: WACANA_PANJANG, gambar: [] }, stimulusGrup: 'g1' },
    { ...butir(2), bacaan: { teks: WACANA_PANJANG, gambar: [] }, stimulusGrup: 'g1' },
    butir(3),
    { ...butir(4), bacaan: { teks: WACANA, gambar: [] }, stimulusGrup: 'g2' },
  ];
  for (const kolom of [1, 2]) {
    const blok = daftarBlokNaskah('siswa', { judul: 'Uji' }, soal, 92, {}, KAPASITAS, kolom);
    const penuh = daftarBlokPenuh('siswa', { judul: 'Uji' }, soal, 92, {}, KAPASITAS, kolom);
    const tinggi = daftarTinggiPerkiraan('siswa', { judul: 'Uji' }, soal, 92, {}, KAPASITAS, kolom);
    assert.equal(penuh.length, blok.length, `kolom ${kolom}: tanda harus sejajar blok`);
    assert.equal(tinggi.length, blok.length, `kolom ${kolom}: tinggi harus sejajar blok`);
    assert.ok(penuh.every((v) => typeof v === 'boolean'));
    assert.equal(penuh[0], false, 'kop bukan wacana panjang (ia hanya boleh menumpang pita)');
  }
});

test('lembar kunci tidak pernah memakai pita lebar penuh', () => {
  const soal = [{ ...butir(1), bacaan: { teks: WACANA_PANJANG, gambar: [] }, stimulusGrup: 'g1' }];
  const penuh = daftarBlokPenuh('kunci', { judul: 'Uji' }, soal, 92, {}, KAPASITAS, 2);
  const blok = daftarBlokNaskah('kunci', { judul: 'Uji' }, soal, 92, {}, KAPASITAS, 2);
  assert.equal(penuh.length, blok.length);
  assert.ok(penuh.every((v) => v === false));
});

test('butir berwacana raksasa di dalam stem ikut ditandai lebar penuh', () => {
  // kasus nyata owner: wacana menempel di stem (impor HTML Master / Tinitus),
  // bukan di field bacaan
  const raksasa = { ...butir(1), soal: WACANA_PANJANG };
  const penuh = daftarBlokPenuh('siswa', { judul: 'Uji' }, [raksasa, butir(2)], 92, {}, KAPASITAS, 2);
  assert.equal(penuh[1], true, 'butir raksasa harus naik ke pita lebar penuh');
  assert.equal(penuh[2], false, 'butir biasa tetap dua kolom');
});

// ------------------------------------------------------------
// 5. Simulasi angka sungguhan dari PDF owner
// ------------------------------------------------------------

test('simulasi PDF owner: tidak ada isi di luar kertas, tidak boros halaman', () => {
  // tinggi terbaca dari PDF "Bimbel Gemilang System test.pdf" (mm)
  const tinggi = [
    26,   // kop
    184,  // dialog Raka/Intan/Bima (dulu meluber ke y=295)
    100,  // instruksi + tabel Benar/Salah
    272,  // cerpen Hakim Dodot (dulu opsi A/B terpotong di y=298)
    96,   // butir moda + opsi
    220,  // wacana perundungan
    60,   // pertanyaan ejaan + opsi
  ];
  const nama = ['kop', 'dialog', 'tabel B/S', 'cerpen', 'moda', 'perundungan', 'ejaan'];
  const blokPenuh = tinggi.map((h) => butuhLebarPenuh(h, AMBANG));
  const { halaman, lebarHalaman, peringatan } = susunKeKolom(tinggi, KAPASITAS, 2, { blokPenuh });

  assert.deepEqual(peringatan, [], 'tidak ada blok yang melewati satu halaman penuh');
  assert.deepEqual(urutanCetak(halaman, lebarHalaman), tinggi.map((_, i) => i), 'urutan cetak utuh');

  halaman.forEach((kolomLista, h) => {
    const pita = lebarHalaman[h] || [];
    const tPita = pita.reduce((a, i) => a + (i === 0 ? tinggi[i] : tinggiLebarPenuhMm(tinggi[i])), 0);
    kolomLista.forEach((kol) => {
      const jumlah = kol.reduce((a, i) => a + tinggi[i], 0);
      assert.ok(jumlah <= KAPASITAS - tPita + 0.01,
        `halaman ${h + 1} (${pita.map((i) => nama[i])}) kolom ${kol.map((i) => nama[i])}: pita ${Math.round(tPita)} + kolom ${jumlah} > ${KAPASITAS}`);
    });
  });

  // tiga wacana panjang pasti naik ke pita
  const semuaPita = lebarHalaman.flat();
  [1, 3, 5].forEach((i) => assert.ok(semuaPita.includes(i), `${nama[i]} harus lebar penuh`));
  assert.ok(halaman.length <= 4, `tidak boleh boros kertas: dapat ${halaman.length} halaman`);
});
