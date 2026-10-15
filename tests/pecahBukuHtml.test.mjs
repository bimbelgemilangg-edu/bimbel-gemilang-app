// tests/pecahBukuHtml.test.mjs — uji util Impor Buku HTML (fitur 14 Okt 2026)
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ekstrakGambarHalamanDariHtml, dataUriKeBase64, adaTeksLayer,
  inventarisBukuHtml, kelompokkanHalamanUntukAi, butirBankDariUjiPemahaman,
  kunciProgresImpor, perkiraanPanggilanAi, gabungkanBabBerjudul,
} from '../src/utils/pecahBukuHtml.js';

const uri = (n) => `data:image/png;base64,aGVsbG8${n}`;
const htmlBuku = `<html><body>
<img class="im" src="${uri(1)}">
<img class="im" src="${uri(2)}">
<img src="https://cdn.luca/gambar.png">
</body></html>`;

test('ekstrak gambar halaman: hanya data-URI, urut dokumen', () => {
  const g = ekstrakGambarHalamanDariHtml(htmlBuku);
  assert.equal(g.length, 2);
  assert.equal(g[0], uri(1));
});

test('dataUriKeBase64 membuang prefix', () => {
  assert.equal(dataUriKeBase64(uri(7)), 'aGVsbG87');
});

test('adaTeksLayer: html pdf2html murni gambar = false', () => {
  assert.equal(adaTeksLayer(htmlBuku), false);
  assert.equal(adaTeksLayer(`<p>${'materi persamaan kuadrat '.repeat(120)}</p>`), true);
});

test('inventaris: berkas raksasa disarankan pecah, berkas kosong ditolak', () => {
  const besar = htmlBuku.replace('<body>', `<body><!-- ${'x'.repeat(950000)} -->`);
  const invB = inventarisBukuHtml(besar);
  assert.equal(invB.layakSimpanUtuhDiFirestore, false);
  assert.match(invB.saran, /JANGAN simpan utuh/);
  assert.match(inventarisBukuHtml('<html></html>').saran, /tidak punya gambar halaman/);
});

test('kelompok halaman: 25 halaman -> 3 panggilan (10/10/5) base64 polos', () => {
  const grup = kelompokkanHalamanUntukAi(Array.from({ length: 25 }, (_, i) => uri(i)));
  assert.deepEqual(grup.map((g) => g.images.length), [10, 10, 5]);
  assert.equal(grup[0].halamanMulai, 1);
  assert.equal(grup[2].halamanSelesai, 25);
  assert.equal(grup[0].images[0], 'aGVsbG80');
});

test('butirBankDariUjiPemahaman: pg valid -> butir bank ber-kunci huruf', () => {
  const b = butirBankDariUjiPemahaman(
    { tipe: 'pg', soal: 'Akar x^2=49?', pilihan: ['6', '7', '8', '9'], benar: 1, pembahasan: 'x=7', level: 'mudah' },
    { mapel: 'Matematika', jenjang: 'SMA/MA', kelas: '10', materi: 'Persamaan Kuadrat', sumber: 'buku.html' },
    3,
  );
  assert.equal(b.tipe, 'pg_sederhana');
  assert.equal(b.kunciJawaban, 'B');
  assert.equal(b.materi, 'Persamaan Kuadrat');
  assert.equal(b.sumberHalaman, 3);
  assert.equal(b.kunciTerverifikasi, false, 'kunci AI belum terverifikasi manusia');
});

test('butirBankDariUjiPemahaman: multi/bs/kunci lepas dipetakan null (jalan manual)', () => {
  assert.equal(butirBankDariUjiPemahaman({ tipe: 'multi', soal: 'x', pilihan: ['a'], benar: [0] }), null);
  assert.equal(butirBankDariUjiPemahaman({ tipe: 'bs', soal: 'x', pernyataan: ['a'], benar: [true] }), null);
  assert.equal(butirBankDariUjiPemahaman({ tipe: 'pg', soal: 'x', pilihan: ['a', 'b'], benar: 5 }), null);
  assert.equal(butirBankDariUjiPemahaman({ tipe: 'pg', soal: '  ', pilihan: ['a', 'b'], benar: 0 }), null);
});

test('kunciProgresImpor spesifik per berkas+ukuran', () => {
  const a = kunciProgresImpor('BUKU.html', 123);
  assert.equal(a, kunciProgresImpor('buku.html', 123));
  assert.notEqual(a, kunciProgresImpor('buku.html', 124));
  assert.notEqual(a, kunciProgresImpor('lain.html', 123));
});

test('perkiraanPanggilanAi: 576 halaman -> 58 panggilan (10/panggilan)', () => {
  assert.equal(perkiraanPanggilanAi(576), 58);
  assert.equal(perkiraanPanggilanAi(0), 0);
  assert.equal(perkiraanPanggilanAi(0) || 0, 0);
});

test('gabungkanBabBerjudul: potongan satu bab melebur, bab beda tetappisah', () => {
  const h = (mulai, selesai, judul, nSec = 1, nUji = 1) => ({
    grup: { urutan: mulai, halamanMulai: mulai, halamanSelesai: selesai, images: [] },
    bab: {
      judul,
      sections: Array.from({ length: nSec }, (_, i) => ({ judul: `S${mulai}.${i}`, blocks: [] })),
      ujiPemahaman: Array.from({ length: nUji }, () => ({ tipe: 'pg', soal: `soal ${mulai}`, pilihan: ['a', 'b'], benar: 0 })),
    },
    provider: 'groq',
  });
  const gab = gabungkanBabBerjudul([
    h(1, 10, 'BAB 2 PERSAMAAN KUADRAT', 2, 3),
    h(11, 20, 'Bab 2 Persamaan Kuadrat', 1, 2),   // judul sama, beda huruf/spasi
    h(21, 30, 'BAB 3 TRIGONOMETRI', 1, 4),
  ]);
  assert.equal(gab.length, 2);
  assert.equal(gab[0].judul, 'BAB 2 PERSAMAAN KUADRAT');
  assert.equal(gab[0].halamanMulai, 1);
  assert.equal(gab[0].halamanSelesai, 20);
  assert.equal(gab[0].sections.length, 3);
  assert.equal(gab[0].ujiPemahaman.length, 5);
  assert.equal(gab[1].judul, 'BAB 3 TRIGONOMETRI');
});

test('gabungkanBabBerjudul: judul kosong tidak melebur jadi satu', () => {
  const h = (mulai, selesai) => ({
    grup: { urutan: mulai, halamanMulai: mulai, halamanSelesai: selesai, images: [] },
    bab: { judul: '', sections: [{ judul: 'x', blocks: [] }], ujiPemahaman: [] },
  });
  const gab = gabungkanBabBerjudul([h(1, 10), h(11, 20)]);
  assert.equal(gab.length, 2, 'judul tak terbaca = bab terpisah (jujur, jangan menelek gabung)');
});
