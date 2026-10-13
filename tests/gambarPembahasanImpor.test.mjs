// tests/gambarPembahasanImpor.test.mjs
// ============================================================
// Test perbaikan cacat jalur IMPOR HTML GEMINI (2026-10-11).
//
//     node tests/gambarPembahasanImpor.test.mjs
//
// KENAPA INI PENTING
// Keluhan owner: hasil impor "gak seperti asli PDF" dan "gak support
// pembahasan bentuk gambar". Audit menemukan tujuh cacat di rantai
// prompt paten -> ekstrakHtmlGemini -> imporHtmlGeminiKeBank -> renderer.
// Empat di antaranya cacat SENYAP: tidak ada error, tidak ada peringatan,
// yang ada hanya gambar yang hilang atau nyasar ke posisi salah. Cacat
// senyap wajib dipaku dengan test, sebab tidak ada cara lain untuk tahu
// ia muncul lagi.
//
// Yang dikunci di sini:
//   Cacat 1  gambar pembahasan dibuang di renderer naskah cetak
//   Cacat 3  indeks gambar BERGESER saat satu upload gagal
//   Cacat 5  <sub>/<sup>/<td> diratakan tanpa jejak
//   Cacat 6  cabang mati normTipe menolak soal sah
//   Cacat 7  region gambar tidak sampai ke renderer
// ============================================================

import assert from 'node:assert/strict';
import { rapikanGambarButir, dokumenDariButir } from '../src/utils/imporHtmlGeminiKeBank.js';
import { ekstrakHtmlGemini, htmlKeTeks } from '../src/utils/ekstrakHtmlGemini.js';
import { pisahTeksDanGambar } from '../src/utils/penempatanGambar.js';
import { kunciButirNaskahHtml } from '../src/utils/naskahSoal.js';
import { validateQuestion } from '../src/utils/bankSoalSanitizer.js';

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
function bagian(j) { console.log(`\n${j}`); }

// ============================================================
bagian('CACAT 3 — indeks gambar bergeser saat satu upload gagal');
// ============================================================
// Skenario nyata: soal punya 4 figur, figur #2 gagal diunggah ke Supabase
// (kuota habis / base64 rusak / jaringan putus). Perilaku LAMA: array
// gambarUrls jadi [u1,u3,u4] sedangkan token {{GAMBAR_3}} tetap menunjuk
// indeks 2 -- yang sekarang berisi u4. Diagram pembahasan yang tampil
// adalah gambar SALAH, dan tidak ada satu pun pesan error.

const DAFTAR_4_GAMBAR_2_GAGAL = [
  { urutan: 1, url: 'https://x/g1.png', region: 'badan', caption: 'Grafik soal' },
  { urutan: 2, url: '', region: 'opsi' },                       // ← GAGAL unggah
  { urutan: 3, url: 'https://x/g3.png', region: 'pembahasan', caption: 'Diagram tahap' },
  { urutan: 4, url: 'https://x/g4.png', region: 'pembahasan' },
];

uji('token {{GAMBAR_n}} ditulis ulang ke indeks baru yang padat', () => {
  const hasil = rapikanGambarButir({
    soal: 'Perhatikan grafik! {{GAMBAR_1}} Laju reaksi....',
    pembahasan: 'Tahap 1 {{GAMBAR_3}} lalu tahap 2 {{GAMBAR_4}}.',
    gambarUrls: [],
  }, DAFTAR_4_GAMBAR_2_GAGAL);

  assert.deepEqual(hasil.gambarUrls, ['https://x/g1.png', 'https://x/g3.png', 'https://x/g4.png']);
  // 3 -> 2 dan 4 -> 3 karena slot #2 hilang
  assert.ok(hasil.pembahasan.includes('{{GAMBAR_2}}'), `diharap {{GAMBAR_2}}, dapat: ${hasil.pembahasan}`);
  assert.ok(hasil.pembahasan.includes('{{GAMBAR_3}}'), `diharap {{GAMBAR_3}}, dapat: ${hasil.pembahasan}`);
  assert.ok(!hasil.pembahasan.includes('{{GAMBAR_4}}'), 'token lama {{GAMBAR_4}} seharusnya sudah ditulis ulang');
});

