// tests/adaptorBukuJson.test.mjs — regresi adaptor JSON ekstraksi
// bertahap (16 Okt 2026) + mesin upsert lintas ekstraksi.
import test from 'node:test';
import assert from 'node:assert/strict';
import { adaptorBukuJson, rencanakanUpsertBab, klasifikasiBlokLatex } from '../src/utils/adaptorBukuJson.js';

const DOC = {
  metadata: { judul_dokumen: 'Bank Materi Matematika SMA Kelas 10' },
  daftar_bab: [
    {
      id_bab: 'k10-bab-01', nomor_bab_buku: 1, judul_bab: 'Eksponen', semester: 1,
      materi: [
        { kode_subbab: 'A', judul: 'Pengertian', penjelasan: 'Bentuk $a^n$.', rumus_latex: ['$$a^n$$'], gambar_base64: 'iVBORw0K' },
      ],
      contoh_soal: [{ nomor: 1, pertanyaan: 'C1?', opsi: { A: '1', B: '2' }, jawaban: 'B', pembahasan: '$$2$$' }],
      latihan_soal: [{ nomor: 1, pertanyaan: 'L1?', opsi: { A: '1', B: '2', C: '3' } }],
      kunci_jawaban_latihan: { 1: 'C' },
    },
    {
      id_bab: 'k10-bab-03', nomor_bab_buku: 3, judul_bab: 'Logaritma',
      materi: [{ judul: 'Dasar', penjelasan: '$\\log x$.' }],
      contoh_soal: [{ nomor: 1, pertanyaan: 'Tentukan penyelesaian: (a) $x=1$ (b) $x=2$', pembahasan: 'casewise.' }],
      latihan_soal: [],
    },
  ],
};

test('adaptorBukuJson: seksi, rumus math, gambar data-URI, contoh berpembahasan', () => {
  const { bab, statistik, judulBuku } = adaptorBukuJson(DOC);
  assert.equal(judulBuku, 'Bank Materi Matematika SMA Kelas 10');
  assert.equal(bab.length, 2);
  assert.equal(bab[0].kodeSumber, 'k10-bab-01');
  const blocks = bab[0].sections[0].blocks.map((b) => b.tipe).join(',');
  assert.equal(blocks, 'p,math,gambar');
  assert.equal(bab[0].sections[0].blocks[1].teks, 'a^n', 'pembungkus $$ dilucuti (regresi teks merah KaTeX)');
  assert.match(bab[0].sections[0].blocks[2].src, /^data:image\/png;base64,iVBORw0K$/);
  assert.equal(statistik.soalContoh, 1);
  assert.equal(statistik.soalLatihan, 1);
  assert.equal(statistik.soalBerkunci, 2);
  assert.equal(bab[0].ujiPemahaman[0].pembahasan, '$$2$$');
  assert.deepEqual(statistik.babTanpaLatihan, ['Logaritma']);
});

test('adaptorBukuJson: kunci dari peta kunci_jawaban_latihan bila item tak punya kunci', () => {
  const { bab } = adaptorBukuJson(DOC);
  const l = bab[0].ujiPemahaman[1];
  assert.equal(l.benar, 2, 'peta 1:C');
  assert.equal(l.kunciResmiBuku, true);
});

test('adaptorBukuJson: soal tanpa opsi jadi uraian (tidak dibuang), bab urut nomor buku', () => {
  const { bab, statistik } = adaptorBukuJson(DOC);
  assert.equal(statistik.soalUraian, 1);
  const log = bab.find((b) => b.kodeSumber === 'k10-bab-03');
  assert.equal(log.ujiPemahaman.length, 0, 'uraian tidak masuk kuis reader');
  assert.equal(log.soalUraian.length, 1);
  assert.match(log.soalUraian[0].pembahasan, /casewise/);
  assert.equal(bab[0].kodeSumber, 'k10-bab-01', 'urut nomor_bab_buku walau berkas acak');
});

test('rencanakanUpsertBab: id sama diperbarui, bab manual tidak ditimpa', () => {
  const baru = [
    { judul: 'Bab 1 Eksponen', kodeSumber: 'k10-bab-01', sumberImpor: 'json-bertahap' },
    { judul: 'Bab 3 Logaritma', kodeSumber: 'k10-bab-03', sumberImpor: 'json-bertahap' },
    { judul: 'Bab 99 Sisipan Manual', kodeSumber: '', sumberImpor: 'json-bertahap' },
  ];
  const eks = [
    { __id: 'docA', judul: 'Bab 1 Eksponen', kodeSumber: 'k10-bab-01', sumberImpor: 'json-bertahap' },
    { __id: 'docM', judul: 'Bab 3 Logaritma', kodeSumber: 'k10-bab-03', sumberImpor: 'buku-html' },
  ];
  const { perbarui, tambah } = rencanakanUpsertBab(baru, eks);
  assert.equal(perbarui.length, 1);
  assert.equal(perbarui[0].idEks, 'docA');
  assert.equal(tambah.length, 2, 'bab manual ber-id sama TIDAK ditimpa mesin');
});

