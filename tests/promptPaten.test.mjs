// tests/promptPaten.test.mjs
// Mengunci penanda WAJIB di dalam prompt paten (src/utils/promptPatenGemini.js).
// Prompt ini adalah kontrak dengan model di luar kendali kita; bila seseorang
// menyuntingnya dan satu penanda hilang, keluaran Gemini akan lolos dari
// penagihan ekstraktor secara halus. Jadi penandanya diuji.
//     node tests/promptPaten.test.mjs
import assert from 'node:assert/strict';
import { PROMPT_PATEN_GEMINI, PROMPT_KONVERSI_ULANG } from '../src/utils/promptPatenGemini.js';

let lulus = 0, gagal = 0;
const kegagalan = [];
function uji(nama, fn) {
  try { fn(); lulus += 1; console.log(`  ✓ ${nama}`); }
  catch (e) { gagal += 1; kegagalan.push({ nama, pesan: e.message }); console.log(`  ✗ ${nama}\n      ${e.message}`); }
}
console.log('promptPaten — penanda wajib tidak boleh menyusut');

const P = PROMPT_PATEN_GEMINI;
const K = PROMPT_KONVERSI_ULANG;
uji('struktur kartu & section dipatenkan', () => {
  assert.ok(P.includes('question-card'));
  assert.ok(P.includes('section-header'));
  assert.ok(P.includes('option-text'));
});
uji('enum tipe tertutup tertulis lengkap', () => {
  for (const t of ['pg_sederhana', 'pg_kompleks', 'benar_salah', 'menjodohkan', 'isian_singkat', 'esai']) {
    assert.ok(P.includes(t), `enum ${t} hilang`);
  }
});
uji('kunci & pembahasan diwajibkan', () => {
  assert.ok(P.includes('data-kunci'));
  assert.ok(P.includes('pembahasan'));
});
uji('kejujuran penalaran diwajibkan (buku berkunci-saja)', () => {
  assert.ok(P.includes('data-asal-pembahasan="penalaran"'));
  assert.ok(P.includes('data-asal-pembahasan="tercetak"'));
});
uji('multi-bab & math & larangan keamanan tertulis', () => {
  assert.ok(P.includes('data-bab'));
  assert.ok(P.includes('$...$'));
  assert.ok(P.includes('<script>') || P.includes('<script'));
  assert.ok(P.includes('position:fixed'));
});
uji('taksonomi Kurikulum Merdeka diwajibkan per kartu', () => {
  assert.ok(P.includes('data-fase'));
  assert.ok(P.includes('data-kurikulum'));
  assert.ok(P.includes('data-elemen'));
  assert.ok(P.includes('KURIKULUM MERDEKA'));
});

uji('kelas WAJIB per kartu untuk kompilasi lintas kelas (TKA 10-12)', () => {
  assert.ok(P.includes('data-kelas: WAJIB per kartu'));
  assert.ok(P.includes('JANGAN memisahkan berkas per kelas'));
});

uji('varian KONVERSI ULANG ada dan anti-karang', () => {
  assert.ok(PROMPT_KONVERSI_ULANG.includes('KONVERTOR FORMAT'));
  assert.ok(PROMPT_KONVERSI_ULANG.includes('Jangan mengarang kunci'));
  assert.ok(PROMPT_KONVERSI_ULANG.includes('data-asal-pembahasan'));
});

uji('TANGGA GAMBAR ASLI dipatenkan: cari dulu, potong presisi, DILARANG MEMBUAT', () => {
  // Permintaan owner 2026-10-07: gambar wajib ASLI yang beredar (persis
  // sama + HD), kalau tidak ada baru potongan presisi dari berkasnya,
  // dan model DILARANG membuat gambar. Penanda-penanda ini dikunci.
  assert.ok(P.includes('DILARANG MEMBUAT GAMBAR'));
  assert.ok(P.includes('MAKSIMALKAN anak tangga (1)'));
  assert.ok(P.includes('PERSIS SAMA'));
  assert.ok(P.includes('HD'));
  assert.ok(P.includes('data-gambar-sumber="url-asli"'));
  assert.ok(P.includes('data-gambar-asal'));
  assert.ok(P.includes('petunjuk-potongan'));
  assert.ok(P.includes('{{GAMBAR:'));
  assert.ok(P.includes('JANGAN mengarang URL'));
});

