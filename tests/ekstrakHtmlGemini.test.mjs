// tests/ekstrakHtmlGemini.test.mjs
// ============================================================
// Test ekstraktor HTML keluaran prompt paten
// (docs/PROMPT-PATEN-SCAN-GEMINI.md, src/utils/ekstrakHtmlGemini.js).
//
//     node tests/ekstrakHtmlGemini.test.mjs
//
// KENAPA INI PENTING
// Owner memilih Gemini sebagai pemindai karena formatnya bagus -- tapi
// berkas nyatanya (81 kartu) TIDAK memuat kunci & pembahasan sama sekali,
// sehingga tidak bisa masuk bank soal. Prompt paten mewajibkan keduanya;
// ekstraktor ini yang MENEGAKKAN paten itu: kartu yang melanggar ditolak
// dengan pesan bernomor kartu, bukan ditebak-tebak. Test ini mengunci
// perilaku penolakan itu, sebab ekstraktor yang terlalu pemaaf akan
// memasukkan soal tanpa kunci -- dan soal tanpa kunci adalah soal yang
// menghukum siswa secara acak (insiden yang sudah pernah terjadi, lihat
// DAFTAR-PERBAIKAN-KUNCI-BENAR-SALAH.md).
// ============================================================

import assert from 'node:assert/strict';
import { ekstrakHtmlGemini, ekstrakBanyakHtml, bersihkanHtmlBahaya, htmlKeTeks } from '../src/utils/ekstrakHtmlGemini.js';

const PNG_1PX = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const HTML_FIXTURE = `
<html><head><style>.question-card{border:1px solid #ccc}</style>
<script>alert('jahat')</script></head>
<body>
<div class="section-header" id="sec-respirasi"><h2>SISTEM RESPIRASI</h2><span class="section-badge">Soal 1 - 4</span></div>

<div class="question-card" id="soal-1" data-tipe="pg_sederhana" data-kunci="b">
  <div class="question-meta"><span class="q-number">No. 1</span><span class="q-source">TKA 2005/Reg I</span><span class="q-type-badge">Pilihan ganda</span></div>
  <div class="q-body">Pada saat kita mengambil nafas, rongga dada membesar, kecuali....</div>
  <div class="statements-box"><ol><li>Kontraksi otot antar rusuk</li><li>Diafragma berelaksasi</li></ol></div>
  <div class="options-list">
    <label class="option-item"><input type="radio" name="q1" value="A"><span class="option-text">A) 1, 2 Benar</span></label>
    <label class="option-item"><input type="radio" name="q1" value="B"><span class="option-text">B) 1 saja Benar</span></label>
  </div>
  <div class="pembahasan">Diafragma berelaksasi saat EKSPIRASI, jadi pernyataan 2 salah. Kunci B.</div>
</div>

<div class="question-card" id="soal-2" data-tipe="pg_sederhana" data-kunci="C">
  <div class="question-meta"><span class="q-number">No. 2</span><span class="q-source">TKA 2020/44</span><span class="q-type-badge">Pilihan ganda</span></div>
  <div class="q-body">Perhatikan diagram berikut! {{kosong}} Bagian yang ditunjuk adalah....</div>
  <div class="figure-container"><img src="${PNG_1PX}" alt=""><div class="figure-caption">Diagram paru</div></div>
  <div class="options-list">
    <label class="option-item"><input type="radio" name="q2" value="C"><span class="option-text">C) Bronkus</span></label>
    <label class="option-item"><input type="radio" name="q2" value="D"><span class="option-text">D) Alveolus</span></label>
  </div>
  <div class="pembahasan">Cabang utama trakea adalah bronkus.</div>
</div>

<div class="question-card" id="soal-3" data-tipe="pg_sederhana" data-kunci="A">
  <div class="question-meta"><span class="q-number">No. 3</span><span class="q-source">Durhaka</span><span class="q-type-badge">Pilihan ganda</span></div>
  <div class="q-body">Soal tanpa pembahasan, melanggar paten.</div>
  <div class="options-list">
    <label class="option-item"><input type="radio" name="q3" value="A"><span class="option-text">A) satu</span></label>
  </div>
</div>

<div class="question-card" id="soal-4" data-tipe="esai" data-kunci="">
  <div class="question-meta"><span class="q-number">No. 4</span><span class="q-source">SIMULASI 2026</span><span class="q-type-badge">Esai</span></div>
  <div class="q-body">Jelaskan mekanisme pertukaran gas di alveolus.</div>
  <div class="pembahasan">Rubrik: difusi mengikuti gradien tekanan parsial (skor 40); peran surfaktan (30); contoh gangguan (30).</div>
</div>
</body></html>`;

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

