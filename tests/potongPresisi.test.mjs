// tests/potongPresisi.test.mjs
// ============================================================
// Test logika murni editor Potong Presisi (src/utils/potongPresisi.js).
//
//     node tests/potongPresisi.test.mjs
//
// KENAPA INI PENTING
// Keluhan owner 2026-10-07: gambar soal dari alur HTML Master Gemini
// adalah gambar buatan AI (tidak presisi), sementara kajian membuktikan
// auto-locate dari crop AI tidak andal (skor 0.26–0.38). Solusinya:
// manusia memotong dari berkas asli dibantu snap-tinta, hasilnya
// MENGGANTIKAN url di dokumen bank_soal. Salah pemetaan indeks =
// gambar soal lain yang terganti; lupa sync opsiJawaban = pilihan
// ganda tetap menampilkan crop AI; base64 lolos ke Firestore =
// dokumen menembus batas 1 MB dan soal hilang senyap.
//
// Invarian yang dikunci:
//   1. kunciRect menormalkan seret arah bebas & menolak kotak di luar kanvas
//   2. snapKeTinta mengunci ke bbox tinta + margin, null bila tak bertinta
//   3. gambarMeta SELALU sejajar indeks gambarUrls setelah pembaruan
//   4. mode 'ganti' menyelaraskan opsiJawaban kaya & field gambar lama
//   5. mode 'tambah' mengurangi potonganTertunda, region dari pemanggil
//   6. URL non-https (base64) DITOLAK masuk dokumen
// ============================================================

import assert from 'node:assert/strict';
import {
  kunciRect,
  bboxTinta,
  snapKeTinta,
  butuhPerbaikanGambar,
  namaPotongan,
  terapkanPotongan,
} from '../src/utils/potongPresisi.js';

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

/** Kanvas piksel sintetis: putih semua, tinta = daftar [x,y] hitam. */
function pikselSintetis(lebar, tinggi, titikTinta = [], { asalX = 0, asalY = 0 } = {}) {
  const data = new Uint8ClampedArray(lebar * tinggi * 4);
  for (let i = 0; i < lebar * tinggi; i += 1) {
    data[i * 4] = 255; data[i * 4 + 1] = 255; data[i * 4 + 2] = 255; data[i * 4 + 3] = 255;
  }
  for (const [x, y] of titikTinta) {
    const i = (y * lebar + x) * 4;
    data[i] = 20; data[i + 1] = 20; data[i + 2] = 20; data[i + 3] = 255;
  }
  return { data, lebar, tinggi, asalX, asalY };
}

console.log('potongPresisi — editor potongan gambar presisi');

// ============================================================
bagian('kunciRect — normalisasi & penguncian kotak');
// ============================================================

uji('seret ke kiri-atas (lebar/tinggi negatif) dinormalkan', () => {
  const r = kunciRect({ x: 100, y: 100, lebar: -40, tinggi: -20 }, 500, 500);
  assert.deepEqual(r, { x: 60, y: 80, lebar: 40, tinggi: 20 });
});

uji('kotak melewati tepi kanvas dipotong masuk', () => {
  const r = kunciRect({ x: -10, y: 480, lebar: 100, tinggi: 100 }, 500, 500);
  assert.deepEqual(r, { x: 0, y: 480, lebar: 90, tinggi: 20 });
});

uji('kotak terlalu kecil → null (tidak menyimpan potongan 1 piksel)', () => {
  assert.equal(kunciRect({ x: 10, y: 10, lebar: 3, tinggi: 40 }, 500, 500), null);
});

uji('kotak sepenuhnya di luar kanvas → null', () => {
  assert.equal(kunciRect({ x: 600, y: 10, lebar: 50, tinggi: 50 }, 500, 500), null);
});

// ============================================================
bagian('bboxTinta & snapKeTinta — rapikan ke tepi tinta');
// ============================================================

uji('bboxTinta menemukan kotak pembatas tinta', () => {
  const p = pikselSintetis(20, 20, [[5, 4], [9, 4], [7, 12]]);
  const b = bboxTinta(p, { x: 0, y: 0, lebar: 20, tinggi: 20 });
  assert.deepEqual(b, { x0: 5, y0: 4, x1: 10, y1: 13 });
});

uji('bboxTinta menghormati offset jendela (asalX/asalY)', () => {
  // Jendela 10×10 yang sudut kirinya di (100,50) halaman penuh.
  const p = pikselSintetis(10, 10, [[2, 3]], { asalX: 100, asalY: 50 });
  const b = bboxTinta(p, { x: 100, y: 50, lebar: 10, tinggi: 10 });
  assert.deepEqual(b, { x0: 102, y0: 53, x1: 103, y1: 54 });
});

