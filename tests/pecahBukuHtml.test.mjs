// tests/pecahBukuHtml.test.mjs — uji util Impor Buku HTML (fitur 14 Okt 2026)
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ekstrakGambarHalamanDariHtml, dataUriKeBase64, adaTeksLayer,
  inventarisBukuHtml, kelompokkanHalamanUntukAi, butirBankDariUjiPemahaman,
  kunciProgresImpor, perkiraanPanggilanAi, gabungkanBabBerjudul, keGambarAi,
  klasifikasiGagalEkstraksi, parseResponsEkstraksi,
  saringButirDuplikat, saringBabDuplikat,
  angkaBerkas, urutkanBerkasGambar, klasifikasiGambarHalaman, aksiModeImpor,
  labelBabTersimpan,
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

test('keGambarAi: data-URI, base64 polos, dan object diseragamkan (anti "base64,undefined")', () => {
  const out = keGambarAi([
    'data:image/png;base64,aGVsbG8x',
    'aGVsbG8y',
    { mime: 'image/jpeg', data: 'aGVsbG8z' },
    '',
  ]);
  assert.deepEqual(out, [
    { mime: 'image/png', data: 'aGVsbG8x' },
    { mime: 'image/jpeg', data: 'aGVsbG8y' },
    { mime: 'image/jpeg', data: 'aGVsbG8z' },
  ]);
});

test('kelompokkanHalamanUntukAi menyimpan dataUris asli ber-mime', () => {
  const g = kelompokkanHalamanUntukAi([uri(1), uri(2)]);
  assert.deepEqual(g[0].dataUris, [uri(1), uri(2)]);
  assert.deepEqual(keGambarAi(g[0].dataUris), [{ mime: 'image/png', data: 'aGVsbG81' }, { mime: 'image/png', data: 'aGVsbG82' }]);
});

test('round-trip payload endpoint identik dengan byte sumber (validasi berkas owner 72MB)', () => {
  // Bukti lapangan 15 Okt: tool tools/verifikasi-buku-html.mjs menjalankan
  // pipeline ini terhadap berkas buku owner sesungguhnya (576 halaman,
  // 390 png + 186 jpeg) dan SELURUH payload round-trip identik + magic
  // bytes cocok. Uji ini memaku properti itu pada fixture.
  const asli = [uri(1), 'data:image/jpeg;base64,/9j/4AAQ'];
  const objs = keGambarAi(asli);
  objs.forEach((o, i) => {
    assert.equal(`data:${o.mime};base64,${o.data}`, asli[i]);
  });
  assert.equal(objs[1].mime, 'image/jpeg');
});

test('klasifikasiGagalEkstraksi: kuota vs payload vs lain', () => {
  assert.equal(klasifikasiGagalEkstraksi('HTTP_429: You exceeded your current quota'), 'kuota');
  assert.equal(klasifikasiGagalEkstraksi('code 503 UNAVAILABLE high demand'), 'kuota');
  assert.equal(klasifikasiGagalEkstraksi('Unexpected token \'A\', "An error o"... is not valid JSON'), 'payload');
  assert.equal(klasifikasiGagalEkstraksi('413 ENTITY_TOO_LARGE'), 'payload');
  assert.equal(klasifikasiGagalEkstraksi('model mati aneh'), 'lain');
});

test('parseResponsEkstraksi: teks polos tidak lagi meledakkan klien', () => {
  const buruk = parseResponsEkstraksi('An error occurred while processing.');
  assert.equal(buruk.ok, false);
  assert.match(buruk.pesan, /An error occurred/);
  const baik = parseResponsEkstraksi(JSON.stringify({ success: true, bab: { sections: [] }, provider: 'gemini' }));
  assert.equal(baik.ok, true);
  assert.equal(parseResponsEkstraksi(JSON.stringify({ error: 'stok habis' })).pesan, 'stok habis');
});

test('anti-duplikat: butir berkas+halaman+teks sama disaring', () => {
  const b = { sumberFile: 'B.html', sumberHalaman: 11, soal: 'Akar  x^2-9=0?' };
  const eksisting = [{ sumberFile: 'b.html', sumberHalaman: 11, soal: 'akar x^2-9=0?' }];
  assert.equal(saringButirDuplikat([b], eksisting).length, 0, 'beda huruf/spasi tetap dianggap sama');
  assert.equal(saringButirDuplikat([{ ...b, sumberHalaman: 21 }], eksisting).length, 1);
  assert.equal(saringButirDuplikat([{ ...b, soal: 'Soal lain?' }], eksisting).length, 1);
});

test('anti-duplikat: bab judul sama atau rentang halaman tindih disaring', () => {
  const lama = [{ judul: 'Vektor', halamanSumber: [151, 170] }];
  assert.equal(saringBabDuplikat([{ judul: 'vektor', halamanSumber: [999, 999] }], lama).length, 0);
  assert.equal(saringBabDuplikat([{ judul: 'Baru', halamanSumber: [160, 180] }], lama).length, 0, 'rentang tindih');
  assert.equal(saringBabDuplikat([{ judul: 'Baru', halamanSumber: [171, 180] }], lama).length, 1);
});

test('folder gambar: urutan natural & pemisahan halaman vs figur', () => {
  assert.deepEqual(urutkanBerkasGambar(['1_375.png', '372.jpg', '1_374.jpg', '1_373.png']),
    ['372.jpg', '1_373.png', '1_374.jpg', '1_375.png']);
  assert.equal(angkaBerkas('2_374.jpg'), 374);
  assert.equal(klasifikasiGambarHalaman(1700, 2400), 'halaman');
  assert.equal(klasifikasiGambarHalaman(500, 466), 'figur');
  assert.equal(klasifikasiGambarHalaman(900, 1200), 'figur', 'lebar <1000 dianggap figur');
});

test('aksiModeImpor: setiap mode punya tombol aksinya (regresi tombol hilang)', () => {
  assert.equal(aksiModeImpor('pdf').perluPratinjauTeks, true);
  assert.equal(aksiModeImpor('teks').perluPratinjauTeks, true);
  assert.equal(aksiModeImpor('folder').perluEkstrakVision, true);
  assert.equal(aksiModeImpor('gambar').perluEkstrakVision, true);
  assert.equal(aksiModeImpor('pdf').perluEkstrakVision, false);
});

test('labelBabTersimpan: halaman sumber opsional (regresi simpan-crash mode teks 15 Okt 2026)', () => {
  // Mode TEKS/PDF-OCR menyimpan bab dengan halamanSumber null. Log simpan
  // dulu membaca `[0]` langsung -> TypeError -> bab pertama tersimpan tapi
  // sisanya + bank soal tidak pernah tertulis.
  assert.equal(
    labelBabTersimpan({ judul: 'Vektor', halamanSumber: [151, 170] }),
    '✓ Bab "Vektor" (hal 151-170) tersimpan sebagai draf.',
  );
  assert.equal(
    labelBabTersimpan({ judul: 'Bab OCR', halamanSumber: null }),
    '✓ Bab "Bab OCR" tersimpan sebagai draf.',
  );
  assert.equal(
    labelBabTersimpan({ halamanSumber: null }),
    '✓ Bab "tanpa judul" tersimpan sebagai draf.',
  );
  assert.equal(labelBabTersimpan(), '✓ Bab "tanpa judul" tersimpan sebagai draf.');
});