console.log('ekstrakHtmlGemini — penagih kontrak prompt paten');

const hasil = ekstrakHtmlGemini(HTML_FIXTURE);

// ============================================================
bagian('1. ISI TEREKSTRAK LENGKAP');
// ============================================================

uji('empat kartu terbaca, seksi terbaca', () => {
  assert.equal(hasil.soal.length, 4);
  assert.deepEqual(hasil.seksi, ['SISTEM RESPIRASI']);
});

uji('kunci dinormalkan (huruf besar, spasi dibuang)', () => {
  assert.equal(hasil.soal[0].kunciJawaban, 'B');
  assert.equal(hasil.soal[1].kunciJawaban, 'C');
});

uji('pembahasan ikut terbawa utuh', () => {
  assert.ok(hasil.soal[0].pembahasan.includes('EKSPIRASI'));
  assert.ok(hasil.soal[3].pembahasan.includes('Rubrik'));
});

uji('pernyataan bernomor menyatu ke badan soal sebagai daftar', () => {
  assert.ok(hasil.soal[0].soal.includes('1) Kontraksi otot antar rusuk'));
});

uji('opsi terbaca tanpa prefiks huruf ganda', () => {
  assert.deepEqual(hasil.soal[0].opsiJawaban, ['1, 2 Benar', '1 saja Benar']);
});

uji('sumber tersimpan untuk penelusuran balik ke buku', () => {
  assert.equal(hasil.soal[0].sumber, 'TKA 2005/Reg I');
});

// ============================================================
bagian('2. GAMBAR: BASE64 DIPISAH, POSISI JADI PLACEHOLDER');
// ============================================================

uji('gambar base64 TIDAK masuk dokumen soal (batas 1 MB Firestore)', () => {
  assert.equal(hasil.soal[1].gambarUrls.length, 0);
  assert.equal(hasil.gambar.length, 1);
  assert.ok(hasil.gambar[0].src.startsWith('data:image/png;base64,'));
  assert.equal(hasil.gambar[0].caption, 'Diagram paru');
});

uji('posisi gambar di teks diganti placeholder kontrak penempatanGambar', () => {
  assert.ok(!hasil.soal[1].soal.includes('base64'));
  // gambar berada SETELAH badan soal di sumber; placeholder menyusul
  assert.ok(hasil.soal[1].soal.includes('{{GAMBAR_1}}') || hasil.gambar[0].urutan === 1);
});

// ============================================================
bagian('3. PENEGAKAN PATEN: YANG DURHAKA DITOLAK BERPESAN');
// ============================================================

uji('kartu tanpa pembahasan ditolak dengan menyebut id-nya', () => {
  const pesan = hasil.kesalahan.join(' ');
  assert.ok(pesan.includes('soal-3'), pesan);
  assert.ok(pesan.includes('pembahasan'), pesan);
});

uji('kartu patuh TIDAK ikut dituduh', () => {
  const pesan = hasil.kesalahan.join(' ');
  assert.ok(!pesan.includes('soal-1'));
  assert.ok(!pesan.includes('soal-2'));
});

uji('esai boleh berkunci kosong (rubriknya di pembahasan)', () => {
  const pesan = hasil.kesalahan.join(' ');
  assert.ok(!pesan.includes('soal-4'), pesan);
  assert.equal(hasil.soal[3].kunciJawaban, '');
});

uji('tipe di luar enum DINORMALKAN oleh adaptor, bukan menolak berkas', () => {
  // Keputusan adaptor 2026-10-07: struktur boleh beragam, ISI yang ditagih.
  // Tipe bebas dipetakan heuristik (pg_sederhana bila ada opsi) supaya satu
  // kata aneh dari Gemini tidak membuang seluruh berkas; prompt paten tetap
  // mewajibkan enum, dan pelanggaran isi (kunci/pembahasan) tetap menolak.
  const h = ekstrakHtmlGemini(HTML_FIXTURE.replace('data-tipe="pg_sederhana" data-kunci="b"', 'data-tipe="tebak-tebakan" data-kunci="b"'));
  assert.equal(h.soal[0].tipe, 'pg_sederhana');
  // kartu soal-3 memang durhaka pada DUA isi paten sekaligus: tanpa
  // pembahasan DAN opsi kurang dari dua -- keduanya kesalahan ISI, bukan
  // kesalahan struktur, dan keduanya harus disebut.
  assert.equal(h.kesalahan.length, 2);
  assert.ok(h.kesalahan.join(' ').includes('soal-3'));
});

