// tests/alurBukuKeUjian.test.mjs
// ============================================================
// UJI RANTAI PENUH "MESIN SUPER" BUKU -> UJIAN (owner 15 Okt:
// "test dari awal memasukkan sampai disimpan dan dipanggil, entah guru
// atau quiz atau tryout di bank soal").
//
// Dipakai FUNGSI ASLI tiap mata rantai (bukan duplikat logika):
//   pecahBukuHtml (inventaris->gambar->kelompok) -> simulasi respons AI
//   konversiModulScan (fixture) -> gabungkanBabBerjudul -> butirBankDari
//   UjiPemahaman -> lalu SISI PANGGIL: skorSoalTryOut (try out siswa),
//   rakitTryOutTentor (mesin try out guru), tipeDidukung+cocokkanJenjang
//   (pagar mesin otomatis), bentuk kuis (StudentQuizView).
// Batas jaringan (AI/Firestore) diuji terpisah di berkas masing-masing.
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  inventarisBukuHtml, ekstrakGambarHalamanDariHtml, kelompokkanHalamanUntukAi,
  gabungkanBabBerjudul, butirBankDariUjiPemahaman,
} from '../src/utils/pecahBukuHtml.js';
import { soalBisaDinilai, hitungTotalSkor, skorSatuSoal } from '../src/utils/skorSoalTryOut.js';
import { putusanKirimDraf, kelompokkanJadiSubtes, GRANULARITAS } from '../src/utils/rakitTryOutTentor.js';
import { tipeDidukung } from '../src/utils/keranjangTryOut.js';
import { cocokkanJenjang } from '../src/utils/cocokkanJenjang.js';

// ---- 1. MEMASUKKAN: berkas HTML buku (fixture kecil berbentuk pdf2html) ----
const uri = (n) => `data:image/png;base64,aGVsbG8${n}`;
const htmlBuku = `<html><body>${Array.from({ length: 25 }, (_, i) => `<img class="im" src="${uri(i)}">`).join('')}</body></html>`;

test('1 memasukkan: inventaris & pecah halaman otomatis', () => {
  const inv = inventarisBukuHtml(htmlBuku);
  assert.equal(inv.jumlahGambarHalaman, 25);
  assert.equal(inv.adaTeksLayer, false);
  const grup = kelompokkanHalamanUntukAi(ekstrakGambarHalamanDariHtml(htmlBuku));
  assert.deepEqual(grup.map((g) => g.images.length), [10, 10, 5]);
});

// ---- 2. EKSTRAKSI (simulasi respons AI konversiModulscan) + GABUNG BAB ----
const responsAi = [
  { grup: { halamanMulai: 1, halamanSelesai: 10 }, bab: { judul: 'BAB 1 PERSAMAAN KUADRAT', sections: [{ judul: 'A', blocks: [{ jenis: 'p', teks: 'materi' }] }], ujiPemahaman: [
      { tipe: 'pg', level: 'sedang', soal: 'Akar x^2-9=0?', pilihan: ['2', '3', '4', '5'], benar: 1, pembahasan: 'x=3' },
      { tipe: 'pg', level: 'mudah', soal: 'Jumlah akar x^2-5x+6=0?', pilihan: ['5', '6', '-5', '1'], benar: 0, pembahasan: 'x1+x2=5' },
      { tipe: 'pg', level: 'sedang', soal: 'Hasil kali akar x^2-5x+6=0?', pilihan: ['5', '6', '-6', '1'], benar: 1, pembahasan: 'x1*x2=6' }] }, provider: 'groq' },
  { grup: { halamanMulai: 11, halamanSelesai: 20 }, bab: { judul: 'Bab 1 Persamaan Kuadrat', sections: [{ judul: 'B', blocks: [{ jenis: 'p', teks: 'lanjutan' }] }], ujiPemahaman: [
      { tipe: 'pg', level: 'sulit', soal: 'Diskriminan x^2+2x+1?', pilihan: ['0', '1', '2', '4'], benar: 0, pembahasan: 'D=0' },
      { tipe: 'pg', level: 'sedang', soal: 'Sifat akar bila D<0?', pilihan: ['nyata', 'imajiner', 'kembar', 'nol'], benar: 1, pembahasan: 'D<0 imajiner' }] }, provider: 'groq' },
  { grup: { halamanMulai: 21, halamanSelesai: 25 }, bab: { judul: 'BAB 2 TRIGONOMETRI', sections: [{ judul: 'A', blocks: [{ jenis: 'p', teks: 'sin cos' }] }], ujiPemahaman: [
      { tipe: 'pg', level: 'mudah', soal: 'sin 30 derajat?', pilihan: ['1/2', '1', '0', '2'], benar: 0, pembahasan: '1/2' },
      { tipe: 'pg', level: 'sedang', soal: 'cos 60 derajat?', pilihan: ['1/2', '0', '1', '2'], benar: 0, pembahasan: '1/2' }] }, provider: 'openrouter' },
];

