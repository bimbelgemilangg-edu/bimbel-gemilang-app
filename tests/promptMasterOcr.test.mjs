// tests/promptMasterOcr.test.mjs — mengunci aturan OCR di prompt HTML Master
//     node tests/promptMasterOcr.test.mjs
//
// KENAPA PENTING: prompt adalah kontrak dengan model di luar kendali kita
// (Gemini). Setiap aturan di bawah lahir dari kerusakan NYATA pada berkas
// scan owner (bab 1 & bab 2 UTBK TPS-PU, 2026-10-10). Kalau seseorang
// meringkas/menghapus salah satunya, keluaran AI akan kembali rusak secara
// halus dan baru kelihatan setelah admin mengimpor ratusan soal.
import assert from 'node:assert/strict';
import { ATURAN_OCR_MASTER } from '../src/utils/promptMasterOcr.js';

let lulus = 0, gagal = 0;
function uji(n, f) {
  try { f(); lulus++; console.log(`  ✓ ${n}`); }
  catch (e) { gagal++; console.log(`  ✗ ${n}\n      ${String(e.message).slice(0, 220)}`); }
}
console.log('promptMasterOcr — aturan scan buku tidak boleh menyusut');

const P = ATURAN_OCR_MASTER;

uji('kata terpotong: dilarang menyambung diam-diam, wajib catatan_admin', () => {
  assert.ok(P.includes('KATA TERPOTONG POTONGAN KOLOM'));
  assert.ok(P.includes('JANGAN menyambung/melengkapi kata'));
  assert.ok(P.includes('catatan_admin'));
  assert.ok(P.includes('kunci_terverifikasi="false"'));
});

uji('teks salah kamar (bocor lintas kolom) wajib dikembalikan, bukan dibuang', () => {
  assert.ok(P.includes('TEKS SALAH KAMAR'));
  assert.ok(P.includes('data-field="bacaan"'));
  assert.ok(P.includes('Jangan pernah membuang teks hanya karena posisinya aneh'));
});

uji('opsi dilarang dobel di dalam teks soal', () => {
  assert.ok(P.includes('OPSI HANYA DI DALAM'));
  assert.ok(P.includes('dibersihkan dari salinan opsi'));
});

uji('kode sumber wajib jadi baris pertama soal & pembahasan', () => {
  assert.ok(P.includes('KODE SUMBER SOAL WAJIB JADI BARIS PERTAMA'));
  assert.ok(P.includes('SNMPTN 2010/TPA/942/17'));
  assert.ok(P.includes('mendeteksi pembahasan yang tertukar'));
});

uji('pembahasan wajib satu baris per langkah (bukan satu paragraf)', () => {
  assert.ok(P.includes('SATU BARIS PER LANGKAH'));
  assert.ok(P.includes('Semua A, B'));
  assert.ok(P.includes('Kesimpulan : ...'));
  assert.ok(P.includes('Premis 1 : p>q'));
});

uji('penutup "Jawaban: X" wajib & dilarang menulis penutup putus', () => {
  assert.ok(P.includes('PENUTUP "Jawaban: X" WAJIB ADA'));
  for (const rusak of ['Jawaba', 'Jawabat', 'Jawaban |', '= Jawaban f', 'c Jawaban #']) {
    assert.ok(P.includes(rusak), `contoh penutup rusak "${rusak}" hilang dari prompt`);
  }
});

uji('pembahasan hancur OCR: tulis ulang + tandai, jangan salin sampah', () => {
  assert.ok(P.includes('PEMBAHASAN SUMBER YANG HANCUR OCR'));
  assert.ok(P.includes('jangan mengganti kunci'));
  assert.ok(P.includes('Cek tentor terhadap buku asli'));
});

uji('tabel: rowspan/colspan apa adanya, jangan buang baris/kolom terakhir', () => {
  assert.ok(P.includes('rowspan'));
  assert.ok(P.includes('colspan'));
  assert.ok(P.includes('Jangan membuang baris/kolom terakhir'));
  assert.ok(P.includes('data-field="tabel_soal"'));
});

uji('gambar tidak terbaca: fallback halaman penuh, dilarang mengarang angka', () => {
  assert.ok(P.includes('JANGAN mengarang angka'));
  assert.ok(P.includes('screenshot SATU HALAMAN PENUH'));
});