// ============================================================
bagian('4. KEAMANAN: HTML ADALAH MASUKAN TAK DIPERCAYA');
// ============================================================

uji('script/style/on* dibuang sebelum parsing', () => {
  const bersih = bersihkanHtmlBahaya('<div onclick="jahat()" style="x"><script>alert(1)</script>ok</div>');
  assert.ok(!bersih.includes('<script'));
  assert.ok(!bersih.includes('onclick'));
  assert.ok(bersih.includes('ok'));
});

uji('berkas bukan keluaran paten -> pesan jelas, bukan daftar kosong bisu', () => {
  const h = ekstrakHtmlGemini('<html><body><p>hanya paragraf</p></body></html>');
  assert.equal(h.soal.length, 0);
  assert.ok(h.kesalahan.join(' ').includes('question-card'));
});

uji('htmlKeTeks mempertahankan rumus $...$ dan merapikan baris', () => {
  const t = htmlKeTeks('  Jika $x^2=4$ <br> maka <b>x</b> = 2  ');
  assert.ok(t.includes('$x^2=4$'));
  assert.ok(!t.includes('<b>'));
});


// ============================================================
bagian('5. BANYAK BAB, BANYAK BERKAS, DAN KEJUJURAN PENALARAN');
// ============================================================

const kartu = (id, tipe, kunci, opts = {}) => `
<div class="question-card" id="${id}" data-tipe="${tipe}" data-kunci="${kunci}"${opts.asal ? ` data-asal-pembahasan="${opts.asal}"` : ''}>
  <div class="question-meta"><span class="q-number">No. ${id.replace('soal-', '')}</span><span class="q-source">SRC</span><span class="q-type-badge">x</span></div>
  <div class="q-body">${opts.badan || 'Teks soal contoh.'}</div>
  <div class="options-list"><label class="option-item"><input type="radio" value="A"><span class="option-text">A) satu</span></label><label class="option-item"><input type="radio" value="B"><span class="option-text">B) dua</span></label></div>
  <div class="pembahasan">${opts.pembahasan || 'Karena demikianlah adanya.'}</div>
</div>`;

const berkasA = `<body>
<div class="section-header" id="sec-1"><h2>SISTEM RESPIRASI</h2></div>
${kartu('soal-1', 'pg_sederhana', 'B')}
<div class="section-header" id="sec-2"><h2>SISTEM SIRKULASI</h2></div>
${kartu('soal-2', 'pg_sederhana', 'A')}
</body>`;

const berkasB = `<body>
<div class="section-header" id="sec-1"><h2>SISTEM RESPIRASI</h2></div>
${kartu('soal-1', 'pg_sederhana', 'B')}
${kartu('soal-3', 'pg_sederhana', 'C', { asal: 'penalaran', pembahasan: 'Sumber hanya mencetak kunci; penjelasan ini hasil penalaran model.' })}
</body>`;

uji('bab tiap kartu diambil dari section-header terdekat (ebook multi-bab)', () => {
  const h = ekstrakHtmlGemini(berkasA);
  assert.equal(h.soal[0].materi, 'SISTEM RESPIRASI');
  assert.equal(h.soal[1].materi, 'SISTEM SIRKULASI');
});

uji('banyak berkas digabung & duplikat antar-berkas dibuang', () => {
  const h = ekstrakBanyakHtml([{ nama: 'bag1.html', html: berkasA }, { nama: 'bag2.html', html: berkasB }]);
  const nomor = h.soal.map((s) => s.nomor).sort((a, b) => a - b);
  assert.deepEqual(nomor, [1, 2, 3], 'soal-1 duplikat harus dibuang, sisanya masuk');
  assert.equal(h.duplikat, 1);
  assert.ok(h.peringatan.join(' ').includes('duplikat'));
});

uji('pesan kesalahan membawa nama berkasnya (tahu mana yang diulang)', () => {
  const rusak = berkasA.replace('data-kunci="B"', 'data-kunci=""');
  const h = ekstrakBanyakHtml([{ nama: 'bag1.html', html: rusak }]);
  assert.ok(h.kesalahan.join(' ').includes('bag1.html'));
});