uji('token milik gambar yang GAGAL diunggah dibuang, bukan dibiarkan mentah', () => {
  const hasil = rapikanGambarButir({
    soal: 'Pilih grafik yang benar: {{GAMBAR_2}}',
    pembahasan: 'Jawaban B.',
    gambarUrls: [],
  }, DAFTAR_4_GAMBAR_2_GAGAL);
  assert.ok(!hasil.soal.includes('{{GAMBAR'), `token bocor ke teks siswa: ${hasil.soal}`);
  assert.equal(hasil.gambarGagalUnggah, 1);
});

uji('gambarRefs opsi ikut diselaraskan (referensi gagal dibuang)', () => {
  const hasil = rapikanGambarButir({
    soal: 'Pilih.',
    pembahasan: 'B benar.',
    opsiJawaban: [
      { teks: '', gambar: [], gambarRefs: [2] },   // gagal unggah -> dibuang
      { teks: '', gambar: [], gambarRefs: [3] },   // -> indeks baru 2
    ],
    gambarUrls: [],
  }, DAFTAR_4_GAMBAR_2_GAGAL);
  assert.deepEqual(hasil.opsiJawaban[0].gambarRefs, []);
  assert.deepEqual(hasil.opsiJawaban[1].gambarRefs, [2]);
});

uji('opsi bergambar benar-benar menunjuk URL yang tepat setelah diselaraskan', () => {
  // Uji ujung-ke-ujung: rapikanGambarButir -> dokumenDariButir.
  // dokumenDariButir menerjemahkan gambarRefs[n] sebagai gambarUrls[n-1].
  const dirapikan = rapikanGambarButir({
    nomor: 12, tipe: 'pg_sederhana', kunciJawaban: 'B',
    soal: 'Pilih grafik.', pembahasan: 'B benar.',
    opsiJawaban: [
      { teks: 'A', gambar: [], gambarRefs: [2] },
      { teks: 'B', gambar: [], gambarRefs: [3] },
    ],
    gambarUrls: [],
  }, DAFTAR_4_GAMBAR_2_GAGAL);
  const dok = dokumenDariButir(dirapikan, { fileName: 'utbk.html', mapel: 'Fisika' });
  // opsi A kehilangan gambarnya (gagal unggah) tapi TETAP ADA sebagai pilihan,
  // supaya huruf kunci B tidak bergeser jadi A.
  assert.equal(dok.opsiJawaban.length, 2);
  assert.deepEqual(dok.opsiJawaban[0].gambar, []);
  assert.equal(dok.opsiJawaban[1].gambar.length, 1);
  assert.equal(dok.opsiJawaban[1].gambar[0].url, 'https://x/g3.png');
});

uji('semua upload berhasil -> token tidak berubah sama sekali', () => {
  const hasil = rapikanGambarButir({
    soal: 'Lihat {{GAMBAR_1}} dan {{GAMBAR_2}}.',
    pembahasan: 'Detail di {{GAMBAR_2}}.',
    gambarUrls: [],
  }, [
    { urutan: 1, url: 'https://x/a.png', region: 'badan' },
    { urutan: 2, url: 'https://x/b.png', region: 'pembahasan' },
  ]);
  assert.equal(hasil.soal, 'Lihat {{GAMBAR_1}} dan {{GAMBAR_2}}.');
  assert.equal(hasil.pembahasan, 'Detail di {{GAMBAR_2}}.');
  assert.equal(hasil.gambarGagalUnggah, 0);
});

uji('token POLOS {{GAMBAR}} dibiarkan (maknanya "gambar berikutnya")', () => {
  const hasil = rapikanGambarButir({
    soal: 'Lihat {{GAMBAR}} di atas.',
    pembahasan: 'Ok.',
    gambarUrls: [],
  }, [{ urutan: 1, url: '', region: 'badan' }, { urutan: 2, url: 'https://x/b.png', region: 'badan' }]);
  assert.ok(hasil.soal.includes('{{GAMBAR}}'), 'token polos tidak boleh ditulis ulang');
  assert.deepEqual(hasil.gambarUrls, ['https://x/b.png']);
});