uji('bboxTinta tanpa tinta / tanpa irisan → null', () => {
  const bersih = pikselSintetis(10, 10);
  assert.equal(bboxTinta(bersih, { x: 0, y: 0, lebar: 10, tinggi: 10 }), null);
  const p = pikselSintetis(10, 10, [[1, 1]], { asalX: 100, asalY: 100 });
  assert.equal(bboxTinta(p, { x: 0, y: 0, lebar: 10, tinggi: 10 }), null);
});

uji('snapKeTinta mengunci ke tinta + margin, tetap di dalam halaman', () => {
  const p = pikselSintetis(60, 60, [[20, 20], [39, 20], [20, 39], [39, 39]]);
  const r = snapKeTinta({ x: 10, y: 10, lebar: 45, tinggi: 45 }, p, { margin: 4, cari: 2 });
  assert.deepEqual(r, { x: 16, y: 16, lebar: 28, tinggi: 28 });
});

uji('snapKeTinta di pojok halaman tidak keluar kanvas', () => {
  const p = pikselSintetis(30, 30, [[0, 0], [5, 5]]);
  const r = snapKeTinta({ x: 0, y: 0, lebar: 10, tinggi: 10 }, p, { margin: 8, cari: 2 });
  assert.equal(r.x, 0);
  assert.equal(r.y, 0);
  assert.ok(r.lebar <= 30 && r.tinggi <= 30);
});

uji('snapKeTinta tanpa tinta di sekitar kotak → null (halaman wajib lapor)', () => {
  const p = pikselSintetis(60, 60, [[2, 2]]);
  assert.equal(snapKeTinta({ x: 40, y: 40, lebar: 15, tinggi: 15 }, p), null);
});

uji('snapKeTinta menangkap tinta sedikit di luar kotak (cari=16)', () => {
  const p = pikselSintetis(60, 60, [[18, 18], [32, 32]]);
  // Kotak hanya mencakup titik pertama; titik kedua 14px di luar → masih
  // tertangkap radius cari, sehingga bbox merangkul keduanya.
  const r = snapKeTinta({ x: 16, y: 16, lebar: 10, tinggi: 10 }, p, { margin: 2, cari: 16 });
  assert.ok(r.lebar >= 16 && r.tinggi >= 16, `kotak harus merangkul dua titik, dapat ${JSON.stringify(r)}`);
});

// ============================================================
bagian('butuhPerbaikanGambar — filter antrean');
// ============================================================

uji('menghitung tertunda & indeks gambar berflag', () => {
  const dok = {
    potonganTertunda: [{ urutan: 1, petunjuk: 'a' }, { urutan: 2, petunjuk: 'b' }],
    gambarMeta: [
      { asal: 'url-asli' },
      { asal: 'base64-tanpa-asal' },
      { asal: 'potongan-asli' },
      { asal: 'tak-dikenal' },
    ],
  };
  assert.deepEqual(butuhPerbaikanGambar(dok), { menunggu: 2, dicurigai: [1, 3] });
});

uji('dokumen lama tanpa gambarMeta TIDAK dituduh', () => {
  assert.deepEqual(butuhPerbaikanGambar({ gambarUrls: ['https://x/a.png'] }), { menunggu: 0, dicurigai: [] });
});

// ============================================================
bagian('namaPotongan — nama berkas storage');
// ============================================================

uji('id soal disanitasi, urutan terbaca', () => {
  assert.equal(namaPotongan({ soalId: 'aB/3 x_9', urutan: 2 }), 'potongan-presisi_aB_3_x_9_2.png');
});

// ============================================================
bagian('terapkanPotongan mode ganti — menggantikan gambar berflag');
// ============================================================

const DOK = () => ({
  gambarUrls: ['https://cdn/x-ai.png', 'https://cdn/asli.png'],
  gambarMeta: [{ sumber: '', asal: 'base64-tanpa-asal', caption: 'grafik' }],
  opsiJawaban: [
    { teks: 'A', gambar: [{ url: 'https://cdn/x-ai.png', sumber: '', asal: 'base64-tanpa-asal' }] },
    { teks: 'B' },
  ],
  gambar: [],
  potonganTertunda: [{ urutan: 1, petunjuk: 'hal 12, diagram siklus' }],
});