uji('taksonomi Kurikulum Merdeka per kartu terbawa ke butir', () => {
  const h = ekstrakHtmlGemini(`<body>
<div class="section-header" id="s"><h2>SISTEM RESPIRASI</h2></div>
<div class="question-card" id="soal-1" data-tipe="pg_sederhana" data-kunci="B" data-kurikulum="merdeka" data-fase="E" data-kelas="10" data-elemen="Pemahaman Sains" data-capaian="CP-001">
  <div class="q-body">Teks.</div>
  <div class="options-list"><label class="option-item"><input type="radio" value="A"><span class="option-text">A) satu</span></label><label class="option-item"><input type="radio" value="B"><span class="option-text">B) dua</span></label></div>
  <div class="pembahasan">Karena B.</div>
</div></body>`);
  const b = h.soal[0];
  assert.equal(b.kurikulum, 'merdeka');
  assert.equal(b.fase, 'E');
  assert.equal(b.kelas, '10');
  assert.equal(b.elemen, 'Pemahaman Sains');
  assert.equal(b.capaian, 'CP-001');
});

uji('pembahasan hasil penalaran DIPERINGATKAN, bukan ditolak maupun didiamkan', () => {
  const h = ekstrakBanyakHtml([{ nama: 'b.html', html: berkasB }]);
  const soalPenalaran = h.soal.find((s) => s.nomor === 3);
  assert.equal(soalPenalaran.pembahasanAsal, 'penalaran');
  assert.ok(h.peringatan.join(' ').includes('PENALARAN'));
  const soalTercetak = h.soal.find((s) => s.nomor === 1);
  assert.equal(soalTercetak.pembahasanAsal, 'tercetak');
});

// ============================================================
bagian('6. ASAL-USUL GAMBAR — CARI DULU, POTONG PRESISI, DILARANG MEMBUAT');
// ============================================================
// Aturan 10 prompt paten (2026-10-07, permintaan owner): gambar WAJIB
// asli — (1) URL gambar beredar yang persis sama & HD + data-gambar-asal,
// (2) bila tidak ada: petunjuk {{GAMBAR: ...}} agar tim memotong presisi
// dari berkas scan asli, (3) membuat gambar DILARANG. base64 tanpa
// pengakuan asal = terindikasi buatan model (peringatan keras, bukan
// penolakan — berkas lama bisa memuat potongan asli tanpa atribut).

const HTML_GAMBAR = `<body>
<div class="section-header" id="sec-g"><h2>SOAL GAMBAR ASLI</h2></div>

<div class="question-card" id="soal-url" data-tipe="pg_sederhana" data-kunci="A">
  <div class="q-body">Perhatikan diagram berikut!</div>
  <div class="figure-container" data-gambar-sumber="url-asli" data-gambar-asal="https://contoh.contoh/soal-44"><img src="https://cdn.contoh/diagram-paru.jpg" alt="Diagram paru"><div class="figure-caption">Diagram paru — Sumber: contoh.contoh</div></div>
  <div class="options-list"><label class="option-item"><input type="radio" value="A"><span class="option-text">A) satu</span></label><label class="option-item"><input type="radio" value="B"><span class="option-text">B) dua</span></label></div>
  <div class="pembahasan">Karena A.</div>
</div>

<div class="question-card" id="soal-potongan" data-tipe="pg_sederhana" data-kunci="B">
  <div class="q-body">Berdasarkan gambar penampang di atas, nomor yang menunjukkan xilem adalah....</div>
  <div class="figure-container" data-gambar-sumber="petunjuk-potongan"><div class="figure-caption">{{GAMBAR: halaman 12, posisi kiri bawah; patokan: di bawah teks "penampang batang"; isi: diagram penampang batang bernomor 1-4 dengan label epidermis/korteks/xilem/floem}}</div></div>
  <div class="options-list"><label class="option-item"><input type="radio" value="A"><span class="option-text">A) 1</span></label><label class="option-item"><input type="radio" value="B"><span class="option-text">B) 3</span></label></div>
  <div class="pembahasan">Xilem adalah nomor 3.</div>
</div>

<div class="question-card" id="soal-warisan" data-tipe="pg_sederhana" data-kunci="A">
  <div class="q-body">Gambar warisan potongan manusia.</div>
  <div class="figure-container" data-gambar-sumber="warisan"><img src="${PNG_1PX}" alt=""><div class="figure-caption">Potongan asli</div></div>
  <div class="options-list"><label class="option-item"><input type="radio" value="A"><span class="option-text">A) satu</span></label><label class="option-item"><input type="radio" value="B"><span class="option-text">B) dua</span></label></div>
  <div class="pembahasan">Karena A.</div>
</div>

<div class="question-card" id="soal-palsu" data-tipe="pg_sederhana" data-kunci="B">
  <div class="q-body">Gambar tanpa pengakuan asal.</div>
  <div class="figure-container"><img src="${PNG_1PX}" alt=""><div class="figure-caption">Entah dari mana</div></div>
  <div class="options-list"><label class="option-item"><input type="radio" value="A"><span class="option-text">A) satu</span></label><label class="option-item"><input type="radio" value="B"><span class="option-text">B) dua</span></label></div>
  <div class="pembahasan">Karena B.</div>
</div>
</body>`;