uji('gambarMeta sejajar indeks dengan gambarUrls dan membawa region', () => {
  const hasil = rapikanGambarButir({ soal: '', pembahasan: '', gambarUrls: [] }, DAFTAR_4_GAMBAR_2_GAGAL);
  assert.equal(hasil.gambarMeta.length, hasil.gambarUrls.length);
  assert.deepEqual(hasil.gambarMeta.map((m) => m.region), ['badan', 'pembahasan', 'pembahasan']);
  assert.equal(hasil.gambarMeta[1].caption, 'Diagram tahap');
});

// ============================================================
bagian('CACAT 1 & 7 — gambar pembahasan tidak boleh dibuang / nyasar');
// ============================================================

uji('penempatanGambar: gambar badan TIDAK menumpuk di akhir pembahasan', () => {
  const urls = ['https://x/badan.png', 'https://x/pembahasan.png'];
  const meta = [{ region: 'badan' }, { region: 'pembahasan' }];
  const segmen = pisahTeksDanGambar('Jawaban benar karena hukum kekekalan energi.', urls, { meta, region: 'pembahasan' });
  const gambar = segmen.filter((s) => s.jenis === 'gambar').map((s) => s.url);
  assert.deepEqual(gambar, ['https://x/pembahasan.png'],
    'pembahasan hanya boleh memuat gambar region pembahasan');
});

uji('penempatanGambar: gambar pembahasan TIDAK nyasar ke badan soal', () => {
  const urls = ['https://x/badan.png', 'https://x/pembahasan.png'];
  const meta = [{ region: 'badan' }, { region: 'pembahasan' }];
  const segmen = pisahTeksDanGambar('Perhatikan grafik berikut!', urls, { meta, region: 'badan' });
  const gambar = segmen.filter((s) => s.jenis === 'gambar').map((s) => s.url);
  assert.deepEqual(gambar, ['https://x/badan.png']);
});

uji('penempatanGambar: token di pembahasan menghormati ANGKANYA, bukan urutan', () => {
  const urls = ['https://x/1.png', 'https://x/2.png', 'https://x/3.png'];
  const meta = [{ region: 'badan' }, { region: 'badan' }, { region: 'pembahasan' }];
  const segmen = pisahTeksDanGambar('Lihat {{GAMBAR_3}} untuk buktinya.', urls, { meta, region: 'pembahasan' });
  const gambar = segmen.filter((s) => s.jenis === 'gambar').map((s) => s.url);
  assert.deepEqual(gambar, ['https://x/3.png']);
});

uji('naskah cetak: gambar pembahasan DIRENDER, bukan dibuang jadi string kosong', () => {
  // Inilah inti keluhan "gak support pembahasan bentuk gambar": cabang gambar
  // di kunciButirNaskahHtml dulunya me-return '' sehingga diagram lenyap.
  const html = kunciButirNaskahHtml({
    kunciJawaban: 'B',
    pembahasan: 'Energi kekal. {{GAMBAR_2}} Perhatikan arah vektornya.',
    gambarUrls: ['https://x/soal.png', 'https://x/diagram.png'],
    gambarMeta: [{ region: 'badan' }, { region: 'pembahasan' }],
  }, 12);
  assert.ok(html.includes('<img'), `gambar pembahasan hilang dari naskah cetak: ${html}`);
  assert.ok(html.includes('https://x/diagram.png'), 'url gambar pembahasan salah/tidak ada');
  assert.ok(!html.includes('https://x/soal.png'), 'gambar badan soal tidak boleh ikut ke pembahasan');
  assert.ok(!html.includes('{{GAMBAR'), `token mentah tercetak: ${html}`);
});

uji('naskah cetak: pembahasan tanpa gambar tetap seperti semula (kompatibel mundur)', () => {
  const html = kunciButirNaskahHtml({ kunciJawaban: 'A', pembahasan: 'Jawaban A benar.' }, 3);
  assert.ok(html.includes('Jawaban A benar.'));
  assert.ok(!html.includes('<img'));
});

// ============================================================
bagian('CACAT 5 — <sub>/<sup>/<td> tidak boleh diratakan tanpa jejak');
// ============================================================