uji('url terganti, meta dicap potongan-asli + audit, sejajar indeks', () => {
  const h = terapkanPotongan(DOK(), {
    jenis: 'ganti', indeksGambar: 0, url: 'https://cdn/presisi.png',
    berkasSumber: '11 Bonus.pdf', ts: 'T',
  });
  assert.equal(h.ok, true);
  assert.deepEqual(h.perubahan.gambarUrls, ['https://cdn/presisi.png', 'https://cdn/asli.png']);
  const m = h.perubahan.gambarMeta;
  assert.equal(m.length, 2, 'meta wajib disejajarkan dengan urls');
  assert.equal(m[0].asal, 'potongan-asli');
  assert.equal(m[0].sumber, '11 Bonus.pdf');
  assert.equal(m[0].caption, 'grafik', 'caption lama dipertahankan');
  assert.deepEqual(m[0].dipotongPresisi, { alat: 'potong-presisi', ts: 'T' });
  assert.deepEqual(m[1], {}, 'slot meta baru kosong, tidak menuduh');
});

uji('opsiJawaban kaya yang menunjuk url lama ikut diselaraskan', () => {
  const h = terapkanPotongan(DOK(), { jenis: 'ganti', indeksGambar: 0, url: 'https://cdn/presisi.png' });
  const opsiA = h.perubahan.opsiJawaban[0];
  assert.equal(opsiA.gambar[0].url, 'https://cdn/presisi.png');
  assert.equal(opsiA.gambar[0].asal, 'potongan-asli');
  assert.equal(h.perubahan.opsiJawaban[1].teks, 'B', 'opsi tak tersentuh');
});

uji('mengganti gambar ke-2 tidak menulis opsiJawaban (tak ada yang menunjuk)', () => {
  const h = terapkanPotongan(DOK(), { jenis: 'ganti', indeksGambar: 1, url: 'https://cdn/p2.png' });
  assert.equal(h.ok, true);
  assert.equal(h.perubahan.opsiJawaban, undefined);
  assert.equal(h.perubahan.gambarUrls[1], 'https://cdn/p2.png');
});

uji('base64 DITOLAK masuk dokumen (batas 1 MB Firestore)', () => {
  const h = terapkanPotongan(DOK(), { jenis: 'ganti', indeksGambar: 0, url: 'data:image/png;base64,iVBOR' });
  assert.equal(h.ok, false);
  assert.match(h.galat, /https/);
});

uji('indeks di luar jangkauan → galat jujur', () => {
  const h = terapkanPotongan(DOK(), { jenis: 'ganti', indeksGambar: 5, url: 'https://cdn/p.png' });
  assert.equal(h.ok, false);
});

// ============================================================
bagian('terapkanPotongan mode tambah — menyelesaikan potonganTertunda');
// ============================================================

uji('url ditambahkan, entri antrean dibuang, region dari pemanggil', () => {
  const h = terapkanPotongan(DOK(), {
    jenis: 'tambah', indeksTertunda: 0, url: 'https://cdn/pot.png',
    berkasSumber: 'hal12.jpg', region: 'pembahasan', ts: 'T',
  });
  assert.equal(h.ok, true);
  assert.deepEqual(h.perubahan.gambarUrls, ['https://cdn/x-ai.png', 'https://cdn/asli.png', 'https://cdn/pot.png']);
  assert.deepEqual(h.perubahan.potonganTertunda, []);
  assert.deepEqual(h.perubahan.gambarMeta[1], {}, 'slot meta bolong dibantal netral — sejajar indeks urls');
  const m = h.perubahan.gambarMeta[2];
  assert.equal(m.asal, 'potongan-asli');
  assert.equal(m.region, 'pembahasan');
  assert.equal(m.sumber, 'hal12.jpg');
  assert.equal(m.caption, 'hal 12, diagram siklus', 'caption default = petunjuknya');
});

uji('tanpa region pemanggil → default badan (penempatan akhir teks soal)', () => {
  const h = terapkanPotongan(DOK(), { jenis: 'tambah', indeksTertunda: 0, url: 'https://cdn/pot.png' });
  assert.equal(h.perubahan.gambarMeta[2].region, 'badan');
});

uji('indeks tertunda salah → galat, dokumen tak berubah', () => {
  const h = terapkanPotongan(DOK(), { jenis: 'tambah', indeksTertunda: 3, url: 'https://cdn/pot.png' });
  assert.equal(h.ok, false);
});

uji('mode tak dikenal → galat', () => {
  assert.equal(terapkanPotongan(DOK(), { jenis: 'hapus', url: 'https://cdn/a.png' }).ok, false);
});

// ============================================================
// RINGKASAN
// ============================================================
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