test('rencanakanUpsertBab: tanpa kodeSumber, judul jadi kunci', () => {
  const { perbarui } = rencanakanUpsertBab(
    [{ judul: 'Bab 1 Eksponen', kodeSumber: '' }],
    [{ __id: 'docZ', judul: ' bab 1 eksponen ', kodeSumber: '', sumberImpor: 'latex-html' }],
  );
  assert.equal(perbarui.length, 1);
});

test('adaptorBukuJson v3: soal bergambar, HOTS, multi-gambar materi, teks bersih', () => {
  const doc = {
    metadata: { judul_dokumen: 'Semester 1 HOTS' },
    daftar_bab: [{
      id_bab: 'k10-bab-01', nomor_bab_buku: 1, judul_bab: 'Eksponen',
      materi: [{ judul: 'A', penjelasan: 'x.', gambar_base64: 'data:image/png;base64,AAA', daftar_gambar_base64: ['data:image/png;base64,BBB'] }],
      latihan_soal: [{
        nomor: 1, pertanyaan: 'Soal graf?', opsi: { A: '1', B: '2' }, kunci_jawaban: 'B',
        gambar_base64: 'data:image/png;base64,CCC', daftar_gambar_base64: ['data:image/png;base64,DDD'],
        pertanyaan_teks_bersih: 'Soal graf (bersih)', opsi_teks_bersih: { A: 'satu', B: 'dua' },
      }],
      soal_hots_ujian_asli: [{ nomor: 1, pertanyaan: 'HOTS?', opsi: { A: '1', B: '2', C: '3' }, kunci_jawaban: 'C', pembahasan: 'karena.' }],
    }],
  };
  const { bab, statistik } = adaptorBukuJson(doc);
  assert.equal(statistik.gambar, 2, 'materi: gambar tunggal + daftar');
  assert.equal(statistik.soalHots, 1);
  assert.equal(statistik.soalBergambar, 1);
  const q = bab[0].ujiPemahaman[0];
  assert.deepEqual(q.gambarUrls, ['data:image/png;base64,CCC'], 'gambar_base64 = gambar SOAL');
  assert.deepEqual(q.pembahasanGambarUrls, ['data:image/png;base64,DDD'], 'daftar_gambar_base64 = gambar PEMBAHASAN');
  assert.equal(q.soalTeksBersih, 'Soal graf (bersih)');
  assert.deepEqual(q.opsiTeksBersih, ['satu', 'dua']);
  const h = bab[0].ujiPemahaman[1];
  assert.equal(h.asalJenis, 'hots');
  assert.equal(h.benar, 2);
  assert.equal(h.pembahasan, 'karena.');
});

test('adaptorBukuJson v3.1: rumus-prosa jadi p, gambar beruntun jadi galeri (regresi 17 Okt)', () => {
  const doc = {
    daftar_bab: [{
      id_bab: 'x1', nomor_bab_buku: 1, judul_bab: 'Uji',
      materi: [{
        judul: 'M',
        penjelasan: 'teks.',
        rumus_latex: [
          '1. Bentuk Dasar: Jika $a=1$ maka $b=2$; jika $c=3$ maka $d=4$ dan seterusnya panjang',
          '$$a^n = b$$',
        ],
        gambar_base64: 'data:image/png;base64,AAA',
        daftar_gambar_base64: ['data:image/png;base64,BBB', 'data:image/png;base64,CCC'],
      }],
    }],
  };
  const { bab } = adaptorBukuJson(doc);
  const blocks = bab[0].sections[0].blocks;
  assert.equal(blocks[0].tipe, 'p');
  assert.equal(blocks[1].tipe, 'p', 'rumus-prosa tidak lagi jadi dinding merah');
  assert.equal(blocks[2].tipe, 'math');
  assert.equal(blocks[3].tipe, 'galeri', 'tiga gambar beruntun jadi satu galeri');
  assert.equal(blocks[3].items.length, 3);
  assert.match(blocks[3].items[0].caption, /gambar 1\/3/);
});

test('klasifikasiBlokLatex: latex telanjang tetap math, prosa ber-$ jadi p', () => {
  assert.equal(klasifikasiBlokLatex('a^{\\frac{p}{q}} = \\sqrt[q]{a^p}'), 'math');
  assert.equal(klasifikasiBlokLatex('$$a^n = b$$'), 'math');
  assert.equal(klasifikasiBlokLatex('1. Bentuk Dasar: Jika $a=1$ maka $b=2$; jika $c=3$ maka $d=4$ seterusnya'), 'prosa');
});
