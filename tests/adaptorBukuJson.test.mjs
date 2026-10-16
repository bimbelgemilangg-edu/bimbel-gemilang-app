// tests/adaptorBukuJson.test.mjs — regresi adaptor JSON ekstraksi
// bertahap (16 Okt 2026) + mesin upsert lintas ekstraksi.
import test from 'node:test';
import assert from 'node:assert/strict';
import { adaptorBukuJson, rencanakanUpsertBab } from '../src/utils/adaptorBukuJson.js';

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
    { id_bab: 'k10-bab-03', nomor_bab_buku: 3, judul_bab: 'Logaritma', materi: [{ judul: 'Dasar', penjelasan: '$\\log x$.' }], latihan_soal: [] },
  ],
};

test('adaptorBukuJson: seksi, rumus math, gambar data-URI, contoh berpembahasan', () => {
  const { bab, statistik, judulBuku } = adaptorBukuJson(DOC);
  assert.equal(judulBuku, 'Bank Materi Matematika SMA Kelas 10');
  assert.equal(bab.length, 2);
  assert.equal(bab[0].kodeSumber, 'k10-bab-01');
  const blocks = bab[0].sections[0].blocks.map((b) => b.tipe).join(',');
  assert.equal(blocks, 'p,math,gambar');
  assert.match(blocks && bab[0].sections[0].blocks[2].src, /^data:image\/png;base64,iVBORw0K$/);
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