uji('rumus kimia: H<sub>2</sub>O jadi H₂O, bukan H2O', () => {
  assert.equal(htmlKeTeks('Senyawa H<sub>2</sub>O dan CO<sub>2</sub>.'), 'Senyawa H₂O dan CO₂.');
});

uji('satuan fisika: m/s<sup>2</sup> jadi m/s²', () => {
  assert.equal(htmlKeTeks('Percepatan $g$ = 9,8 m/s<sup>2</sup>.'), 'Percepatan $g$ = 9,8 m/s².');
});

uji('ion: SO<sub>4</sub><sup>2-</sup> jadi SO₄²⁻ (bukan SO42-)', () => {
  assert.equal(htmlKeTeks('Ion SO<sub>4</sub><sup>2-</sup> dan Ca<sup>2+</sup>.'), 'Ion SO₄²⁻ dan Ca²⁺.');
});

uji('subskrip tanpa padanan Unicode TIDAK dibuang — ditulis _{...}', () => {
  // 'f' tidak punya subskrip Unicode (yang ada hanya a e h i j k l m n o p
  // r s t u v x). Perilaku lama: lenyap jadi "ΔH" tanpa penanda apa pun.
  // Sekarang jejaknya terlihat sehingga bisa diperbaiki, bukan hilang senyap.
  const t = htmlKeTeks('Entalpi pembentukan ΔH<sub>f</sub> bernilai negatif.');
  assert.ok(t.includes('_{f}'), `jejak subskrip hilang: ${t}`);
  assert.ok(t.includes('ΔH'), t);
});

uji('sel tabel diberi pemisah — <td>A</td><td>B</td> bukan "AB"', () => {
  const t = htmlKeTeks('<table><tr><td>Laju</td><td>0,5</td></tr><tr><td>Waktu</td><td>10</td></tr></table>');
  const baris = t.split('\n');
  assert.equal(baris.length, 2, `tabel harus jadi 2 baris, dapat: ${JSON.stringify(t)}`);
  assert.ok(baris[0].includes('|'), `sel baris 1 menempel: ${baris[0]}`);
  assert.ok(baris[0].includes('Laju') && baris[0].includes('0,5'));
  assert.ok(!/Laju0,5/.test(baris[0]), 'sel masih menempel tanpa pemisah');
});

uji('pemisah sel tidak menggantung di tepi baris', () => {
  const t = htmlKeTeks('<table><tr><td>A</td><td>B</td></tr></table>');
  assert.equal(t, 'A | B');
});

uji('rumus $...$ tetap utuh bersama sub/sup (regresi test lama)', () => {
  const t = htmlKeTeks('  Jika $x^2=4$ <br> maka <b>x</b> = 2  ');
  assert.ok(t.includes('$x^2=4$'));
  assert.ok(!t.includes('<b>'));
});

// ============================================================
bagian('CACAT 6 — cabang mati normTipe menolak soal sah');
// ============================================================

const KARTU_TANPA_OPSI = (tipeAttr) => `<div class="question-card" id="q1" ${tipeAttr} data-kunci="42">
  <div class="q-body">Berapakah jumlah proton pada unsur dengan nomor atom 20?</div>
  <div class="pembahasan">Nomor atom = jumlah proton, jadi 20... Kunci tercetak 42 di sumber.</div>
</div>`;

uji('kartu tanpa opsi & tanpa data-tipe TIDAK lagi ditolak sebagai pg_sederhana', () => {
  // Perilaku lama: normTipe menebak 'pg_sederhana' walau opsi 0, lalu
  // penegakan isi menolak kartu ini ("tipe pg_sederhana tapi opsi terbaca 0").
  // Soal isian singkat yang SAH gagal impor hanya karena tebakan tipe.
  const h = ekstrakHtmlGemini(KARTU_TANPA_OPSI(''));
  assert.equal(h.soal.length, 1, `kartu ditolak: ${h.kesalahan.join(' | ')}`);
  assert.equal(h.soal[0].tipe, 'isian_singkat');
  assert.equal(h.kesalahan.length, 0, h.kesalahan.join(' | '));
});