uji('perintah lama "tempel base64 bikinan" sudah DICABUT dari prompt paten', () => {
  // Prompt lama menyuruh <img src="data:image/...;base64,..." alt="">.
  // Model tidak bisa memproduksi byte gambar asli, jadi perintah itu =
  // menyuruh memalsukan gambar. Pastikan ia tidak kembali diam-diam.
  assert.ok(!P.includes('src="data:image/...;base64,..." alt=""'));
});

uji('pemeriksaan diri mencakup larangan gambar buatan (poin e)', () => {
  assert.ok(P.includes('(e) TIDAK ADA satu pun gambar bikinanmu'));
});

uji('konversi ulang: gambar warisan jujur, tetap dilarang membuat gambar', () => {
  assert.ok(PROMPT_KONVERSI_ULANG.includes('data-gambar-sumber="warisan"'));
  assert.ok(PROMPT_KONVERSI_ULANG.includes('DILARANG membuat gambar baru'));
  assert.ok(PROMPT_KONVERSI_ULANG.includes('petunjuk-potongan'));
});

uji('pemeriksaan diri diwajibkan di akhir prompt', () => {
  assert.ok(P.includes('Periksa dirimu'));
  assert.ok(P.includes('[gambar tidak terbaca]'));
});

// 🔥 2026-10-07 (kajian PDF Kinematika @my99dreams): pasar modul scan nyata
// memakai dua kolom, pilihan berupa grafik, diagram di dalam pembahasan,
// kotak rumus, dan kode asal soal (TKA 2020/39). Prompt paten wajib menyebut
// semuanya supaya keluaran Gemini langsung lolos ekstraktor sadar-region.
uji('region gambar dipatenkan: badan soal / dalam pilihan / dalam pembahasan', () => {
  assert.ok(P.includes('DI DALAM <li> pilihan bila milik suatu pilihan'));
  assert.ok(P.includes('figure-container pembahasan diletakkan DI POSISI ia disebut di dalam .pembahasan'));
  assert.ok(P.includes('BILA SUATU PILIHAN BERUPA GAMBAR/GRAFIK'));
});

uji('kotak rumus adalah TEKS LaTeX, bukan gambar untuk dipotong', () => {
  assert.ok(P.includes('Kotak rumus/persamaan bervektor/pecahan pada scan adalah TEKS BERKAS'));
});

uji('halaman dua kolom: baca kiri lalu kanan, urutan akhir mengikuti nomor', () => {
  assert.ok(P.includes('BILA HALAMAN BERDUA KOLOM'));
  assert.ok(P.includes('JANGAN membaca selang-seling'));
});

uji('kode asal soal (TKA 2020/39 dst.) wajib disalin ke q-source', () => {
  assert.ok(P.includes('TKA 2020/39'));
  assert.ok(P.includes('q-source'));
});

uji('jawaban benar lebih dari satu = pg_kompleks dengan kunci koma', () => {
  assert.ok(P.includes('jawaban benar lebih dari satu'));
  assert.ok(P.includes('SEMUA huruf/nilai benar dipisah koma'));
});

uji('pemeriksaan diri mencakup region gambar (poin f)', () => {
  assert.ok(P.includes('(f) setiap figure-container berada di region yang benar'));
});

uji('konversi ulang mempertahankan region gambar warisan', () => {
  assert.ok(K.includes('TERMASUK region-nya'));
});

console.log(`\n  LULUS : ${lulus}\n  GAGAL : ${gagal}`);
if (gagal > 0) { console.error('\n❌ ADA TEST YANG GAGAL.'); process.exit(1); }
console.log('\n✅ Semua test lulus.');