const hGambar = ekstrakHtmlGemini(HTML_GAMBAR);

uji('gambar URL asli: provenance + alamat sumber tercatat, tanpa tuduhan', () => {
  const g = hGambar.gambar.find((x) => x.kartu === 'soal-url');
  assert.ok(g, 'gambar url-asli harus terbaca');
  assert.equal(g.gambarSumber, 'url-asli');
  assert.equal(g.gambarAsal, 'https://contoh.contoh/soal-44');
  assert.equal(g.src, 'https://cdn.contoh/diagram-paru.jpg');
  assert.ok(!hGambar.peringatan.join(' ').includes('soal-url'));
});

uji('petunjuk potongan masuk antrean `potongan`, TIDAK bocor ke teks soal siswa', () => {
  assert.equal(hGambar.potongan.length, 1);
  const p = hGambar.potongan[0];
  assert.equal(p.kartu, 'soal-potongan');
  assert.ok(p.petunjuk.includes('halaman 12'), p.petunjuk);
  assert.ok(p.petunjuk.includes('xilem'), p.petunjuk);
  const butir = hGambar.soal.find((s) => s.idKartu === 'soal-potongan');
  assert.ok(!butir.soal.includes('{{GAMBAR:'), 'petunjuk potongan tidak boleh tercetak ke siswa');
  assert.ok(hGambar.peringatan.join(' ').includes('MENUNGGU POTONGAN PRESISI'));
});

uji('base64 warisan yang mengaku (data-gambar-sumber="warisan") sah, tak dituduh', () => {
  const g = hGambar.gambar.find((x) => x.kartu === 'soal-warisan');
  assert.equal(g.gambarSumber, 'warisan');
  const pesan = hGambar.peringatan.filter((w) => w.includes('soal-warisan')).join(' ');
  assert.ok(!pesan.includes('TERINDIKASI DIBUAT MODEL'), pesan);
});

uji('base64 TANPA pengakuan asal = TERINDIKASI DIBUAT MODEL (dilarang membuat)', () => {
  const g = hGambar.gambar.find((x) => x.kartu === 'soal-palsu');
  assert.equal(g.gambarSumber, 'base64-tanpa-asal');
  const pesan = hGambar.peringatan.filter((w) => w.includes('soal-palsu')).join(' ');
  assert.ok(pesan.includes('TERINDIKASI DIBUAT MODEL'), pesan);
});

uji('URL luar tanpa data-gambar-asal diingatkan untuk diverifikasi', () => {
  const h = ekstrakHtmlGemini(HTML_GAMBAR.replace(' data-gambar-asal="https://contoh.contoh/soal-44"', ''));
  const pesan = h.peringatan.filter((w) => w.includes('soal-url')).join(' ');
  assert.ok(pesan.includes('data-gambar-asal'), pesan);
});

uji('berkas era lama (figur tanpa atribut) tetap terbaca — ditandai, bukan ditolak', () => {
  assert.equal(hasil.gambar[0].caption, 'Diagram paru');
  assert.equal(hasil.gambar[0].gambarSumber, 'base64-tanpa-asal');
  assert.ok(hasil.peringatan.join(' ').includes('TERINDIKASI DIBUAT MODEL'));
  assert.equal(hasil.kesalahan.filter((k) => k.includes('soal-2')).length, 0);
});

uji('antrean potongan ikut digabung berlabel berkas di mode banyak-berkas', () => {
  const h = ekstrakBanyakHtml([{ nama: 'bag-g.html', html: HTML_GAMBAR }]);
  assert.equal(h.potongan.length, 1);
  assert.equal(h.potongan[0].berkas, 'bag-g.html');
  assert.ok(h.potongan[0].kartu.startsWith('bag-g.html::'));
});

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