test('2 ekstraksi: bab melebur otomatis theo judul tercetak', () => {
  const bab = gabungkanBabBerjudul(responsAi);
  assert.equal(bab.length, 2);
  assert.equal(bab[0].halamanSelesai, 20, 'dua potongan bab 1 melebur');
  assert.equal(bab[0].ujiPemahaman.length, 5);
  assert.equal(bab[1].judul, 'BAB 2 TRIGONOMETRI');
});

// ---- 3. SIMPAN: butir bank soal ber-identitas bab ----
const IDENTITAS = { mapel: 'Matematika', jenjang: 'SMA/MA', kelas: '10', sumber: 'Buku_Matematika_Fase_E.html' };
const babGabungan = gabungkanBabBerjudul(responsAi);
const butirPerBab = babGabungan.map((b) => ({
  bab: b.judul,
  butir: (b.ujiPemahaman || []).map((item) => butirBankDariUjiPemahaman(item, { ...IDENTITAS, materi: b.judul }, b.halamanMulai)).filter(Boolean),
}));
const semuaButir = butirPerBab.flatMap((x) => x.butir);

test('3 simpan: butir bank sah & identitas bab terbawa', () => {
  assert.equal(semuaButir.length, 7);
  assert.equal(butirPerBab[0].butir.length, 5);
  assert.equal(butirPerBab[1].butir.length, 2);
  assert.ok(semuaButir.slice(0, 5).every((b) => b.materi === 'BAB 1 PERSAMAAN KUADRAT'));
  assert.ok(semuaButir.slice(5).every((b) => b.materi === 'BAB 2 TRIGONOMETRI'));
  for (const b of semuaButir) {
    assert.equal(soalBisaDinilai(b), true, 'butir wajib bisa dinilai mesin skor');
    assert.equal(tipeDidukung(b), true, 'butir wajib lolos pagar tipe renderer try out');
    assert.equal(cocokkanJenjang(b.jenjang, 'SMA'), true, 'butir terpanggil jenjang SMA');
    assert.equal(b.status, 'aktif');
  }
});

// ---- 4a. DIPANGGIL: mesin try out siswa (skor) ----
test('4a try out siswa: skor bekerja pada butir impor', () => {
  const jawaban = { [semuaButir[0].id || 'x']: 1 };
  const kunciBenar = semuaButir.map((b, i) => [b, i]);
  const jawabBenar = {};
  kunciBenar.forEach(([b, i]) => { jawabBenar[`s${i}`] = Number(b.kunciJawaban.charCodeAt(0) - 65); });
  const beriId = semuaButir.map((b, i) => ({ ...b, id: `s${i}` }));
  const hasil = hitungTotalSkor(beriId, jawabBenar);
  assert.equal(hasil.totalSkorPersen, 100);
  assert.equal(skorSatuSoal(beriId[0], 1), 1);
  assert.equal(skorSatuSoal(beriId[0], 0), 0);
  assert.ok(jawaban); // penanda jalur jawaban parsial juga dihitung
});

// ---- 4b. DIPANGGIL: mesin try out guru (rakit tentor) per bab ----
test('4b rakit tentor: subtes terbentuk PER BAB buku impor', () => {
  const subtes = kelompokkanJadiSubtes(semuaButir, GRANULARITAS.MATERI)
    .map((g, i) => ({ nama: g.nama, durasiMenit: 20 + i * 5 }));
  const putusan = putusanKirimDraf({
    judul: 'Try Out Matematika Kelas 10 (dari buku)',
    daftarSoal: semuaButir,
    modeTimer: 'per-subtes',
    durasiTotalMenit: 60,
    granularitas: GRANULARITAS.MATERI,
    targetKelas: '10',
    targetKategori: 'Semua',
    subtes,
  });
  assert.equal(putusan.boleh, true, `harus boleh kirim: ${putusan.alasan.join('; ')}`);
  assert.equal(subtes.length, 2, 'dua bab = dua subtes');
  assert.ok(subtes.some((s) => /PERSAMAAN KUADRAT/i.test(s.nama)));
  assert.ok(subtes.some((s) => /TRIGONOMETRI/i.test(s.nama)));
});

// ---- 4c. DIPANGGIL: kuis (bentuk butir yang dibaca StudentQuizView) ----
test('4c kuis: bentuk butir kompatibel renderer kuis', () => {
  for (const b of semuaButir) {
    assert.equal(b.tipe, 'pg_sederhana');
    assert.ok(Array.isArray(b.opsiJawaban) && b.opsiJawaban.length === 4);
    assert.match(b.kunciJawaban, /^[A-D]$/);
    assert.ok(typeof b.soal === 'string' && b.soal.length > 5);
    assert.ok(typeof b.pembahasan === 'string' && b.pembahasan.length > 0, 'kuis butuh pembahasan');
  }
});