uji('cek mandiri per nomor sebelum dokumen dikembalikan', () => {
  assert.ok(P.includes('CEK MANDIRI SEBELUM MENGEMBALIKAN DOKUMEN'));
  assert.ok(P.includes('"Jawaban: X"'));
  assert.ok(P.includes('data-grup sama'));
  assert.ok(P.includes('JANGAN diloloskan diam-diam'));
});

uji('nomor aturan tidak bentrok dengan prompt induk (mulai dari 21)', () => {
  // Prompt induk (buildMasterHTMLPrompt) memakai nomor 1..20; bila aturan ini
  // mulai dari nomor yang sama, AI bisa salah menautkan aturan.
  const nomor = [...P.matchAll(/^\s*(\d{1,2})\.\s/gm)].map((m) => Number(m[1]));
  assert.ok(nomor.length >= 9, `hanya ${nomor.length} butir bernomor`);
  assert.ok(Math.min(...nomor) >= 21, `nomor terkecil ${Math.min(...nomor)} bentrok dengan prompt induk`);
});

uji('prompt induk benar-benar menyisipkan aturan ini', async () => {
  // Dijalankan lewat pembacaan sumber (halaman impor adalah komponen React,
  // tidak bisa diimpor di node tanpa DOM) -- yang dikunci: impor + sisipan.
  const { readFileSync } = await import('node:fs');
  const src = readFileSync(new URL('../src/pages/admin/bank-soal/ImportHasilScanPage.jsx', import.meta.url), 'utf8');
  assert.ok(src.includes("import { ATURAN_OCR_MASTER } from '../../../utils/promptMasterOcr';"));
  assert.ok(src.includes('${ATURAN_OCR_MASTER}'), 'aturan tidak disisipkan ke template prompt');
});

uji('penanda scan DILARANG masuk keluaran (sampel owner 2026-10-11)', () => {
  // Berkas nyata owner memuat "=== PAGE 3 COL 1 ===", watermark
  // "BELAJAR MINIMAL,/HASIL MAKSIMAL", dan baris nomor kolom sebelah
  // ("24, 25 26.") yang semuanya lolos jadi isi soal. Prompt versi lama
  // tidak pernah menyebutnya, jadi model tidak tahu itu bukan isi buku.
  assert.ok(P.includes('PENANDA SCAN DILARANG MASUK KELUARAN'));
  assert.ok(P.includes('=== PAGE 3 COL 1 ==='));
  assert.ok(P.includes('HASIL MAKSIMAL'));
  assert.ok(P.includes('24, 25 26.'));
  assert.ok(P.includes('————EEE'));
});

uji('disiplin urutan kolom disebut sebagai akar bocor lintas kolom', () => {
  assert.ok(P.includes('DISIPLIN URUTAN KOLOM'));
  assert.ok(P.includes('KOLOM PER KOLOM'));
  assert.ok(P.includes('PUNCAK'));
  assert.ok(P.includes('fragmen kolom belum pasti pemiliknya'));
});

uji('wacana dilarang menginap di opsi/teks_soal + wajib jadi elemen bacaan', () => {
  assert.ok(P.includes('WACANA TIDAK BOLEH MENGINAP DI OPSI ATAU TEKS_SOAL'));
  assert.ok(P.includes('data-rentang-soal'));
  assert.ok(P.includes('WACANA BERSAMA milik nomor-nomor sesudahnya'));
});

uji('cek mandiri kini memuat penanda scan, kebocoran opsi, dan bacaan kosong', () => {
  assert.ok(P.includes('TIDAK ADA penanda scan di field mana pun'));
  assert.ok(P.includes('TIDAK ADA <li> opsi yang memuat lebih dari teks opsinya sendiri'));
  assert.ok(P.includes('yang TIDAK kosong'));
});

uji('pembahasan wajib bersidik jari sama dengan soalnya (aturan 34)', () => {
  // Kasus nyata sampel owner: tiga nomor berurutan mendapat pembahasan
  // yang berputar (63<-69, 65<-63, 69<-65). Prompt lama tidak menyebut
  // sidik jari kode sumber sebagai alat verifikasi sama sekali.
  assert.ok(P.includes('PEMBAHASAN WAJIB BERSIDIK JARI SAMA DENGAN SOALNYA'));
  assert.ok(P.includes('PEMBAHASAN TERTUKAR'));
  assert.ok(P.includes('GEL.2/63'));
  assert.ok(P.includes('kode sumber di baris pertama pembahasan SAMA PERSIS'));
});

console.log(`\n  LULUS: ${lulus}  GAGAL: ${gagal}`);
if (gagal > 0) process.exit(1);
console.log('✅ Semua test lulus.');