uji('kartu dengan opsi tetap pg_sederhana (tidak ada regresi)', () => {
  const h = ekstrakHtmlGemini(`<div class="question-card" id="q1" data-kunci="B">
    <div class="q-body">Unsur dengan nomor atom 20 adalah....</div>
    <div class="options-list"><ul>
      <li><span class="option-text">A) Na</span></li>
      <li><span class="option-text">B) Ca</span></li>
    </ul></div>
    <div class="pembahasan">Ca punya nomor atom 20.</div>
  </div>`);
  assert.equal(h.soal.length, 1, h.kesalahan.join(' | '));
  assert.equal(h.soal[0].tipe, 'pg_sederhana');
  assert.equal(h.soal[0].opsiJawaban.length, 2);
});

uji('data-tipe eksplisit tetap dihormati di atas tebakan', () => {
  const h = ekstrakHtmlGemini(KARTU_TANPA_OPSI('data-tipe="esai"'));
  assert.equal(h.soal.length, 1, h.kesalahan.join(' | '));
  assert.equal(h.soal[0].tipe, 'esai');
});

// ============================================================
bagian('CACAT 4 — sanitizer tidak boleh buta pada gambar jalur HTML Gemini');
// ============================================================
// dokumenDariButir() menulis `gambar: []` dan menyimpan URL di `gambarUrls`.
// Sanitizer lama membandingkan placeholder dengan `gambar[].id`, yang untuk
// jalur ini SELALU kosong -> setiap placeholder memicu warning palsu, dan
// placeholder di pembahasan/opsi tidak pernah diperiksa sama sekali.

uji('placeholder sah dengan gambarUrls TIDAK lagi memicu warning palsu', () => {
  const { warnings } = validateQuestion({
    tipe: 'pg_sederhana', teksSoal: 'Perhatikan {{GAMBAR_1}} berikut!', opsiJawaban: ['a', 'b'],
    kunciJawaban: 'A', topik: 't',
    gambar: [],                                   // ← persis bentuk dokumen hasil impor HTML Gemini
    gambarUrls: ['https://x/1.png'],
    gambarMeta: [{ region: 'badan' }],
  }, 0);
  assert.ok(!warnings.some((w) => w.includes('GAMBAR_1')),
    `warning palsu masih muncul: ${warnings.join(' | ')}`);
});

uji('placeholder di PEMBAHASAN kini ikut diperiksa', () => {
  const { warnings } = validateQuestion({
    tipe: 'pg_sederhana', teksSoal: 'Soal biasa.', opsiJawaban: ['a', 'b'],
    kunciJawaban: 'A', topik: 't', pembahasan: 'Lihat {{GAMBAR_5}} untuk bukti.',
    gambar: [], gambarUrls: ['https://x/1.png'],
  }, 0);
  assert.ok(warnings.some((w) => w.includes('GAMBAR_5') && w.includes('pembahasan')),
    `placeholder pembahasan tak terdeteksi: ${warnings.join(' | ')}`);
});

uji('gambarRefs opsi di luar rentang diberi warning', () => {
  const { warnings } = validateQuestion({
    tipe: 'pg_sederhana', teksSoal: 'Pilih grafik.', opsiJawaban: [{ teks: 'A', gambarRefs: [9] }],
    kunciJawaban: 'A', topik: 't',
    gambar: [], gambarUrls: ['https://x/1.png'],
  }, 0);
  assert.ok(warnings.some((w) => w.includes('gambarRefs')),
    `referensi opsi rusak tak terdeteksi: ${warnings.join(' | ')}`);
});

uji('perilaku lama (gambar ber-id) tetap utuh — kompatibel mundur', () => {
  const { warnings } = validateQuestion({
    tipe: 'pg_sederhana', teksSoal: 'perhatikan {{GAMBAR_2}}', opsiJawaban: ['a'],
    kunciJawaban: 'A', topik: 't', gambar: [{ id: 'GAMBAR_1', url: 'u' }],
  }, 0);
  assert.ok(warnings.some((w) => w.includes('GAMBAR_2')),
    'berkas lama ber-id harus tetap terdeteksi');
});

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
