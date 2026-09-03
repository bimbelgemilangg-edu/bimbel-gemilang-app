// src/pages/admin/bank-soal/ImportHasilScanPage.jsx
// ============================================================
// IMPORT HASIL SCAN AI -> BANK SOAL GEMILANG (v2)
//
// PERUBAHAN UTAMA DARI v1:
// - Opsi jawaban sekarang bisa berupa OBJEK kaya:
//     { teks, gambar: [...], tabel: [{kolom, isi}, ...] }
//   (bukan cuma string). String tetap didukung penuh (backward compatible).
// - Mendukung soal & PILIHAN yang jawabannya berupa GAMBAR/GRAFIK
//   (mis. opsi berupa 5 grafik) maupun TABEL per-opsi (mis. tabel
//   perbandingan 2 kolom seperti soal model atom).
// - Upload 1 file JSON GABUNGAN berisi banyak paket/tryout sekaligus.
//   Sistem otomatis MEM-FLATTEN & MENGELOMPOKKAN per paket (field
//   `paket` di tiap soal + tampilan preview dikelompokkan per paket).
//   Format yang didukung untuk pengelompokan (semua opsional, pilih salah satu):
//     { "tryout": [ { "paket": 1, "soal": [...] }, { "paket": 2, "soal": [...] } ] }
//     { "paket_list": [ { "nomor_paket": 1, "questions": [...] } ] }
//     { "packages": [ { "id": 1, "items": [...] } ] }
//   Atau tetap array datar biasa: [ {...}, {...} ] (tanpa pengelompokan).
// - Gambar per-opsi ikut diupload ke Supabase saat simpan (bukan cuma
//   gambar soal utama).
// - Field meta_materi / meta_capaian_pembelajaran (opsional, dari hasil
//   scan AI) ikut disimpan sebagai `materi` & `capaianPembelajaran`.
// ============================================================

import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
} from 'react';

import SidebarAdmin from '../../../components/SidebarAdmin';

import {
  collection,
  doc,
  writeBatch,
  serverTimestamp,
  addDoc,
  getDocs,
  query,
  orderBy,
  where,
  updateDoc,
  increment,
  deleteDoc,
} from 'firebase/firestore';

import { db, auth } from '../../../firebase';

// ============================================================
// CONSTANT
// ============================================================

const BANK_SOAL_COLLECTION = 'bank_soal';

const DAFTAR_MAPEL = [
  'Matematika', 'Fisika', 'Kimia', 'Biologi', 'Bahasa Indonesia',
  'Bahasa Inggris', 'Ekonomi', 'Geografi', 'Sosiologi', 'Sejarah',
  'PKN', 'TPS/Penalaran Umum', 'Lainnya',
];

const DAFTAR_JENJANG = ['SD/MI', 'SMP/MTs', 'SMA/MA', 'SMK', 'UTBK/SNBT'];

const DAFTAR_KELAS = ['1','2','3','4','5','6','7','8','9','10','11','12','Semua'];

const DAFTAR_KESULITAN = ['mudah', 'sedang', 'sulit'];

const TIPE_LABELS = {
  pg_sederhana: 'PG Sederhana',
  pg_kompleks: 'PG Kompleks (jawaban lebih dari satu)',
  pg_kategori: 'PG Kompleks Kategori',
  benar_salah: 'Benar / Salah (pernyataan majemuk)',
  isian_singkat: 'Isian Singkat',
  numerik: 'Jawaban Numerik + Satuan',
  menjodohkan: 'Menjodohkan',
  uraian: 'Uraian / Esai',
};

// Kunci-kunci yang dikenali sebagai "grup paket" di level JSON teratas.
const GROUP_KEYS = ['tryout', 'paket_list', 'packages', 'paketSoal', 'paket_soal'];

// Kunci-kunci di dalam satu grup yang dianggap sebagai daftar soalnya.
const GROUP_ITEM_KEYS = ['soal', 'soals', 'questions', 'items', 'data'];

// ============================================================
// PROMPT AI GENERATOR — SUMBER KEBENARAN TUNGGAL
// ------------------------------------------------------------
// Prompt di bawah ini SENGAJA dibangun langsung dari skema yang
// benar-benar dipakai oleh normalizeSoal / normalizeOptionRich /
// normalizeImage / normalizeTabel / normalizeAnswerKey di atas.
// Tujuannya: AI manapun (Claude, ChatGPT, Gemini, dll) yang diberi
// prompt ini akan menghasilkan JSON yang mengikuti STRUKTUR SISTEM,
// bukan mengikuti bentuk asli PDF/soal sumber. Kalau skema di
// normalizeSoal() dkk berubah di kemudian hari, prompt ini WAJIB
// diperbarui juga supaya tetap sinkron (satu sumber kebenaran).
// ============================================================

function buildMasterPrompt(meta = {}) {
  const {
    mataPelajaran = 'Matematika',
    jenjang = 'SMA/MA',
    tingkatKelas = '10',
    tingkatKesulitan = 'sedang',
    catatanTambahan = '',
  } = meta;

  return `Kamu adalah asisten yang mengubah dokumen soal ujian (PDF/gambar hasil scan) menjadi JSON terstruktur untuk sistem "Bank Soal Gemilang". Ikuti skema di bawah ini SECARA PERSIS — skema ini diambil langsung dari kode sistem (ImportHasilScanPage.jsx), bukan dari bentuk asli dokumen sumber. Tujuannya JSON yang kamu hasilkan bisa langsung di-upload dan sejalan dengan sistem, tanpa perlu diedit manual.

KONTEKS SOAL INI:
- Mata pelajaran: ${mataPelajaran}
- Jenjang: ${jenjang}
- Kelas: ${tingkatKelas}
- Tingkat kesulitan default (kalau tidak bisa dinilai per soal): ${tingkatKesulitan}
${catatanTambahan ? `- Catatan tambahan dari admin: ${catatanTambahan}` : ''}

Baca SELURUH isi dokumen yang dilampirkan (semua paket/tryout, semua nomor, semua halaman pembahasan jika ada), lalu hasilkan SATU file JSON sesuai aturan berikut.

## 1. PRINSIP UTAMA: SETIAP SOAL BERDIRI SENDIRI (MANDIRI)

Sistem TIDAK memakai folder atau referensi silang antar soal — tiap soal disimpan sebagai satu dokumen mandiri, karena bisa ditarik satu-satu atau dicampur acak dengan soal dari paket/mapel lain.

- Kalau ada BACAAN/TEKS PANJANG/DATA yang dipakai bersama beberapa nomor (mis. 1 bacaan untuk soal 5-8), JANGAN buat objek terpisah yang direferensikan. SALIN UTUH ke field \`bacaan\` di SETIAP soal yang memakainya.
- Kalau ada GAMBAR yang menyertai sebuah soal, gambar itu MELEKAT langsung pada soal tersebut (field \`gambar\`), bukan disimpan terpisah lalu ditautkan.
- Kalau kamu bisa membaca/mengekstrak gambar dari dokumen, embed sebagai base64 data URL di field \`dataUrl\` (format: "data:image/png;base64,...."). Ini paling ideal karena soal jadi mandiri tanpa file terpisah.
- Kalau TIDAK bisa mengekstrak gambar aslinya, JANGAN mengarang URL. Kosongkan \`dataUrl\`/\`url\`, isi \`deskripsi\` dengan penjelasan detail gambar (apa yang digambarkan, angka-angka penting di dalamnya).

## 2. FORMAT JSON KESELURUHAN (WAJIB — ini yang dibaca sistem)

Sistem mendukung BEBERAPA bentuk pembungkus paket (pilih salah satu, paling disarankan yang pertama):

\`\`\`json
{
"tryout": [
  {
    "paket": 1,
    "nama_paket": "Tryout 1",
    "soal": [ /* array soal, lihat format nomor 3 di bawah */ ]
  },
  {
    "paket": 2,
    "soal": [ /* ... */ ]
  }
]
}
\`\`\`

Kunci pembungkus yang juga dikenali sistem: "tryout", "paket_list" (isi soal di "questions"), "packages" (isi soal di "items"), "paketSoal", "paket_soal". Kalau dokumen cuma 1 paket / tidak berpaket, boleh langsung array datar: [ {...soal1}, {...soal2} ].

## 3. FORMAT SATU OBJEK SOAL (ikuti nama field ini PERSIS)

\`\`\`json
{
"nomor": 1,
"tipe": "pg_sederhana",
"materi": "Persamaan Kuadrat",
"capaian_pembelajaran": "Menyelesaikan masalah terkait akar-akar persamaan kuadrat.",
"bacaan": null,
"teks_soal": "Akar-akar persamaan kuadrat $x^2 + ax - 4 = 0$ adalah p dan q. Jika $p^2 - 2pq + q^2 = 8a$ maka nilai a = ....",
"gambar": [],
"opsi_jawaban": [
  "-8",
  "-4",
  "4",
  "6",
  "8"
],
"kunci_jawaban": "E",
"kunci_terverifikasi": true,
"pembahasan": "Langkah-langkah penyelesaian lengkap, bukan cuma jawaban akhir."
}
\`\`\`

### Field WAJIB di setiap soal
- \`nomor\` — angka urut soal dalam paketnya.
- \`tipe\` — salah satu dari: "pg_sederhana", "pg_kompleks", "benar_salah", "isian_singkat", "menjodohkan", "uraian" (lihat tabel di bagian 4). JANGAN paksakan semua jadi pg_sederhana kalau bentuk aslinya beda — sistem memproses tiap tipe secara berbeda.
- \`teks_soal\` — teks pertanyaan (boleh mengandung LaTeX, lihat bagian 6).
- \`kunci_jawaban\` — lihat aturan di bagian 5.
- \`pembahasan\` — WAJIB diisi, langkah-langkah penyelesaian.

### Field opsional tapi SANGAT dianjurkan
- \`materi\` — topik/bab spesifik soal ini, dipakai sistem untuk filter/rekap.
- \`capaian_pembelajaran\` — 1 kalimat capaian pembelajaran relevan (kurikulum terbaru). Kalau tidak yakin, buat 1 kalimat wajar berdasarkan materinya, jangan dikosongkan.
- \`kunci_terverifikasi\` — true kalau kamu sudah menghitung ulang dan yakin kuncinya benar; false kalau kunci diambil mentah tanpa verifikasi ulang.
- \`catatan_admin\` — PENTING: kalau kamu ragu terhadap kunci jawaban, menemukan kejanggalan pada opsi jawaban di dokumen sumber, atau ada hal lain yang perlu diperiksa manual oleh admin/guru, tulis di field INI (bukan di \`pembahasan\`). \`pembahasan\` HANYA boleh berisi penjelasan matematis bersih yang akan dibaca SISWA — jangan pernah menaruh kalimat seperti "catatan", "kemungkinan salah cetak", atau keraguan apa pun di dalam \`pembahasan\`. Kalau tidak ada catatan khusus, kosongkan "" atau jangan sertakan field ini.
- \`bacaan\`, \`gambar\` — lihat bagian 1, 7, 8.

## 4. TIPE SOAL YANG DIDUKUNG SISTEM (field \`tipe\`)

| tipe | kapan dipakai |
|---|---|
| pg_sederhana | Pilihan ganda biasa, 1 jawaban benar (A-E/A-D). |
| pg_kompleks | Pilihan ganda, jawaban benar lebih dari satu. |
| benar_salah | Beberapa PERNYATAAN, dinilai Benar/Salah masing-masing. Pakai field \`pernyataan\`. |
| isian_singkat | Jawaban angka/kata singkat tanpa pilihan. \`opsi_jawaban\` dikosongkan []. |
| menjodohkan | Mencocokkan 2 kolom. Pakai field \`pasangan\`. |
| uraian | Esai/uraian. \`opsi_jawaban\` dikosongkan, \`kunci_jawaban\` diisi kriteria jawaban model. |
| pg_kategori | Model kategori TKA: tiap pernyataan dinilai pada kategori tertentu (mis. Benar/Salah atau Sesuai/Tidak Sesuai). Pakai \`tabel_benar_salah\`. |
| numerik | Jawaban bilangan yang dapat memiliki satuan, toleransi, dan bentuk ekuivalen. |

Untuk soal numerik, gunakan format berikut agar pemeriksaan jawaban tidak bergantung pada satu penulisan saja:
\`\`\`json
"tipe": "numerik",
"kunci_jawaban": "9.8",
"jawaban_ekuivalen": ["9,8", "9.80"],
"satuan_jawaban": "m/s^2",
"toleransi_jawaban": 0.01
\`\`\`

Untuk "benar_salah" tambahkan:
\`\`\`json
"pernyataan": [
{ "teks": "Diskriminan negatif berarti tidak ada akar real.", "jawaban": "Benar" },
{ "teks": "Grafik fungsi kuadrat selalu terbuka ke atas.", "jawaban": "Salah" }
]
\`\`\`

Untuk "menjodohkan" tambahkan:
\`\`\`json
"pasangan": [
{ "kiri": "Median data", "kanan": "Nilai tengah data terurut" }
]
\`\`\`

## 5. FORMAT OPSI JAWABAN (sistem menerima 2 bentuk, boleh dicampur dalam satu array)

Bentuk sederhana — string biasa:
\`\`\`json
"opsi_jawaban": ["4", "5", "6", "7", "8"]
\`\`\`

Bentuk kaya (kalau opsi punya gambar/grafik atau tabel, bukan cuma teks):
\`\`\`json
"opsi_jawaban": [
{ "teks": "" , "gambar": [{ "dataUrl": "data:image/png;base64,....", "deskripsi": "Grafik A: sinusoidal naik" }] },
{ "teks": "Opsi tabel", "tabel": { "Rutherford": "Semua muatan positif dalam inti", "Bohr": "Elektron di orbit tetap" } }
]
\`\`\`
(\`tabel\` boleh berupa object key-value seperti contoh di atas, atau array [{ "kolom": "...", "isi": "..." }] — dua-duanya dikenali sistem.)

## 6. ATURAN KUNCI JAWABAN

- pg_sederhana: \`kunci_jawaban\` = 1 huruf, contoh "C". Sistem otomatis menandai opsi sesuai urutan huruf (A=opsi ke-1, dst) — TIDAK PERLU menandai manual di teks opsi.
- pg_kompleks: \`kunci_jawaban\` boleh array huruf, contoh ["A", "C", "D"].
- isian_singkat / uraian: \`kunci_jawaban\` = teks jawaban/kriteria, bukan huruf.
- Kalau dokumen sumber menyertakan kunci/pembahasan resmi, SELALU pakai kunci dari situ, jangan hitung ulang dari nol kecuali kunci sumber tampak salah/hilang (dalam kasus itu hitung ulang sendiri, isi kunci_terverifikasi: false, jelaskan keraguannya di pembahasan).
- Kalau kunci benar-benar tidak ditemukan, isi \`kunci_jawaban\`: "" — JANGAN menebak asal-asalan.

## 7. NOTASI MATEMATIKA

Tulis semua rumus dalam LaTeX. Ada 2 mode, PILIH SESUAI BENTUK RUMUSNYA — ini penting untuk tampilan visual, bukan cuma soal benar/salah:
- Inline \`$...$\` — HANYA untuk simbol/ekspresi PENDEK yang menyatu wajar di tengah kalimat (mis. $x^2+3x-4$, $f(x)$, $\\sin 30^\\circ$).
- Display \`$$...$$\` — WAJIB dipakai untuk rumus LEBAR atau multi-baris: matriks (\\begin{pmatrix}, \\begin{bmatrix}), vektor kolom, pecahan besar bersusun, sistem persamaan, integral dengan batas, limit kompleks. JANGAN taruh matriks/vektor kolom di dalam inline \`$...$\` karena akan tampil terhimpit/rusak di tengah teks kalimat — pisahkan jadi baris sendiri pakai \`$$...$$\`.

Sistem merender LaTeX ini otomatis (KaTeX) — jangan biarkan karakter rusak hasil OCR, tulis ulang jadi LaTeX bersih.

Untuk FISIKA/KIMIA, tulis besaran dan satuan secara profesional: gunakan \`$v=5\\,\\mathrm{m\\,s^{-1}}$\`, \`$F=20\\,\\mathrm{N}$\`, \`$I=2\\,\\mathrm{A}$\`, dan \`$\\mu_0=4\\pi\\times10^{-7}\\,\\mathrm{T\,m\,A^{-1}}$\`. Jangan memakai karakter OCR seperti \`m.s-1\`, \`oC\`, atau \`x 105\`; normalisasikan menjadi LaTeX yang benar.

## 7A. JENIS STIMULUS, GRAFIK, TABEL, DAN DIAGRAM

- Pertahankan jenis soal asli: PG tunggal, PG multi-jawaban, kategori, benar/salah, numerik bersatuan, menjodohkan, uraian, dan soal dengan stimulus bersama.
- Untuk grafik, rangkaian listrik, vektor, alat ukur, diagram gaya, diagram sinar, tabel eksperimen, serta opsi yang berupa gambar, gunakan \`gambar\` atau \`opsi_jawaban[].gambar\` dan tulis \`deskripsi\` yang menyebutkan semua label, arah, skala, satuan, dan angka penting.
- Tambahkan \`referensi_sumber\` bila diketahui, misalnya \`{ "halaman_pdf": 4, "label_gambar": "grafik v-t" }\`. Ini membantu admin menemukan ulang gambar yang perlu dicek.
- Untuk tabel di dalam soal, gunakan \`tabel_soal\`: \`{ "header": ["Gaya (N)", "Pertambahan panjang (m)"], "baris": [["7", "$3.5\\times10^{-2}$"]] }\`. Jangan mengubah tabel eksperimen menjadi kalimat yang kehilangan pasangan kolomnya.
- Untuk soal yang jawabannya bergantung pada diagram yang tidak terbaca, jangan mengarang angka atau kunci. Isi \`kunci_terverifikasi: false\` dan \`catatan_admin\` dengan halaman yang harus diperiksa.

## 8. BACAAN/STIMULUS BERSAMA (soal berkelompok)

Kalau ada pola "Bacalah teks berikut untuk soal nomor 5-8", buat field \`bacaan\` di SETIAP soal 5,6,7,8, isinya salinan persis sama:
\`\`\`json
"bacaan": { "teks": "isi lengkap teks/data bacaan....", "gambar": [] }
\`\`\`
Kalau soal tidak punya bacaan bersama, isi "bacaan": null.

## 9. FORMAT GAMBAR

\`\`\`json
"gambar": [
{
  "url": "",
  "dataUrl": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "deskripsi": "Gambar mikrometer sekrup menunjukkan skala utama 2mm dan skala nonius 47"
}
]
\`\`\`
Kalau tidak bisa embed gambar asli, kosongkan url/dataUrl dan isi deskripsi detail — admin akan crop & upload manual lewat fitur crop yang ada di sistem (sistem punya UI crop bawaan untuk kasus ini). Placeholder {{GAMBAR}}, {{GAMBAR_2}} dst boleh disisipkan di teks_soal untuk posisi gambar tertentu; kalau tidak ada placeholder, sistem otomatis taruh semua gambar di akhir teks soal.

## 10. TABEL DATA DI DALAM BADAN SOAL (bukan sebagai pilihan jawaban)

Tulis ulang isinya sebagai teks terstruktur langsung di teks_soal, contoh:
"Perhatikan tabel berikut!\\n\\nInterval | Frekuensi\\n61-65 | 4\\n66-70 | 6\\n\\nKuartil bawah dari data tersebut adalah ...."

## 11. HAL YANG HARUS DIHINDARI

- JANGAN membuat bacaan_id/gambar_id yang dirujuk terpisah — selalu salin utuh ke tiap soal.
- JANGAN mengarang URL gambar yang tidak benar-benar ada.
- JANGAN mengosongkan pembahasan.
- JANGAN mengubah tipe soal jadi pg_sederhana kalau aslinya bukan pilihan ganda biasa.
- JANGAN memotong/meringkas opsi jawaban — salin persis seperti di dokumen.
- JANGAN menyisakan jejak proses berpikir di pembahasan (mis. "tunggu, coba periksa lagi") — pembahasan harus final dan bersih.

## 12. KEJUJURAN UNTUK SOAL YANG BUTUH GAMBAR

Kalau soal TIDAK BISA dijawab tanpa melihat isi gambar asli (grafik dengan angka spesifik, rangkaian, diagram vektor, dsb) dan kamu tidak benar-benar bisa melihat gambar itu:
- JANGAN menebak jawaban seolah yakin — sistem akan menandainya sebagai "jawaban benar" dan tampil ke siswa sebagai fakta.
- Set "kunci_jawaban": "" dan "kunci_terverifikasi": false.
- Isi pembahasan dengan kalimat jujur bahwa jawaban perlu diisi manual oleh guru/admin setelah gambar diperiksa.
- Pengecualian: kalau semua angka yang dibutuhkan sudah ada di teks soal (gambar cuma ilustrasi pelengkap), boleh dihitung dan dijawab yakin seperti biasa.

## 13. JANGAN BERHENTI DI TENGAH JALAN

Proses SEMUA nomor dari SEMUA paket yang ada di dokumen, dari nomor pertama sampai terakhir. Jangan meringkas "beberapa contoh saja". Sebelum mengirim jawaban akhir, hitung ulang: apakah jumlah objek di array "soal" tiap paket SAMA PERSIS dengan jumlah soal di dokumen untuk paket itu? Kalau dokumen sangat panjang sehingga tidak sanggup sekaligus, BOLEH diproses per paket satu-satu (selesaikan 1 paket penuh dulu, baru berhenti dan bilang eksplisit paket berapa yang selesai + tawarkan lanjut ke paket berikutnya) — TAPI TIDAK BOLEH berhenti di TENGAH satu paket tanpa keterangan.

## 14. OUTPUT

Keluarkan HANYA satu blok kode JSON valid (tanpa teks pembuka/penutup di luar blok kode), mencakup SEMUA nomor soal dari SEMUA paket yang ada di dokumen yang dilampirkan. Field \`mata_pelajaran\`, \`jenjang\`, \`kelas\`, dan \`tingkat_kesulitan\` TIDAK perlu ditulis di tiap soal (sudah diisi manual di form sistem saat import) — cukup fokus ke field-field pada bagian 3.`;
}

// ============================================================
// MASTER HTML PROMPT — format output untuk soal kompleks
// ============================================================

function buildMasterHTMLPrompt(meta = {}) {
  const {
    mataPelajaran = 'Matematika',
    jenjang = 'SMA/MA',
    tingkatKelas = '10',
    tingkatKesulitan = 'sedang',
    catatanTambahan = '',
  } = meta;

  // Contoh di bagian akhir prompt HARUS ikut nilai form yang sebenarnya --
  // kalau kelas form "Semua" (mis. scan UTBK/TKA lintas kelas), atribut
  // data-kelas di contoh DIHILANGKAN, supaya AI tidak meniru pola "isi
  // asal angka" untuk kasus yang aslinya harus dikosongkan.
  const contohKelasAttr = (tingkatKelas && tingkatKelas !== 'Semua')
    ? ` data-kelas="${tingkatKelas}"`
    : '';
  const contohKesulitan = ['mudah', 'sedang', 'sulit'].includes(tingkatKesulitan)
    ? tingkatKesulitan
    : 'sedang';

  return `Kamu adalah asisten ekstraksi dokumen untuk Bank Soal Gemilang. Baca SELURUH PDF/gambar sumber, termasuk semua nomor, gambar, grafik, tabel, rumus, dan pembahasan. Jangan mengarang informasi yang tidak terbaca.

KONTEKS:
- Mata pelajaran: ${mataPelajaran}
- Jenjang: ${jenjang}
- Kelas: ${tingkatKelas}
- Kesulitan default: ${tingkatKesulitan}
${catatanTambahan ? `- Catatan admin: ${catatanTambahan}` : ''}

TUJUAN: keluarkan SATU dokumen HTML Master yang dapat langsung di-upload ke Bank Soal Gemilang. Jangan keluarkan JSON, Markdown, atau penjelasan di luar HTML.

ATURAN WAJIB:
1. Setiap soal wajib berada di <article data-gemilang-question data-nomor="1" data-tipe="pg_sederhana" data-paket="1">.
2. Pertanyaan utama berada di <div data-field="teks_soal">...</div>.
3. Gambar/grafik/diagram berada di <div data-field="gambar"><img src="data:image/png;base64,..." alt="..." /></div>. Kalau kamu bisa mengisolasi persis gambar/grafik/diagram soal itu saja, embed itu. KALAU TIDAK BISA mengisolasi dengan presisi (mis. grafik menyatu dengan teks di layout PDF), JANGAN dilewatkan/dikosongkan begitu saja -- sertakan screenshot SATU HALAMAN PENUH tempat gambar itu berada sebagai fallback, dan tulis di alt/deskripsi: "Perlu di-crop admin, gambar asli ada di halaman ini". Sistem punya fitur crop bawaan (drag-pilih area), jadi admin bisa memotong sendiri dari screenshot halaman penuh itu -- jangan pernah mengarang gambar atau URL yang tidak benar-benar ada.
4. Rumus harus dipertahankan sebagai LaTeX, misalnya $x^2+1$, \\(x^2+1\\), atau <span data-latex="x^2+1">...</span>.
5. Pilihan jawaban berada di <ol data-field="opsi_jawaban"><li>...</li></ol>. Setiap <li> boleh berisi gambar dan tabel.
6. Kunci ditulis di <meta data-field="kunci_jawaban" data-value="B" />. Jangan menebak kunci yang tidak tersedia.
7. Pembahasan berada di <div data-field="pembahasan">...</div>.
8. Materi, capaian, dan sumber boleh ditulis pada field data yang sesuai.
9. Tabel data gunakan <div data-field="tabel_soal"><table>...</table></div>.
10. Benar/Salah gunakan <table data-field="pernyataan">. Menjodohkan gunakan <table data-field="pasangan">.
11. Salin teks, angka, simbol, label grafik, serta isi tabel apa adanya. Jangan meringkas atau memperbaiki isi sumber secara kreatif.
12. Jika soal membutuhkan gambar tetapi gambar tidak terbaca/tersedia, jangan menebak. Kosongkan kunci dan tambahkan <div data-field="catatan_admin">Perlu pemeriksaan manual...</div>.
13. Proses SEMUA nomor dan SEMUA paket sampai selesai.
14. Jangan menyisipkan JavaScript di output HTML.

## ANALISIS PER SOAL: KESULITAN & KELAS (WAJIB DIKERJAKAN PER NOMOR, BUKAN DISERAGAMKAN)

Setiap soal dianalisis SENDIRI-SENDIRI, bukan dipukul rata untuk satu file. Tambahkan dua atribut ini langsung di tag <article> pembuka tiap soal:

15. \`data-kesulitan="mudah|sedang|sulit"\` — nilai berdasarkan soal ITU SENDIRI, bukan asumsi umum jenjangnya:
   - "mudah": penerapan rumus/konsep langsung, 1 langkah.
   - "sedang": butuh 2-3 langkah, kombinasi beberapa konsep.
   - "sulit": HOTS, banyak langkah, atau butuh analisis/manipulasi aljabar rumit.
   Field ini WAJIB diisi untuk setiap soal, jangan dikosongkan.

16. \`data-kelas="1-12"\` (angka 1 sampai 12, sesuai jenjang: SD/MI = 1-6, SMP/MTs = 7-9, SMA/MA/SMK = 10-12) — HANYA isi kalau kamu YAKIN materinya spesifik untuk kelas tertentu berdasarkan kurikulum umum Indonesia (mis. "Barisan dan Deret" = kelas 11, "Trigonometri Dasar" = kelas 10, "Turunan/Integral" = kelas 12, "Pecahan" = kelas 4-5). Kalau materinya bisa muncul di lintas kelas, dokumennya memang untuk banyak kelas sekaligus (mis. UTBK/TKA), atau kamu tidak yakin, JANGAN isi atribut ini sama sekali (jangan menebak/default ke satu angka) — sistem akan otomatis memakai kelas yang dipilih admin di form sebagai gantinya.
16b. \`<div data-field="tags">kata1, kata2, kata3</div>\` (OPSIONAL, per soal) — label bebas untuk soal ITU SAJA (mis. "hots", "aljabar", "utbk", "operasi hitung"), dipisah koma. Ini BEDA dari \`data-field="materi"\` (topik/bab formal) — tags boleh lebih bebas dan lintas-topik. Isi HANYA kalau memang relevan; kalau tidak ada label yang jelas, jangan isi atribut ini sama sekali (jangan mengarang-ngarang tag generik).

## KONSISTENSI STRUKTUR (PENTING — supaya hasil parsing tidak meleset)

17. Nama atribut \`data-field\` dan \`data-gemilang-question\` HARUS ditulis PERSIS seperti contoh, huruf kecil semua, tanpa spasi tambahan. Jangan mengganti "teks_soal" jadi "teksSoal"/"soal"/nama lain.
18. Satu <article> = satu soal. Jangan menaruh dua nomor soal dalam satu <article>, dan jangan memecah satu soal jadi dua <article>.
19. Jangan menambahkan komentar, penjelasan, atau teks apa pun di luar blok HTML.
20. 🔥 WAJIB — BACAAN YANG DIPAKAI BERSAMA BEBERAPA SOAL (mis. "Perhatikan teks berikut untuk soal nomor 1-2!"): setiap soal itu adalah DOKUMEN MANDIRI yang nantinya bisa dipakai SENDIRI-SENDIRI tanpa soal lain di sebelahnya. Karena itu, bacaan/teks/puisi/tabel bersama itu HARUS DISALIN UTUH ke field \`data-field="bacaan"\` di SETIAP soal yang terkait — BUKAN cuma ditulis sekali di soal pertama lalu soal berikutnya dibiarkan kosong tanpa bacaan. Contoh SALAH: soal 1 punya bacaan lengkap, soal 2 cuma "Ciri Komodo yang tepat sesuai teks tersebut adalah..." tanpa bacaan sama sekali -- ini bikin soal 2 TIDAK BISA DIJAWAB kalau dipakai sendirian. Contoh BENAR: soal 1 DAN soal 2 sama-sama punya \`<div data-field="bacaan" data-grup="bacaan_1">...teks Taman Nasional Komodo lengkap, PERSIS SAMA di kedua soal, tidak diringkas sedikit pun...</div>\`, isinya identik persis di keduanya. Tambahkan atribut \`data-grup="bacaan_N"\` (N = nomor urut grup bacaan dalam dokumen ini) di elemen bacaan itu — WAJIB SAMA PERSIS untuk semua soal yang memakai bacaan yang sama, supaya sistem bisa otomatis mendeteksi kalau kamu tidak sengaja meringkas/memotong bacaan di salah satu soal (dibandingkan panjangnya antar soal segrup). \`data-field="teks_soal"\` cukup berisi PERTANYAANNYA SAJA (tanpa bacaan), \`data-field="bacaan"\` berisi bacaannya (boleh sama persis berulang di beberapa soal, itu memang disengaja).

CONTOH (perhatikan: angka/nilai di bawah ini cuma ilustrasi STRUKTUR tag. Materi, kesulitan, dan kelas yang kamu isi harus hasil analisismu sendiri terhadap SETIAP soal asli, bukan disalin dari contoh ini):
<!doctype html>
<html lang="id"><body>
<article data-gemilang-question data-nomor="1" data-tipe="pg_sederhana" data-paket="1" data-kesulitan="${contohKesulitan}"${contohKelasAttr}>
<div data-field="materi">Persamaan Kuadrat</div>
<div data-field="teks_soal">Jika $x^2-5x+6=0$, nilai x adalah .... {{GAMBAR}}</div>
<div data-field="gambar"><img src="data:image/png;base64,..." alt="Diagram soal" /></div>
<ol data-field="opsi_jawaban"><li>1</li><li>2</li><li>3</li><li>4</li><li>5</li></ol>
<meta data-field="kunci_jawaban" data-value="C" />
<div data-field="pembahasan">$(x-2)(x-3)=0$.</div>
</article>
</body></html>`;
}

// ============================================================
// SAFE HELPERS
// ============================================================

// 🔥 BARU: normalisasi teks buat deteksi soal duplikat -- dibuat tahan
// terhadap variasi kecil yang WAJAR terjadi antar hasil scan AI (spasi
// beda, huruf besar/kecil, simbol kali "×" vs huruf "x", tanda baca
// beda gaya) tapi TETAP ketat mendeteksi isi yang SEBENARNYA sama.
function normalisasiTeksDuplikat(t) {
  return String(t || '')
    .toLowerCase()
    .replace(/[×✕]/g, 'x')
    .replace(/[÷]/g, ':')
    .replace(/[^a-z0-9:]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function safeString(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return fallback;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

// 🔥 BARU: Firestore TIDAK MENDUKUNG array di dalam array (nested
// array) sebagai nilai field -- error nyata yang ditemukan: "Function
// WriteBatch.set() called with invalid data. Nested arrays are not
// supported". Ini bukan cuma bug di parser HTML (tabel_soal dari HTML
// Master) -- kalau admin paste JSON/CSV yang tabel_soal.baris-nya JUGA
// array-of-array (cara natural nulis tabel di JSON), bug yang sama
// bakal muncul lagi. Sanitizer ini dipasang UNIVERSAL di buildDoc()
// (bukan cuma di parser HTML) supaya menjaga SEMUA jalur input
// sekaligus -- baris array diubah jadi objek {0:sel1,1:sel2,...},
// yang tetap dirender identik oleh QuestionTable (sudah punya fallback
// Object.values(row)).
function amankanTabelDariNestedArray(tabel) {
  if (!tabel || !Array.isArray(tabel.baris)) return tabel;
  const adaBarisArray = tabel.baris.some(row => Array.isArray(row));
  if (!adaBarisArray) return tabel; // sudah aman, tidak perlu diubah
  return {
    ...tabel,
    baris: tabel.baris.map(row => {
      if (!Array.isArray(row)) return row; // sudah objek, biarkan
      const objBaris = {};
      row.forEach((sel, i) => { objBaris[i] = sel; });
      return objBaris;
    }),
  };
}

function safeBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return ['true', '1', 'yes', 'ya', 'benar'].includes(value.toLowerCase().trim());
  }
  if (typeof value === 'number') return value === 1;
  return false;
}

function cleanCodeFence(text) {
  let result = safeString(text).trim();
  result = result.replace(/^\uFEFF/, '');
  result = result.replace(/^```(?:json|JSON)?\s*/i, '');
  result = result.replace(/\s*```\s*$/i, '');
  return result.trim();
}

function tryParseJSON(text) {
  const cleaned = cleanCodeFence(text);
  try {
    return JSON.parse(cleaned);
  } catch (firstError) {
    const firstArray = cleaned.indexOf('[');
    const lastArray = cleaned.lastIndexOf(']');
    if (firstArray >= 0 && lastArray > firstArray) {
      const candidate = cleaned.slice(firstArray, lastArray + 1);
      try { return JSON.parse(candidate); } catch (_) { /* lanjut */ }
    }
    const firstObject = cleaned.indexOf('{');
    const lastObject = cleaned.lastIndexOf('}');
    if (firstObject >= 0 && lastObject > firstObject) {
      const candidate = cleaned.slice(firstObject, lastObject + 1);
      try { return JSON.parse(candidate); } catch (_) { /* pakai error asli */ }
    }
    throw new Error(`JSON tidak valid: ${firstError.message}`);
  }
}

// ============================================================
// EXTRACT & FLATTEN (mendukung 1 file berisi banyak paket)
// ============================================================

function findArrayByKeys(obj, keys) {
  for (const key of keys) {
    if (Array.isArray(obj?.[key])) return { key, arr: obj[key] };
  }
  return null;
}

function extractGroupedQuestions(parsed) {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;

  const groupHit = findArrayByKeys(parsed, GROUP_KEYS);
  if (!groupHit) return null;

  const flattened = [];

  groupHit.arr.forEach((group, groupIndex) => {
    if (!group || typeof group !== 'object') return;

    const itemHit = findArrayByKeys(group, GROUP_ITEM_KEYS);
    const items = itemHit ? itemHit.arr : [];

    const paketNumber =
      group.paket ?? group.nomor_paket ?? group.nomorPaket ??
      group.id ?? (groupIndex + 1);

    const paketMeta = {
      paket: paketNumber,
      nama: safeString(group.nama_paket || group.namaPaket || group.nama || `Paket ${paketNumber}`),
      halaman_soal: safeString(group.halaman_soal || group.halamanSoal || ''),
      halaman_pembahasan: safeString(group.halaman_pembahasan || group.halamanPembahasan || ''),
      waktu: safeString(group.waktu || ''),
    };

    items.forEach(item => {
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        flattened.push({ ...item, __paket: paketNumber, __paketMeta: paketMeta });
      }
    });
  });

  return flattened.length > 0 ? flattened : null;
}

function extractQuestionArray(parsed) {
  if (Array.isArray(parsed)) return parsed;

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Format JSON tidak dikenali. JSON harus berupa array soal atau object yang berisi array soal.');
  }

  // 1) Coba deteksi struktur ber-grup (banyak paket dalam 1 file).
  const grouped = extractGroupedQuestions(parsed);
  if (grouped) return grouped;

  // 2) Struktur datar biasa: { questions: [...] } dst.
  const candidates = ['questions', 'question', 'soal', 'soals', 'items', 'data', 'results', 'bankSoal', 'bank_soal'];
  for (const key of candidates) {
    if (Array.isArray(parsed[key])) return parsed[key];
  }

  // 3) Object of objects yang tiap valuenya terlihat seperti soal.
  const objectValues = Object.values(parsed);
  if (objectValues.length > 0 && objectValues.every(item => item && typeof item === 'object' && !Array.isArray(item))) {
    const looksLikeQuestions = objectValues.some(item => item.soal || item.teks_soal || item.question || item.pertanyaan);
    if (looksLikeQuestions) return objectValues;
  }

  throw new Error('Format JSON tidak dikenali. Gunakan array soal seperti [{...}], {"questions":[{...}]}, atau grup paket seperti {"tryout":[{"paket":1,"soal":[...]}]}');
}

// ============================================================
// NORMALIZE TYPE
// ============================================================

function normalizeTipe(value) {
  const raw = safeString(value).toLowerCase().trim();
  const aliases = {
    pg: 'pg_sederhana',
    pilihan_ganda: 'pg_sederhana',
    pilihan_ganda_sederhana: 'pg_sederhana',
    multiple_choice: 'pg_sederhana',
    multiplechoice: 'pg_sederhana',
    pg_sederhana: 'pg_sederhana',
    pg_gambar: 'pg_sederhana',
    pg_tabel: 'pg_sederhana',
    pg_kompleks: 'pg_kompleks',
    multiple_select: 'pg_kompleks',
    multiple_answers: 'pg_kompleks',
    multiple_response: 'pg_kompleks',
    multiple_choice_multiple_response: 'pg_kompleks',
    mcma: 'pg_kompleks',
    pg_kategori: 'pg_kategori',
    pilihan_ganda_kompleks_kategori: 'pg_kategori',
    kategori: 'pg_kategori',
    benar_salah: 'benar_salah',
    true_false: 'benar_salah',
    truefalse: 'benar_salah',
    bs: 'benar_salah',
    isian: 'isian_singkat',
    isian_singkat: 'isian_singkat',
    short_answer: 'isian_singkat',
    numerik: 'numerik',
    numerical: 'numerik',
    numeric: 'numerik',
    menjodohkan: 'menjodohkan',
    matching: 'menjodohkan',
    uraian: 'uraian',
    esai: 'uraian',
    essay: 'uraian',
  };
  return aliases[raw] || 'pg_sederhana';
}

// ============================================================
// NORMALIZE IMAGE
// ============================================================

function normalizeImage(image, index = 0) {
  if (!image) {
    return { id: `gambar-${index + 1}`, url: '', dataUrl: '', uploadedUrl: '', deskripsi: '', nomor: index + 1 };
  }

  if (typeof image === 'string') {
    const isData = image.startsWith('data:image');
    return {
      id: `gambar-${index + 1}`,
      url: isData ? '' : image,
      dataUrl: isData ? image : '',
      uploadedUrl: '',
      deskripsi: '',
      nomor: index + 1,
    };
  }

  const dataUrl = safeString(image.dataUrl || image.base64 || image.data || '');
  const url = safeString(image.url || image.src || image.imageUrl || '');

  return {
    id: safeString(image.id, `gambar-${index + 1}`),
    url,
    dataUrl: dataUrl.startsWith('data:image') ? dataUrl : '',
    uploadedUrl: safeString(image.uploadedUrl, ''),
    deskripsi: safeString(image.deskripsi || image.description || image.alt || ''),
    nomor: Number(image.nomor) || index + 1,
  };
}

function normalizeImageArray(source) {
  let arr = source;
  if (arr && !Array.isArray(arr)) arr = [arr];
  return safeArray(arr).map((img, i) => normalizeImage(img, i));
}

// ============================================================
// NORMALIZE TABLE (untuk opsi berbentuk tabel, mis. perbandingan 2 kolom)
// ============================================================

function normalizeTabel(source) {
  if (!source) return [];

  // Sudah array of {kolom, isi} atau array of {label, value} dsb.
  if (Array.isArray(source)) {
    return source.map(row => {
      if (row && typeof row === 'object') {
        return {
          kolom: safeString(row.kolom || row.label || row.key || row.judul || ''),
          isi: safeString(row.isi || row.value || row.teks || row.text || ''),
        };
      }
      return { kolom: '', isi: safeString(row) };
    });
  }

  // Object bebas: { Rutherford: "...", Bohr: "..." } -> jadi baris per key.
  if (typeof source === 'object') {
    return Object.entries(source).map(([kolom, isi]) => ({
      kolom: safeString(kolom),
      isi: safeString(isi),
    }));
  }

  return [];
}

// ============================================================
// NORMALIZE OPTION (RICH: teks + gambar + tabel)
// ============================================================

function normalizeOptionRich(option) {
  if (typeof option === 'string' || typeof option === 'number') {
    return { teks: safeString(option).trim(), gambar: [], tabel: [] };
  }

  if (option && typeof option === 'object') {
    const teks = safeString(
      option.teks || option.text || option.jawaban || option.value || option.label || '',
    );

    const gambarSource = option.gambar ?? option.images ?? option.image ?? [];
    const gambar = normalizeImageArray(gambarSource);

    const tabelSource = option.tabel ?? option.table ?? null;
    const tabel = normalizeTabel(tabelSource);

    return { teks, gambar, tabel };
  }

  return { teks: '', gambar: [], tabel: [] };
}

function optionIsEmpty(opt) {
  return !opt.teks && opt.gambar.length === 0 && opt.tabel.length === 0;
}

// ============================================================
// NORMALIZE ANSWER KEY
// ============================================================

function normalizeAnswerKey(value) {
  if (Array.isArray(value)) {
    return value.map(item => safeString(item).trim().toUpperCase()).filter(Boolean);
  }
  return safeString(value).trim().toUpperCase();
}

function getCorrectAnswerIndexes(opsi, kunci) {
  const keys = Array.isArray(kunci) ? kunci : safeString(kunci).split(/[,\s]+/).filter(Boolean);
  const normalizedKeys = keys.map(key => safeString(key).trim().toUpperCase());

  return opsi.map((_, index) => {
    const letter = String.fromCharCode(65 + index);
    return normalizedKeys.includes(letter);
  });
}

// ============================================================
// NORMALIZE SOAL
// ============================================================

function normalizeSoal(q, idx) {
  if (!q || typeof q !== 'object') {
    return {
      nomor: idx + 1,
      paket: null,
      paketMeta: null,
      tipe: 'pg_sederhana',
      bacaan: null,
      teks_soal: '',
      opsi_jawaban: [],
      opsi_benar: [],
      pernyataan: [],
      tabel_benar_salah: [],
      pasangan: [],
      kunci_jawaban: '',
      kunci_terverifikasi: false,
      pembahasan: '',
      catatan_admin: '',
      gambar: [],
      materi: '',
      capaian_pembelajaran: '',
      valid: false,
      errors: ['Data soal bukan object.'],
    };
  }

  const nomor = Number(q.nomor ?? q.no ?? q.number) || idx + 1;

  const paket = q.__paket ?? q.paket ?? null;
  const paketMeta = q.__paketMeta ?? q.paketMeta ?? null;

  let tipe = normalizeTipe(q.tipe || q.type || q.jenis || q.jenis_soal);

  const teksSoal = safeString(
    q.teks_soal || q.soal || q.question || q.pertanyaan || '',
  );

  // ----------------------------------------------------------
  // BACAAN / STIMULUS (mis. teks panjang, data, atau ilustrasi yang
  // dipakai bersama oleh sekelompok soal). SENGAJA disalin utuh ke
  // tiap soal (bukan direferensikan via id) supaya tiap soal tetap
  // jadi satu kesatuan lengkap saat ditarik terpisah / dicampur
  // dengan soal lain, tanpa bergantung pada folder/objek lain.
  // ----------------------------------------------------------

  const bacaanSource = q.bacaan ?? q.stimulus ?? q.wacana ?? null;
  let bacaan = null;

  if (typeof bacaanSource === 'string' && bacaanSource.trim()) {
    bacaan = { teks: bacaanSource.trim(), gambar: [] };
  } else if (bacaanSource && typeof bacaanSource === 'object') {
    const teksBacaan = safeString(bacaanSource.teks || bacaanSource.text || '');
    const gambarBacaan = normalizeImageArray(bacaanSource.gambar ?? bacaanSource.images ?? []);
    if (teksBacaan || gambarBacaan.length > 0) {
      bacaan = { teks: teksBacaan, gambar: gambarBacaan };
    }
  }

  // ----------------------------------------------------------
  // OPTIONS (rich: teks + gambar + tabel per opsi)
  // ----------------------------------------------------------

  let opsiSource = q.opsi_jawaban ?? q.opsiJawaban ?? q.options ?? q.pilihan ?? q.choices ?? [];
  let opsiJawaban = [];

  if (Array.isArray(opsiSource)) {
    opsiJawaban = opsiSource.map(normalizeOptionRich).filter(opt => !optionIsEmpty(opt));
  } else if (opsiSource && typeof opsiSource === 'object') {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    opsiJawaban = letters
      .map(letter => normalizeOptionRich(opsiSource[letter] ?? opsiSource[letter.toLowerCase()]))
      .filter(opt => !optionIsEmpty(opt));
  }

  // ----------------------------------------------------------
  // ANSWER KEY
  // ----------------------------------------------------------

  const rawKey =
    q.kunci_jawaban ?? q.kunciJawaban ?? q.kunci ?? q.jawaban_benar ?? q.jawabanBenar ??
    q.correctAnswer ?? q.correct_answer ?? q.answer ?? '';

  const kunciJawaban = normalizeAnswerKey(rawKey);
  const opsiBenar = getCorrectAnswerIndexes(opsiJawaban, kunciJawaban);

  // ----------------------------------------------------------
  // PERNYATAAN (benar/salah kompleks lama, tetap didukung)
  // ----------------------------------------------------------

  const pernyataan = safeArray(q.pernyataan || q.statements)
    .map(item => {
      if (item && typeof item === 'object') {
        return {
          teks: safeString(item.teks || item.text || item.pernyataan || ''),
          jawaban: safeString(item.jawaban || item.answer || item.nilai || ''),
        };
      }
      return { teks: safeString(item), jawaban: '' };
    })
    .filter(item => item.teks);

  const tabelBenarSalah = safeArray(q.tabel_benar_salah || q.tabelBenarSalah || q.trueFalseTable)
    .map(item => {
      if (item && typeof item === 'object') {
        return {
          pernyataan: safeString(item.pernyataan || item.teks || item.text || ''),
          jawaban: safeString(item.jawaban || item.answer || ''),
        };
      }
      return safeString(item);
    })
    .filter(Boolean);

  // 🔥 BARU (bug nyata ditemukan): kadang tabel Benar/Salah di dokumen
  // sumber itu LEMBAR KERJA KOSONG (kolom checkbox Benar/Salah memang
  // belum dicentang sama sekali di PDF asli -- itu format soal yang
  // wajar, bukan kerusakan). Tapi AI biasanya TETAP menghitung kunci
  // jawabannya sendiri dan menuliskannya terpisah di kunci_jawaban
  // sebagai gabungan (mis. "BENAR-BENAR-SALAH"). Kalau per-pernyataan
  // jawabannya kosong TAPI ada kunci gabungan begini dengan jumlah token
  // PERSIS SAMA dengan jumlah pernyataan, pulihkan jawaban tiap
  // pernyataan dari situ -- daripada dibiarkan kosong semua padahal
  // kuncinya sebenarnya sudah ada.
  function pulihkanJawabanDariKunciGabungan(daftarPernyataan, kunciMentah) {
    if (!daftarPernyataan.length) return daftarPernyataan;
    const adaYangKosong = daftarPernyataan.some(p => !safeString(p.jawaban).trim());
    if (!adaYangKosong) return daftarPernyataan;

    const token = safeString(kunciMentah).split(/[-,;/]+/).map(t => t.trim()).filter(Boolean);
    if (token.length !== daftarPernyataan.length) return daftarPernyataan;

    const normalisasi = (t) => {
      const low = t.toLowerCase();
      if (/^(benar|b|true|1)$/.test(low)) return 'Benar';
      if (/^(salah|s|false|0)$/.test(low)) return 'Salah';
      return '';
    };
    const tokenValid = token.map(normalisasi);
    if (tokenValid.some((t) => !t)) return daftarPernyataan; // ada token gak dikenali, jangan menebak

    return daftarPernyataan.map((p, i) => (safeString(p.jawaban).trim() ? p : { ...p, jawaban: tokenValid[i] }));
  }

  const pernyataanTerpulihkan = pulihkanJawabanDariKunciGabungan(pernyataan, rawKey);
  const tabelBenarSalahTerpulihkan = pulihkanJawabanDariKunciGabungan(tabelBenarSalah, rawKey);

  const pasangan = safeArray(q.pasangan || q.matching || q.pairs)
    .map(pair => ({
      kiri: safeString(pair?.kiri || pair?.left || pair?.pertanyaan || ''),
      kanan: safeString(pair?.kanan || pair?.right || pair?.jawaban || ''),
    }))
    .filter(pair => pair.kiri || pair.kanan);

  // ----------------------------------------------------------
  // IMAGES (gambar utama soal)
  // ----------------------------------------------------------

  const imageSource = q.gambar ?? q.images ?? q.image ?? q.gambar_soal ?? [];
  const gambar = normalizeImageArray(imageSource);

  // ----------------------------------------------------------
  // EXPLICIT CORRECT FLAGS
  // ----------------------------------------------------------

  const explicitCorrect = safeArray(q.opsi_benar || q.opsiBenar || q.correctOptions);
  let finalOpsiBenar = opsiBenar;

  if (explicitCorrect.length > 0) {
    finalOpsiBenar = opsiJawaban.map((_, optionIndex) => {
      const letter = String.fromCharCode(65 + optionIndex);
      return explicitCorrect.some(value => {
        const normalized = safeString(value).trim().toUpperCase();
        return normalized === letter || normalized === String(optionIndex);
      });
    });
  }

  // ----------------------------------------------------------
  // VALIDATION
  // ----------------------------------------------------------

  const errors = [];
  // 🔥 BARU: peringatan yang TIDAK memblokir valid (beda dari errors) --
  // lihat penjelasan lengkap di Sinyal 4 bawah.
  const peringatanLunak = [];

  // 🔥 BARU (bug nyata ditemukan): AI kadang menandai
  // data-tipe="pg_sederhana"/"pg_kompleks" padahal soal itu SEBENARNYA
  // pakai format tabel Benar/Salah (data-field="pernyataan" atau
  // "tabel_benar_salah"), bukan opsi pilihan ganda -- soal seperti ini
  // SEBENARNYA LENGKAP dan VALID, cuma label tipenya yang salah dari AI.
  // Sebelumnya soal seperti ini ditolak keras ("Pilihan jawaban kurang
  // dari 2") padahal datanya utuh. Sekarang: kalau polanya jelas (tidak
  // ada opsi_jawaban SAMA SEKALI, tapi ADA tabel pernyataan Benar/Salah),
  // label tipenya diperbaiki otomatis jadi "pg_kategori" -- soal tetap
  // masuk sebagai valid, bukan ditolak gara-gara salah label AI.
  if (['pg_sederhana', 'pg_kompleks'].includes(tipe) && opsiJawaban.length === 0 && (pernyataan.length > 0 || tabelBenarSalah.length > 0)) {
    peringatanLunak.push(
      `Tipe soal otomatis dikoreksi dari "${tipe}" jadi "pg_kategori" -- soal ini pakai format tabel Benar/Salah (bukan opsi pilihan ganda), tapi AI salah menandai tipenya. Datanya sendiri lengkap, cuma labelnya yang diperbaiki.`,
    );
    tipe = 'pg_kategori';
  }

  if (!teksSoal.trim()) errors.push('Teks soal kosong.');

  if (['pg_sederhana', 'pg_kompleks'].includes(tipe) && opsiJawaban.length < 2) {
    errors.push('Pilihan jawaban kurang dari 2.');
  }

  if (['pg_sederhana', 'pg_kompleks'].includes(tipe) && !kunciJawaban) {
    errors.push('Kunci jawaban belum ditemukan.');
  }

  if (['benar_salah', 'pg_kategori'].includes(tipe) && !pernyataan.length && !tabelBenarSalah.length) {
    errors.push('Pernyataan kategori/Benar-Salah belum ditemukan.');
  }

  if (['isian_singkat', 'numerik', 'uraian'].includes(tipe) && !kunciJawaban) {
    errors.push('Jawaban model atau kunci belum ditemukan.');
  }

  // ----------------------------------------------------------
  // DETEKSI teks_soal TERCAMPUR/RUSAK
  // ------------------------------------------------------------
  // Ditemukan kasus nyata: AI menggabungkan teks_soal + pembahasan +
  // bahkan NAMA FILE SUMBER jadi satu string panjang, dengan sebagian
  // LaTeX ke-render (di dalam $...$) dan salinan mentahnya lagi di luar
  // delimiter (muncul sebagai "\frac12\pi" apa adanya di layar), plus
  // kalimat pembahasan yang kehilangan semua spasi antar kata. Sebelum
  // ini, soal seperti ini tetap lolos sebagai "✓ Valid" karena tidak ada
  // satu pun pengecekan yang menyentuh ISI teks_soal, cuma mengecek ada/
  // tidaknya field. Empat sinyal di bawah menangkap pola kerusakan itu.
  // ----------------------------------------------------------

  // Sinyal 1: nama file sumber ikut nyangkut ke teks_soal
  if (/\.(pdf|docx?|xlsx?|pptx?)\b/i.test(teksSoal)) {
    errors.push('teks_soal mengandung nama file sumber (mis. ".pdf") -- kemungkinan tercampur dengan metadata, cek manual.');
  }

  // Sinyal 2: perintah LaTeX mentah (\frac, \pi, dst) yang berada DI LUAR
  // delimiter $...$/$$...$$/\(...\)/\[...\]. LaTeX yang benar SELALU ada
  // di dalam salah satu delimiter itu (lihat aturan #4 prompt) -- kalau
  // ketemu di luar situ, hampir pasti duplikat mentah yang gagal ke-render.
  {
    const tanpaMathBlock = teksSoal
      .replace(/\$\$[\s\S]*?\$\$/g, ' ')
      .replace(/\\\([\s\S]*?\\\)/g, ' ')
      .replace(/\\\[[\s\S]*?\\\]/g, ' ')
      .replace(/\$[^$]*?\$/g, ' ');
    if (/\\[a-zA-Z]{2,}/.test(tanpaMathBlock)) {
      errors.push('Ada kode LaTeX mentah (mis. "\\\\frac", "\\\\pi") di luar tanda $...$ -- kemungkinan duplikat teks yang gagal dirender, cek manual.');
    }
  }

  // Sinyal 3: rentetan huruf tanpa spasi sepanjang >=25 karakter (mis.
  // "Gunakancos2x=2cos^2x-1.Diperoleh...") -- tidak wajar untuk kalimat
  // soal biasa, biasanya terjadi kalau teks pembahasan ikut tergabung
  // tanpa spasi pemisah antar kata/kalimat.
  if (/[A-Za-z]{25,}/.test(teksSoal)) {
    errors.push('Ada rentetan huruf tanpa spasi yang sangat panjang -- kemungkinan teks tergabung tanpa pemisah, cek manual.');
  }

  // Sinyal 4: panjang teks_soal jauh di luar wajar untuk satu butir soal
  // pilihan ganda biasa. RIWAYAT PERBAIKAN (penting dibaca sebelum
  // mengubah lagi):
  // v1: langsung masuk `errors` (blokir simpan) kalau >700 karakter --
  //     ternyata soal literasi (bacaan panjang wajar) ikut ke-blokir.
  // v2: dibedakan lewat "tanda bacaan literasi" (kutipan "Sumber:",
  //     "Perhatikan teks berikut", atau berparagraf) -- kalau ada,
  //     jadi peringatan lunak; kalau tidak ada, tetap error.
  //     TERNYATA GAGAL LAGI: soal TKA Kimia/HOTS mata pelajaran lain
  //     punya stimulus panjang (penjelasan konfigurasi elektron, data
  //     tabel, dst) TANPA kutipan "Sumber:" ataupun frasa "Perhatikan
  //     teks berikut" -- soal yang justru VALID malah ke-blokir lagi
  //     (8 dari 10 soal Kimia TKA salah tertolak, padahal semuanya
  //     lengkap dan benar).
  // v3 (SEKARANG): heuristik tebak-dari-kata-kunci TERBUKTI RAPUH --
  //     beda mapel/gaya penulisan, jebol lagi dengan pola berbeda.
  //     Panjang teks SENDIRIAN bukan bukti kerusakan yang kuat --
  //     kerusakan ASLI (teks_soal tercampur pembahasan/nama file) sudah
  //     ditangkap Sinyal 1-3 di atas (jauh lebih pasti: nama file
  //     nyangkut, kode LaTeX mentah di luar $...$, huruf gabung tanpa
  //     spasi >=25 karakter). Sinyal 4 SEKARANG SELALU jadi peringatan
  //     lunak (tidak pernah blokir penyimpanan) -- cukup mengingatkan
  //     admin untuk cek sekilas, tanpa risiko menolak soal yang valid.
  if (teksSoal.length > 700 && !bacaan) {
    peringatanLunak.push(
      `teks_soal panjang (${teksSoal.length} karakter) tanpa field bacaan terpisah. Ini WAJAR untuk soal dengan stimulus/wacana panjang (literasi, TKA/HOTS sains, dst) -- TIDAK menghalangi penyimpanan. Cek sekilas kalau ragu; kalau mau lebih rapi, bisa dipisah manual ke field bacaan nanti.`,
    );
  }

  // Sinyal 5: soal "YATIM" -- menunjuk ke bacaan/teks yang TIDAK ADA di
  // soal ini sama sekali. Ditemukan kasus nyata: soal literasi yang
  // berbagi 1 bacaan untuk beberapa nomor (mis. "untuk soal nomor 1-2"),
  // tapi AI cuma nulis bacaannya SEKALI di soal pertama -- soal
  // berikutnya cuma berisi pertanyaan pendek yang menunjuk "teks
  // tersebut"/"bacaan di atas" TANPA bacaan itu sendiri. Kalau soal itu
  // nanti dipakai SENDIRIAN (mis. lewat Terbitkan Kuis, tanpa soal
  // pasangannya), siswa lihat pertanyaan yang TIDAK BISA DIJAWAB karena
  // konteksnya hilang. Ini HARD ERROR (bukan cuma peringatan) karena
  // soal seperti ini genuinely tidak lengkap, beda dari Sinyal 4 di atas
  // yang soal-nya justru sudah lengkap (cuma strukturnya kurang rapi).
  const menunjukTeksLain = /\b(teks|bacaan|paragraf|puisi|artikel|kutipan)\s+(tersebut|di atas|di depan|itu)\b/i.test(teksSoal)
    || /\bberdasarkan\s+(teks|bacaan|paragraf)\s+\d/i.test(teksSoal);
  if (menunjukTeksLain && !bacaan && teksSoal.length < 400) {
    errors.push(
      'Soal ini menunjuk "teks/bacaan tersebut" tapi TIDAK punya bacaan sama sekali (field bacaan kosong, teks_soal pendek) -- kemungkinan bacaan cuma ditulis di soal SEBELUMNYA dan tidak disalin ke soal ini. Kalau soal ini nanti dipakai sendirian, siswa tidak akan bisa menjawab. Cek soal-soal di sekitarnya untuk bacaan yang seharusnya disalin ke sini.',
    );
  }

  return {
    nomor,
    paket,
    paketMeta,
    tipe,
    bacaan,
    teks_soal: teksSoal,
    opsi_jawaban: opsiJawaban,
    opsi_benar: finalOpsiBenar,
    pernyataan: pernyataanTerpulihkan,
    tabel_benar_salah: tabelBenarSalahTerpulihkan,
    pasangan,
    kunci_jawaban: kunciJawaban,
    jawaban_ekuivalen: safeArray(q.jawaban_ekuivalen || q.jawabanEkuivalen || q.accepted_answers)
      .map(value => safeString(value).trim()).filter(Boolean),
    satuan_jawaban: safeString(q.satuan_jawaban || q.satuanJawaban || q.unit || ''),
    toleransi_jawaban: Number(q.toleransi_jawaban ?? q.toleransiJawaban ?? q.tolerance) || null,
    kunci_terverifikasi: safeBoolean(
      q.kunci_terverifikasi ?? q.kunciTerverifikasi ?? q.verifiedAnswer ?? false,
    ),
    pembahasan: safeString(q.pembahasan || q.penjelasan || q.explanation || q.solusi || ''),
    catatan_admin: safeString(q.catatan_admin || q.catatanAdmin || q.admin_note || ''),
    gambar,
    tabel_soal: q.tabel_soal || q.tabelSoal || null,
    referensi_sumber: q.referensi_sumber || q.referensiSumber || q.source_reference || null,
    materi: safeString(q.materi || q.meta_materi || ''),
    // 🔥 BARU: tags per soal -- terima dari HTML Master (field
    // tags_soal, array hasil split koma) ATAU dari format JSON/CSV
    // (field "tags" langsung, bisa string koma atau array).
    tags_soal: (() => {
      const mentah = q.tags_soal ?? q.tags ?? [];
      const arr = Array.isArray(mentah) ? mentah : safeString(mentah).split(',');
      return arr.map(t => safeString(t).trim()).filter(Boolean);
    })(),
    capaian_pembelajaran: safeString(q.capaian_pembelajaran || q.meta_capaian_pembelajaran || ''),
    // Analisis per-soal (bukan diseragamkan per-file). Kalau AI tidak
    // mengisi/tidak yakin, dikosongkan di sini -- buildDoc() yang akan
    // memutuskan fallback ke pilihan form admin (lihat komentar di buildDoc).
    tingkat_kesulitan_soal: (() => {
      const rawKesulitan = safeString(q.tingkat_kesulitan || q.tingkatKesulitan || q.kesulitan || q.difficulty || '').toLowerCase().trim();
      return DAFTAR_KESULITAN.includes(rawKesulitan) ? rawKesulitan : '';
    })(),
    kelas_soal: safeString(q.kelas || q.tingkat_kelas || q.tingkatKelas || q.grade || '').trim(),
    valid: errors.length === 0,
    errors,
    // 🔥 BARU: peringatan yang TIDAK menghalangi penyimpanan -- beda
    // dari `errors` yang bikin soal invalid. Ditampilkan ke admin biar
    // tetap transparan, tapi soal ini tetap bisa masuk Bank Soal.
    peringatan: peringatanLunak,
  };
}

// ============================================================
// JSON PARSER
// ============================================================

function parseJSON(raw) {
  const parsed = tryParseJSON(raw);
  const questions = extractQuestionArray(parsed);

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error('JSON berhasil dibaca tetapi tidak berisi soal.');
  }

  return questions;
}

// ============================================================
// CSV PARSER (tetap mendukung opsi teks sederhana)
// ============================================================

function parseCSV(raw) {
  const text = safeString(raw).trim();
  if (!text) throw new Error('CSV kosong.');

  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') { cell += '"'; i++; }
      else { inQuotes = !inQuotes; }
      continue;
    }

    if (char === ',' && !inQuotes) { row.push(cell); cell = ''; continue; }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(cell);
      cell = '';
      if (row.some(item => item.trim() !== '')) rows.push(row);
      row = [];
      continue;
    }

    cell += char;
  }

  row.push(cell);
  if (row.some(item => item.trim() !== '')) rows.push(row);

  if (rows.length < 2) throw new Error('CSV harus memiliki header dan minimal satu soal.');

  const header = rows[0].map(item => item.replace(/^\uFEFF/, '').trim().toLowerCase());

  const get = (currentRow, ...names) => {
    for (const name of names) {
      const index = header.indexOf(name.toLowerCase());
      if (index >= 0) return safeString(currentRow[index]).trim();
    }
    return '';
  };

  return rows.slice(1).map((currentRow, index) => {
    const opsi = ['a', 'b', 'c', 'd', 'e']
      .map(letter => get(currentRow, `opsi ${letter}`, `option ${letter}`, letter))
      .filter(Boolean);

    return {
      nomor: Number(get(currentRow, 'nomor', 'no', 'number')) || index + 1,
      tipe: get(currentRow, 'tipe', 'type') || 'pg_sederhana',
      teks_soal: get(currentRow, 'soal', 'teks soal', 'teks_soal', 'question'),
      opsi_jawaban: opsi,
      kunci_jawaban: get(currentRow, 'kunci', 'kunci jawaban', 'kunci_jawaban', 'jawaban benar', 'correct answer'),
      pembahasan: get(currentRow, 'pembahasan', 'penjelasan', 'explanation'),
      pernyataan: get(currentRow, 'pernyataan').split('|').map(x => x.trim()).filter(Boolean),
      tabel_benar_salah: get(currentRow, 'tabel benar-salah', 'tabel benar salah').split('|').map(x => x.trim()).filter(Boolean),
      pasangan: [],
      gambar: [],
    };
  });
}

// ============================================================
// HTML MASTER PARSER
// ------------------------------------------------------------
// Format master untuk soal kompleks: teks + LaTeX + gambar + tabel.
// Gambar dapat ditanam langsung sebagai data URL sehingga tetap ikut
// terbawa dalam satu file HTML dan selanjutnya bisa diupload ke storage.
// ============================================================

function htmlNodeText(node) {
  if (!node) return '';
  const clone = node.cloneNode(true);
  clone.querySelectorAll?.('img, table, script, style, svg').forEach(el => el.remove());
  clone.querySelectorAll?.('[data-latex]').forEach(el => {
    const latex = el.getAttribute('data-latex');
    if (latex) el.replaceWith(document.createTextNode(`$${latex}$`));
  });
  return safeString(clone.textContent).replace(/\s+\n/g, '\n').replace(/\n\s+/g, '\n').trim();
}

function htmlImageToObject(img, index = 0) {
  const src = safeString(img?.getAttribute?.('src') || img?.src || '').trim();
  const alt = safeString(img?.getAttribute?.('alt') || img?.getAttribute?.('data-description') || '').trim();
  const isData = src.startsWith('data:image');
  return {
    id: safeString(img?.getAttribute?.('data-id'), `gambar-${index + 1}`),
    url: isData ? '' : src,
    dataUrl: isData ? src : '',
    uploadedUrl: '',
    deskripsi: alt,
    nomor: index + 1,
  };
}

function parseHTMLImages(container) {
  if (!container) return [];
  return Array.from(container.querySelectorAll('img'))
    .map((img, index) => htmlImageToObject(img, index))
    .filter(image => image.dataUrl || image.url);
}

function parseHTMLTableElement(table) {
  if (!table) return null;
  const rows = Array.from(table.querySelectorAll('tr'));
  if (!rows.length) return null;
  const firstCells = Array.from(rows[0].querySelectorAll(':scope > th, :scope > td'));
  const header = firstCells.map(cell => htmlNodeText(cell));
  const bodyRowsMentah = rows.slice(1).map(row =>
    Array.from(row.querySelectorAll(':scope > th, :scope > td')).map(cell => htmlNodeText(cell)),
  );
  const hasHeader = Boolean(rows[0].querySelector(':scope > th')) || table.getAttribute('data-has-header') === 'true';
  const bodyRowsArray = hasHeader ? bodyRowsMentah : [header, ...bodyRowsMentah];

  // 🔥 PENTING (bug nyata ditemukan): Firestore TIDAK MENDUKUNG array di
  // dalam array (nested array) sebagai nilai field -- error asli:
  // "Function WriteBatch.set() called with invalid data. Nested arrays
  // are not supported". Sebelumnya `baris` di sini adalah array-of-array
  // (tiap baris tabel = array sel mentah), lolos di preview (browser
  // gak masalah) tapi GAGAL DIAM-DIAM pas disimpan ke Firestore.
  // Dikonversi ke array-of-OBJEK di sini (tiap baris = {0:sel1,
  // 1:sel2, ...}) -- QuestionTable SUDAH otomatis mendukung bentuk ini
  // lewat `Object.values(row)`, jadi tampilan tidak berubah sama sekali.
  const baris = bodyRowsArray.map(row => {
    const objBaris = {};
    row.forEach((sel, i) => { objBaris[i] = sel; });
    return objBaris;
  });

  return { header: hasHeader ? header : [], baris };
}

// 🔥 BARU: cek apakah 1 sel tabel "dicentang" (menandakan jawaban Benar
// atau Salah pada tabel kolom checkbox) -- dipakai parseHTMLStatements.
function selBerisiCentang(cell) {
  const t = htmlNodeText(cell).trim();
  return /^(✓|√|v|x|✔|ya|benar|salah|true|1)$/i.test(t);
}

function parseHTMLStatements(container) {
  if (!container) return [];
  return Array.from(container.querySelectorAll('tr')).map(row => {
    const cells = Array.from(row.querySelectorAll(':scope > th, :scope > td'));
    if (cells.length < 2) return null;

    const teksSel = cells.map(c => htmlNodeText(c).trim());

    // 🔥 BARU (bug nyata ditemukan): deteksi baris header DIPERKUAT.
    // Sebelumnya cuma cek cells[0] cocok "pernyataan/statement/keterangan"
    // -- GAGAL untuk tabel format "No | Pernyataan | Benar | Salah" karena
    // sel pertama header-nya "No", bukan "Pernyataan". Akibatnya baris
    // header ikut kebaca sebagai data (pernyataan #1 palsu berisi teks
    // "No"). Sekarang dicek SEMUA sel dalam baris, bukan cuma sel pertama.
    const adaSelHeader = teksSel.some(t => /^(no\.?|pernyataan|statement|keterangan|benar|salah)$/i.test(t));
    if (adaSelHeader) return null;

    let text, answer;

    if (cells.length >= 4) {
      // 🔥 BARU: format "No | Pernyataan | Benar (centang) | Salah (centang)"
      // -- BUKAN 2 kolom seperti asumsi lama. Sebelumnya cells[0] (kolom
      // "No", isinya cuma angka urut 1/2/3) SALAH dibaca sebagai teks
      // pernyataan, dan cells[1] (pernyataan ASLI) malah dibaca sebagai
      // jawaban -- pernyataan yang tampil jadi "1", "2", "3" alih-alih
      // teks soal sungguhan. Sekarang: kolom ke-2 (index 1) yang dipakai
      // sebagai teks pernyataan, kolom ke-3 & ke-4 dicek centangnya untuk
      // tentukan jawaban Benar/Salah.
      text = teksSel[1];
      const benarDicentang = selBerisiCentang(cells[2]);
      const salahDicentang = selBerisiCentang(cells[3]);
      if (benarDicentang && !salahDicentang) answer = 'Benar';
      else if (salahDicentang && !benarDicentang) answer = 'Salah';
      // Kalau tabel checkbox-nya KOSONG (mis. lembar kerja siswa yang
      // belum diisi) -- coba data-jawaban di baris; kalau tetap tidak
      // ada, biarkan kosong (nanti bisa diisi dari kunci_jawaban gabungan
      // di normalizeSoal, lihat catatan di sana).
      else answer = safeString(row.getAttribute('data-jawaban') || '').trim();
    } else if (cells.length === 3) {
      // Format "Pernyataan | Benar (centang) | Salah (centang)" tanpa kolom No.
      text = teksSel[0];
      const benarDicentang = selBerisiCentang(cells[1]);
      const salahDicentang = selBerisiCentang(cells[2]);
      if (benarDicentang && !salahDicentang) answer = 'Benar';
      else if (salahDicentang && !benarDicentang) answer = 'Salah';
      else answer = safeString(row.getAttribute('data-jawaban') || '').trim();
    } else {
      // Format lama (2 kolom): Pernyataan | Jawaban langsung sebagai teks.
      text = teksSel[0];
      answer = safeString(row.getAttribute('data-jawaban') || teksSel[1]).trim();
    }

    if (!text) return null;
    return { teks: text, jawaban: answer };
  }).filter(Boolean);
}

function parseHTMLPairs(container) {
  if (!container) return [];
  return Array.from(container.querySelectorAll('tr')).map(row => {
    const cells = Array.from(row.querySelectorAll(':scope > th, :scope > td'));
    if (cells.length < 2) return null;
    const kiri = htmlNodeText(cells[0]);
    const kanan = htmlNodeText(cells[1]);
    if (!kiri && !kanan) return null;
    if (/^(kiri|pertanyaan)$/i.test(kiri) && /^(kanan|jawaban)$/i.test(kanan)) return null;
    return { kiri, kanan };
  }).filter(Boolean);
}

// ============================================================
// PERBAIKI TANDA < DAN > LIAR DARI LATEX SEBELUM DI-PARSE BROWSER
// ------------------------------------------------------------
// TEMUAN NYATA (soal pertidaksamaan/interval, mis. "$\{x|-1<x<4\}$"):
// tanda "<" dari LaTeX (bukan tag HTML) bikin DOMParser SALAH SANGKA
// itu awal tag baru -- sisa teks setelah "<" sampai ">" pertama yang
// ketemu TERTELAN DIAM-DIAM tanpa error. Terbukti lewat tes nyata:
// <li>$\{x|-1<x<4\}$</li> -> textContent cuma jadi "$\{x|-1", sisanya
// hilang. Ini genuinely soal < atau > mana yang BENERAN tag HTML dan
// mana yang cuma simbol matematika -- browser sendiri tidak bisa
// membedakan tanpa bantuan.
//
// Solusi: sebelum diserahkan ke DOMParser, pindai teks mentahnya
// sendiri -- "<" HANYA dibiarkan apa adanya kalau diikuti nama tag
// yang memang kita kenal (article, div, li, dst). Selain itu (termasuk
// "<x", "<4", "<-1") di-escape jadi "&lt;" supaya DOMParser membacanya
// sebagai teks biasa, bukan awal tag.
// ============================================================

const TAG_HTML_DIKENAL = [
  '!doctype', 'html', 'head', 'body', 'title', 'meta', 'article', 'div', 'span',
  'ol', 'ul', 'li', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'img',
  'p', 'br', 'b', 'i', 'em', 'strong', 'sub', 'sup', 'a',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
];

function escapeTandaKurungLiar(rawHtml) {
  const teks = safeString(rawHtml);
  const n = teks.length;
  let out = '';
  let i = 0;

  while (i < n) {
    const ch = teks[i];

    if (ch !== '<') { out += ch; i++; continue; }

    // Komentar HTML <!-- ... --> -- biarkan apa adanya
    if (teks.startsWith('<!--', i)) {
      const akhir = teks.indexOf('-->', i + 4);
      const berhenti = akhir === -1 ? n : akhir + 3;
      out += teks.slice(i, berhenti);
      i = berhenti;
      continue;
    }

    // Cek apakah ini AWALAN tag yang kita kenal: < atau </ + nama tag
    const cocok = /^<\/?([a-zA-Z!][a-zA-Z0-9]*)/.exec(teks.slice(i));
    const namaTag = cocok ? cocok[1].toLowerCase() : null;
    const tagDikenal = namaTag && TAG_HTML_DIKENAL.includes(namaTag);

    if (tagDikenal) {
      // Ini tag HTML asli -- salin utuh sampai '>' penutup tag,
      // hormati atribut dalam tanda kutip yang mungkin memuat '>'
      let j = i;
      let dalamKutip = null;
      while (j < n) {
        const c = teks[j];
        if (dalamKutip) {
          if (c === dalamKutip) dalamKutip = null;
        } else if (c === '"' || c === "'") {
          dalamKutip = c;
        } else if (c === '>') {
          j++;
          break;
        }
        j++;
      }
      out += teks.slice(i, j);
      i = j;
      continue;
    }

    // BUKAN tag dikenal -- ini "<" liar dari LaTeX (pertidaksamaan,
    // interval, dsb) -- escape supaya tidak dianggap awal tag.
    out += '&lt;';
    i++;
  }

  return out;
}

function parseHTMLMaster(raw) {
  const source = escapeTandaKurungLiar(safeString(raw));
  if (!source.trim()) throw new Error('File HTML Master kosong.');
  if (typeof DOMParser === 'undefined') throw new Error('Browser tidak mendukung pembacaan HTML Master.');

  const doc = new DOMParser().parseFromString(source, 'text/html');
  const nodes = Array.from(doc.querySelectorAll('[data-gemilang-question], article.gemilang-question, article[data-soal]'));
  if (!nodes.length) throw new Error('Tidak ditemukan soal. Setiap soal harus memakai <article data-gemilang-question>.');

  const getField = (node, ...names) => {
    for (const name of names) {
      const hit = node.querySelector(`[data-field="${name}"]`);
      if (hit) return hit;
    }
    return null;
  };

  // Beberapa AI (mis. saat soal dipisah tabel/gambar di tengah kalimat)
  // menulis LEBIH DARI SATU <div data-field="teks_soal"> dalam satu
  // <article> -- satu sebelum tabel/gambar, satu lagi sesudahnya berisi
  // kalimat pertanyaan yang sebenarnya. getField() di atas cuma ambil
  // yang PERTAMA lewat querySelector, jadi bagian pertanyaan setelah
  // tabel/gambar HILANG TOTAL tanpa pesan error apa pun. Fungsi ini
  // mengambil SEMUA elemen dengan nama field itu (bisa lintas alias
  // nama), lalu digabung urut sesuai posisi aslinya di dokumen.
  const getAllFieldsText = (node, ...names) => {
    const selector = names.map(name => `[data-field="${name}"]`).join(', ');
    const hits = Array.from(node.querySelectorAll(selector));
    return hits.map(el => htmlNodeText(el)).filter(Boolean).join(' ');
  };

  return nodes.map((node, index) => {
    const nomor = Number(node.getAttribute('data-nomor') || node.getAttribute('data-number')) || index + 1;
    const tipe = normalizeTipe(node.getAttribute('data-tipe') || node.getAttribute('data-type') || 'pg_sederhana');
    const teksSoalGabungan = getAllFieldsText(node, 'teks_soal', 'soal', 'question');
    const imageNode = getField(node, 'gambar', 'images', 'image');
    const bacaanNode = getField(node, 'bacaan', 'stimulus', 'reading');
    const optionsNode = getField(node, 'opsi_jawaban', 'options', 'choices');
    const explanationNode = getField(node, 'pembahasan', 'penjelasan', 'explanation');
    const keyNode = getField(node, 'kunci_jawaban', 'kunci', 'answer', 'correct-answer');
    const materialNode = getField(node, 'materi', 'topic', 'topik');
    // 🔥 BARU: tags per soal (opsional). Dulu Tags cuma bisa diisi lewat
    // form admin (1 nilai, diterapkan SAMA ke SEMUA soal dalam 1 batch
    // import) -- tidak konsisten dengan materi/kesulitan/kelas yang
    // sudah bisa beda-beda per soal lewat AI. Sekarang AI boleh isi
    // <div data-field="tags">hots, aljabar</div> per soal; nanti di
    // buildDoc digabung (bukan menimpa) dengan tags form admin.
    const tagsNode = getField(node, 'tags', 'tag', 'label');
    const capaianNode = getField(node, 'capaian_pembelajaran', 'capaian', 'learning-outcome');
    const sourceNode = getField(node, 'referensi_sumber', 'sumber', 'source');
    const tableQuestionNode = getField(node, 'tabel_soal', 'question-table', 'data-table');
    const tfNode = getField(node, 'pernyataan', 'true-false', 'benar-salah');
    const categoryNode = getField(node, 'tabel_benar_salah', 'category-table');
    const matchingNode = getField(node, 'pasangan', 'matching', 'pairs');

    const optionNodes = optionsNode
      ? Array.from(optionsNode.querySelectorAll(':scope > li, :scope > [data-option]'))
      : [];

    const opsi_jawaban = optionNodes.map(optionNode => {
      const images = parseHTMLImages(optionNode);
      const table = parseHTMLTableElement(optionNode.querySelector('table'));
      const teks = htmlNodeText(optionNode).replace(/\{\{\s*GAMBAR(?:_\d+)?\s*\}\}/gi, '').trim();
      return {
        teks,
        gambar: images,
        tabel: table ? normalizeTabel(table.baris.map((row, i) => ({ kolom: table.header[i] || `Kolom ${i + 1}`, isi: row.join(' | ') }))) : [],
      };
    }).filter(opt => !optionIsEmpty(opt));

    const bacaan = bacaanNode ? {
      teks: htmlNodeText(bacaanNode),
      gambar: parseHTMLImages(bacaanNode),
      // 🔥 BARU: penanda grup bacaan (mis. "bacaan_1") -- kalau beberapa
      // soal berbagi bacaan yang sama, mereka wajib punya nilai grup
      // yang SAMA. Ambil dari data-grup di elemen bacaan sendiri, atau
      // fallback ke data-grup di <article>-nya (2 tempat wajar untuk AI
      // menaruh atribut ini).
      grup: bacaanNode.getAttribute('data-grup') || node.getAttribute('data-grup') || '',
    } : null;
    const keyRaw = node.getAttribute('data-kunci') || keyNode?.getAttribute?.('data-value') || keyNode?.textContent || '';
    const tableSoal = tableQuestionNode ? parseHTMLTableElement(tableQuestionNode.querySelector('table') || tableQuestionNode) : null;
    const paketRaw = node.getAttribute('data-paket');

    // Analisis per-soal (bukan per-file): kesulitan WAJIB diisi AI per soal,
    // kelas OPSIONAL -- kalau AI tidak yakin, dibiarkan kosong di sini dan
    // buildDoc() akan otomatis pakai nilai dari form admin sebagai fallback.
    const kesulitanRaw = safeString(node.getAttribute('data-kesulitan') || node.getAttribute('data-tingkat-kesulitan')).toLowerCase().trim();
    const kelasRaw = safeString(node.getAttribute('data-kelas')).trim();

    return {
      nomor,
      paket: paketRaw ? (Number(paketRaw) || paketRaw) : null,
      tipe,
      bacaan,
      teks_soal: teksSoalGabungan,
      opsi_jawaban,
      kunci_jawaban: normalizeAnswerKey(keyRaw),
      pembahasan: htmlNodeText(explanationNode),
      pernyataan: parseHTMLStatements(tfNode),
      tabel_benar_salah: parseHTMLStatements(categoryNode),
      pasangan: parseHTMLPairs(matchingNode),
      gambar: parseHTMLImages(imageNode),
      tabel_soal: tableSoal,
      materi: htmlNodeText(materialNode),
      tags_soal: tagsNode ? htmlNodeText(tagsNode).split(',').map(t => t.trim()).filter(Boolean) : [],
      capaian_pembelajaran: htmlNodeText(capaianNode),
      tingkat_kesulitan: kesulitanRaw,
      kelas: kelasRaw,
      referensi_sumber: sourceNode ? { keterangan: htmlNodeText(sourceNode), halaman_pdf: Number(sourceNode.getAttribute('data-halaman')) || undefined } : null,
    };
  });
}

// ============================================================
// LATEX (.tex) PARSER v2
// ------------------------------------------------------------
// Parser struktural berbasis scanner karakter. Bagian yang memakai
// argumen {...} TIDAK diparse dengan regex non-greedy, karena LaTeX
// dapat memiliki kurung kurawal bersarang.
// ============================================================

function isEscapedTexChar(text, index) {
  let slashCount = 0;
  for (let i = index - 1; i >= 0 && text[i] === '\\'; i--) slashCount++;
  return slashCount % 2 === 1;
}

function stripTexComments(text) {
  return safeString(text).split('\n').map(line => {
    let out = '';
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '%' && !isEscapedTexChar(line, i)) break;
      out += line[i];
    }
    return out;
  }).join('\n');
}

function skipTexSpaces(text, index) {
  let i = index;
  while (i < text.length && /\s/.test(text[i])) i++;
  return i;
}

function readBalancedTex(text, openIndex, openChar = '{', closeChar = '}') {
  if (text[openIndex] !== openChar) return null;
  let depth = 0;
  for (let i = openIndex; i < text.length; i++) {
    if (text[i] === openChar && !isEscapedTexChar(text, i)) depth++;
    else if (text[i] === closeChar && !isEscapedTexChar(text, i)) {
      depth--;
      if (depth === 0) {
        return { value: text.slice(openIndex + 1, i), start: openIndex, end: i + 1 };
      }
    }
  }
  return null;
}

function readTexCommandAt(text, index) {
  if (text[index] !== '\\') return null;
  const match = /^\\([A-Za-z@]+|.)/.exec(text.slice(index));
  if (!match) return null;
  return { name: match[1], start: index, end: index + match[0].length };
}

function readTexCommandWithArgs(text, index) {
  const command = readTexCommandAt(text, index);
  if (!command) return null;
  let i = command.end;
  const optionalArgs = [];
  const requiredArgs = [];

  while (true) {
    i = skipTexSpaces(text, i);
    if (text[i] === '[') {
      const arg = readBalancedTex(text, i, '[', ']');
      if (!arg) break;
      optionalArgs.push(arg.value);
      i = arg.end;
      continue;
    }
    if (text[i] === '{') {
      const arg = readBalancedTex(text, i, '{', '}');
      if (!arg) break;
      requiredArgs.push(arg.value);
      i = arg.end;
      continue;
    }
    break;
  }

  return { ...command, end: i, optionalArgs, requiredArgs, full: text.slice(index, i) };
}

function findTexCommand(content, names, fromIndex = 0) {
  const wanted = new Set(names.map(name => name.toLowerCase()));
  for (let i = fromIndex; i < content.length; i++) {
    if (content[i] !== '\\' || isEscapedTexChar(content, i)) continue;
    const command = readTexCommandWithArgs(content, i);
    if (command && wanted.has(command.name.toLowerCase())) return command;
  }
  return null;
}

function findTexEnvironment(content, envNames, fromIndex = 0) {
  const wanted = new Set(envNames.map(name => name.toLowerCase()));
  for (let i = fromIndex; i < content.length; i++) {
    if (!content.startsWith('\\begin', i)) continue;
    const begin = readTexCommandWithArgs(content, i);
    const envName = safeString(begin?.requiredArgs?.[0]).trim();
    if (!begin || !wanted.has(envName.toLowerCase())) continue;

    let depth = 1;
    let cursor = begin.end;
    while (cursor < content.length) {
      const nextBegin = findTexCommand(content, ['begin'], cursor);
      const nextEnd = findTexCommand(content, ['end'], cursor);
      const next = [nextBegin, nextEnd].filter(Boolean).sort((a, b) => a.start - b.start)[0];
      if (!next) break;
      const nextName = safeString(next.requiredArgs?.[0]).trim().toLowerCase();
      if (nextName === envName.toLowerCase()) {
        if (next.name.toLowerCase() === 'begin') depth++;
        else depth--;
        if (depth === 0) {
          return {
            name: envName,
            start: begin.start,
            bodyStart: begin.end,
            bodyEnd: next.start,
            end: next.end,
            value: content.slice(begin.end, next.start),
            full: content.slice(begin.start, next.end),
            begin,
            endCommand: next,
          };
        }
      }
      cursor = next.end;
    }
  }
  return null;
}

function removeRanges(text, ranges) {
  return [...ranges].filter(Boolean).sort((a, b) => b.start - a.start)
    .reduce((result, range) => result.slice(0, range.start) + result.slice(range.end), text);
}

// Helper pemecah item pada satu environment. `source` dipisahkan dari env
// agar scanner tetap mengetahui batas absolut dan depth environment.
function splitTexEnvironmentItems(source, env) {
  if (!env) return [];
  const items = [];
  let current = null;
  let depth = 0;
  let i = env.bodyStart;

  while (i < env.bodyEnd) {
    if (source.startsWith('\\begin', i)) {
      const cmd = readTexCommandWithArgs(source, i);
      if (cmd) { depth++; i = cmd.end; continue; }
    }
    if (source.startsWith('\\end', i)) {
      const cmd = readTexCommandWithArgs(source, i);
      if (cmd) { depth = Math.max(0, depth - 1); i = cmd.end; continue; }
    }
    const cmdAtCursor = source[i] === '\\' ? readTexCommandWithArgs(source, i) : null;
    if (depth === 0 && cmdAtCursor && ['item', 'question', 'choice', 'correctchoice'].includes(cmdAtCursor.name.toLowerCase())) {
      const cmd = cmdAtCursor;
      if (current) items.push({ raw: source.slice(current.contentStart, i).trim(), start: current.start, end: i });
      const keepChoiceCommand = ['choice', 'correctchoice'].includes(cmd.name.toLowerCase());
      current = { start: i, contentStart: keepChoiceCommand ? i : cmd.end };
      i = current.contentStart;
      continue;
    }
    i++;
  }

  if (current) items.push({ raw: source.slice(current.contentStart, env.bodyEnd).trim(), start: current.start, end: env.bodyEnd });
  return items;
}

function findTopLevelQuestionEnvironment(source) {
  const candidates = ['enumerate', 'questions'];
  for (const name of candidates) {
    const env = findTexEnvironment(source, [name]);
    if (env) {
      const items = splitTexEnvironmentItems(source, env);
      if (items.length > 0) return { env, items };
    }
  }
  return null;
}

function splitByPlainNumbering(content) {
  const lines = content.split('\n');
  const blocks = [];
  let current = null;
  const numberRe = /^\s*(?:soal\s*)?(\d{1,4})\s*[.)]\s*(.*)$/i;
  lines.forEach(line => {
    const m = numberRe.exec(line);
    if (m) {
      if (current) blocks.push(current);
      current = { nomor: Number(m[1]), lines: [m[2]] };
    } else if (current) current.lines.push(line);
  });
  if (current) blocks.push(current);
  return blocks.map(block => ({ nomor: block.nomor, raw: block.lines.join('\n').trim() }));
}

function extractPlainOptions(content) {
  const optionRe = /(?:^|\n)\s*([A-Fa-f])[.)]\s+/g;
  const matches = [...content.matchAll(optionRe)];
  if (matches.length < 2) return { teksSoal: content, opsi: [] };
  const opsi = matches.map((m, index) => {
    const start = m.index + m[0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index : content.length;
    return content.slice(start, end).trim();
  });
  return { teksSoal: content.slice(0, matches[0].index).trim(), opsi };
}

function cleanTexText(text) {
  return safeString(text)
    .replace(/\\label\{[^{}]*\}/g, '')
    .replace(/\\(?:noindent|newpage|bigskip|medskip|smallskip)\b/g, '')
    .replace(/\\vspace\*?\{[^{}]*\}/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractTexCommandValue(content, ...commandNames) {
  const cmd = findTexCommand(content, commandNames);
  if (!cmd || !cmd.requiredArgs.length) return null;
  return { value: cmd.requiredArgs[0].trim(), full: cmd.full, start: cmd.start, end: cmd.end };
}

function extractTexEnvironmentValue(content, ...envNames) {
  const env = findTexEnvironment(content, envNames);
  if (!env) return null;
  return { value: env.value.trim(), full: env.full, start: env.start, end: env.end };
}

function extractAnswerKeyBlock(content) {
  const headingRe = /(kunci\s*jawaban|jawaban\s*benar|answer\s*key)/i;
  const match = headingRe.exec(content);
  if (!match) return {};
  const block = content.slice(match.index);
  const map = {};
  const pairRe = /(\d{1,4})\s*[.\-:)]\s*([A-Fa-f](?:\s*[,/+]\s*[A-Fa-f])*)\b/g;
  let m;
  while ((m = pairRe.exec(block)) !== null) {
    const keys = m[2].match(/[A-Fa-f]/g) || [];
    map[Number(m[1])] = keys.map(x => x.toUpperCase());
    if (map[Number(m[1])].length === 1) map[Number(m[1])] = map[Number(m[1])][0];
  }
  return map;
}

function extractTexImages(content) {
  const images = [];
  let cursor = 0;
  while (cursor < content.length) {
    const cmd = findTexCommand(content, ['includegraphics'], cursor);
    if (!cmd) break;
    const src = safeString(cmd.requiredArgs?.[0]).trim();
    if (src) images.push({ url: src, dataUrl: '', deskripsi: `Sumber gambar LaTeX: ${src}` });
    cursor = cmd.end;
  }
  return images;
}

function extractTexMetadata(content) {
  const materi = extractTexCommandValue(content, 'materi', 'topic', 'topik');
  const capaian = extractTexCommandValue(content, 'capaian', 'capaianpembelajaran', 'cp', 'learningoutcome');
  const sumber = extractTexCommandValue(content, 'sumber', 'source', 'referensi', 'halamanpdf');
  const customMeta = findTexCommand(content, ['meta']);

  const result = {
    materi: materi?.value || '',
    capaian_pembelajaran: capaian?.value || '',
    referensi_sumber: sumber?.value ? { keterangan: sumber.value } : null,
    ranges: [materi, capaian, sumber].filter(Boolean),
  };

  // Mendukung makro ringkas \meta{Materi}{Capaian}{CP resmi}.
  if (customMeta?.requiredArgs?.length >= 2) {
    result.materi = result.materi || safeString(customMeta.requiredArgs[0]).trim();
    result.capaian_pembelajaran = result.capaian_pembelajaran || safeString(customMeta.requiredArgs[1]).trim();
    if (customMeta.requiredArgs[2] && !result.referensi_sumber) {
      result.referensi_sumber = { keterangan: safeString(customMeta.requiredArgs[2]).trim() };
    }
    result.ranges.push(customMeta);
  }
  return result;
}

function normalizeChoiceCommand(item) {
  const correct = findTexCommand(item, ['correctchoice']);
  if (correct) return { text: correct.requiredArgs?.[0] || item.slice(correct.end).trim(), correct: true };
  const choice = findTexCommand(item, ['choice']);
  if (choice) return { text: choice.requiredArgs?.[0] || item.slice(choice.end).trim(), correct: false };
  return { text: item, correct: false };
}

function parseTrueFalseStatements(content) {
  const env = findTexEnvironment(content, ['benarsalah', 'truefalse', 'statements']);
  if (!env) return [];
  return splitTexEnvironmentItems(content, env).map(item => ({ teks: cleanTexText(item.raw), jawaban: '' })).filter(x => x.teks);
}

function parseMatchingPairs(content) {
  const env = findTexEnvironment(content, ['menjodohkan', 'matching', 'pairs']);
  if (!env) return [];
  return splitTexEnvironmentItems(content, env).map(item => {
    const sep = item.raw.split(/(?:\||&|\\to|:)/, 2);
    return { kiri: cleanTexText(sep[0]), kanan: cleanTexText(sep[1] || '') };
  }).filter(x => x.kiri || x.kanan);
}

function detectQuestionType(content, opsi, pernyataan, pasangan, kunci) {
  const typeCmd = extractTexCommandValue(content, 'tipe', 'type', 'jenissoal');
  if (typeCmd?.value) return normalizeTipe(typeCmd.value);
  if (pasangan.length) return 'menjodohkan';
  if (pernyataan.length) return 'benar_salah';
  if (Array.isArray(kunci) && kunci.length > 1) return 'pg_kompleks';
  if (opsi.length >= 2) return 'pg_sederhana';
  if (/\\(?:isian|shortanswer)\b/i.test(content)) return 'isian_singkat';
  return 'uraian';
}

function parseTeX(raw) {
  const text = safeString(raw);
  if (!text.trim()) throw new Error('File .tex kosong.');

  const source = stripTexComments(text);
  const answerKeyMap = extractAnswerKeyBlock(source);
  const docEnv = findTexEnvironment(source, ['document']);
  const body = docEnv ? docEnv.value : source;

  const questionList = findTopLevelQuestionEnvironment(body);
  let rawBlocks = questionList
    ? questionList.items.map((item, index) => ({ nomor: index + 1, raw: item.raw }))
    : splitByPlainNumbering(body);

  if (!rawBlocks.length) {
    throw new Error('Tidak ditemukan struktur soal di file .tex. Gunakan enumerate/questions dengan \\item atau penomoran biasa seperti "1.".');
  }

  return rawBlocks.map((block, index) => {
    let content = block.raw;
    const remove = [];
    const metadata = extractTexMetadata(content);
    remove.push(...metadata.ranges);

    const pembahasanCmd = extractTexCommandValue(content, 'pembahasan', 'penjelasan', 'solusi', 'solution');
    const pembahasanEnv = extractTexEnvironmentValue(content, 'pembahasan', 'penjelasan', 'solusi', 'solution');
    const pembahasanHit = pembahasanEnv || pembahasanCmd;
    const pembahasan = pembahasanHit ? pembahasanHit.value : '';
    if (pembahasanHit) remove.push(pembahasanHit);

    const kunciCmd = extractTexCommandValue(content, 'kunci', 'jawaban', 'answer', 'correctanswer');
    let kunciJawaban = kunciCmd ? normalizeAnswerKey(kunciCmd.value) : '';
    if (kunciCmd) remove.push(kunciCmd);

    const trueFalse = parseTrueFalseStatements(content);
    const matching = parseMatchingPairs(content);
    const optionEnv = findTexEnvironment(content, ['choices', 'oneparchoices', 'checkboxes', 'options', 'enumerate', 'itemize']);
    let opsiRaw = [];
    let correctIndexes = [];

    if (optionEnv) {
      const nested = splitTexEnvironmentItems(content, optionEnv);
      if (nested.length >= 2) {
        opsiRaw = nested.map(item => normalizeChoiceCommand(item.raw));
        correctIndexes = opsiRaw.map((x, i) => x.correct ? i : -1).filter(i => i >= 0);
        remove.push(optionEnv);
      }
    }

    let remaining = removeRanges(content, remove);
    if (!opsiRaw.length) {
      const plain = extractPlainOptions(remaining);
      if (plain.opsi.length >= 2) {
        remaining = plain.teksSoal;
        opsiRaw = plain.opsi.map(text => ({ text, correct: false }));
      }
    }

    if (!kunciJawaban && correctIndexes.length) {
      kunciJawaban = correctIndexes.map(i => String.fromCharCode(65 + i));
      if (kunciJawaban.length === 1) kunciJawaban = kunciJawaban[0];
    }
    if (!kunciJawaban && answerKeyMap[block.nomor]) kunciJawaban = answerKeyMap[block.nomor];

    const opsiJawaban = opsiRaw.map(item => cleanTexText(item.text || item)).filter(Boolean);
    const gambar = extractTexImages(content);
    const tipe = detectQuestionType(content, opsiJawaban, trueFalse, matching, kunciJawaban);

    return {
      nomor: block.nomor || index + 1,
      tipe,
      teks_soal: cleanTexText(remaining),
      opsi_jawaban: opsiJawaban,
      kunci_jawaban: kunciJawaban,
      pembahasan: cleanTexText(pembahasan),
      gambar,
      pernyataan: trueFalse,
      tabel_benar_salah: [],
      pasangan: matching,
      materi: metadata.materi,
      capaian_pembelajaran: metadata.capaian_pembelajaran,
      referensi_sumber: metadata.referensi_sumber,
    };
  });
}

// IMAGE SRC
// ============================================================

function getImageSrc(gambar) {
  if (!gambar) return '';
  return gambar.uploadedUrl || gambar.url || gambar.dataUrl || '';
}

// ============================================================
// VALIDASI GAMBAR BENERAN (bukan cuma cek "ada isinya")
// ------------------------------------------------------------
// Ditemukan kasus nyata: AI (DeepSeek) kadang menempelkan base64 yang
// KELIHATAN valid (signature PNG benar, panjang wajar) tapi datanya di
// tengah rusak/palsu -- gagal dimuat browser sama sekali. Fungsi di
// bawah ini benar-benar MENCOBA MEMUAT gambarnya lewat Image(), bukan
// cuma mengecek field-nya terisi atau tidak.
// ============================================================

function kunciGambar(soalIdx, location, imageIndex) {
  const lokasiStr = typeof location === 'string' ? location : `opsi-${location.opsi}`;
  return `${soalIdx}|${lokasiStr}|${imageIndex}`;
}

// Kumpulkan SEMUA referensi gambar dari SELURUH daftar soal (bukan cuma
// 1 soal) -- dipakai untuk validasi massal sekali jalan setelah parse.
function kumpulkanSemuaGambar(soalList) {
  const hasil = [];
  soalList.forEach((q) => {
    safeArray(q.gambar).forEach((img, i) => {
      hasil.push({ key: kunciGambar(q._idx, 'soal', i), src: getImageSrc(img) });
    });
    if (q.bacaan) {
      safeArray(q.bacaan.gambar).forEach((img, i) => {
        hasil.push({ key: kunciGambar(q._idx, 'bacaan', i), src: getImageSrc(img) });
      });
    }
    safeArray(q.opsi_jawaban).forEach((opt, oi) => {
      safeArray(opt.gambar).forEach((img, i) => {
        hasil.push({ key: kunciGambar(q._idx, { opsi: oi }, i), src: getImageSrc(img) });
      });
    });
  });
  return hasil;
}

// Coba muat 1 gambar lewat elemen Image() asli -- ini satu-satunya cara
// yang benar-benar diandalkan untuk tahu apakah data base64/URL-nya
// bisa ditampilkan browser atau tidak (bukan sekadar tebak-tebakan dari
// panjang string atau format header).
function cobaMuatGambar(src, timeoutMs = 6000) {
  return new Promise((resolve) => {
    if (!src) { resolve(false); return; }
    const img = new Image();
    let selesai = false;
    const finish = (ok) => { if (!selesai) { selesai = true; resolve(ok); } };
    if (!src.startsWith('data:')) img.crossOrigin = 'anonymous';
    img.onload = () => finish(true);
    img.onerror = () => finish(false);
    img.src = src;
    setTimeout(() => finish(false), timeoutMs);
  });
}

// ============================================================
// SAFE LATEX LOADER
// ============================================================

function useSafeKaTeX() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    try {
      if (typeof window !== 'undefined' && window.katex) {
        setReady(true);
        return undefined;
      }

      const existingCss = document.querySelector('link[data-gemilang-katex]');
      if (!existingCss) {
        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css';
        css.dataset.gemilangKatex = 'true';
        document.head.appendChild(css);
      }

      const existingScript = document.querySelector('script[data-gemilang-katex]');
      if (existingScript) {
        existingScript.addEventListener('load', () => {
          if (!cancelled && window.katex) setReady(true);
        });
        return () => { cancelled = true; };
      }

      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js';
      script.async = true;
      script.dataset.gemilangKatex = 'true';
      script.onload = () => { if (!cancelled && window.katex) setReady(true); };
      script.onerror = () => { if (!cancelled) setReady(false); };
      document.body.appendChild(script);
    } catch (_) {
      if (!cancelled) setReady(false);
    }

    return () => { cancelled = true; };
  }, []);

  return ready;
}

// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHtml(value) {
  return safeString(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ============================================================
// INLINE MATH
// ============================================================

function renderTextWithMath(text, mathReady) {
  const value = safeString(text);
  if (!value) return '';

  const katex = mathReady && typeof window !== 'undefined' && window.katex ? window.katex : null;

  const renderMath = (math, displayMode) => {
    if (katex) {
      try {
        return katex.renderToString(math, { displayMode, throwOnError: false, output: 'html' });
      } catch (_) {
        return `<span class="math-fallback">${escapeHtml(math)}</span>`;
      }
    }
    return `<span class="math-fallback">${escapeHtml(math)}</span>`;
  };

  let output = '';
  let i = 0;

  while (i < value.length) {
    if (value[i] === '$' && value[i + 1] === '$') {
      const end = value.indexOf('$$', i + 2);
      if (end >= 0) { output += renderMath(value.slice(i + 2, end), true); i = end + 2; continue; }
    }

    if (value[i] === '\\' && value[i + 1] === '(') {
      const end = value.indexOf('\\)', i + 2);
      if (end >= 0) { output += renderMath(value.slice(i + 2, end), false); i = end + 2; continue; }
    }

    if (value[i] === '\\' && value[i + 1] === '[') {
      const end = value.indexOf('\\]', i + 2);
      if (end >= 0) { output += renderMath(value.slice(i + 2, end), true); i = end + 2; continue; }
    }

    if (value[i] === '$') {
      const end = value.indexOf('$', i + 1);
      if (end > i + 1) { output += renderMath(value.slice(i + 1, end), false); i = end + 1; continue; }
    }

    output += escapeHtml(value[i]);
    i++;
  }

  return output.replace(/\n/g, '<br/>');
}

// ============================================================
// IMAGE BLOCK (dipakai di RichText & opsi)
// ============================================================

function imageFigureHtml(image) {
  const src = getImageSrc(image);

  if (!src) {
    return `
      <div style="padding:8px;margin:8px 0;border:1px dashed #f59e0b;border-radius:8px;color:#b45309;font-size:12px;background:#fffbeb;">
        🖼️ Gambar belum memiliki URL/data gambar.
      </div>
    `;
  }

  return `
    <figure style="margin:12px 0;width:100%;">
      <img
        src="${escapeHtml(src)}"
        alt="${escapeHtml(image.deskripsi || 'Gambar soal')}"
        style="display:block;max-width:100%;max-height:500px;width:auto;height:auto;object-fit:contain;border:1px solid #e5e7eb;border-radius:10px;background:#fff;padding:4px;margin:0 auto;"
      />
      ${image.deskripsi ? `<figcaption style="font-size:11px;color:#6b7280;margin-top:4px;text-align:center;">${escapeHtml(image.deskripsi)}</figcaption>` : ''}
    </figure>
  `;
}

// ============================================================
// RICH TEXT
// ============================================================

function RichText({ text, gambar = [], mathReady }) {
  const html = useMemo(() => {
    const safe = safeString(text);
    if (!safe) return '';

    const images = safeArray(gambar);
    const parts = safe.split(/(\{\{\s*GAMBAR(?:_\d+)?\s*\}\})/gi);

    let imageIndex = 0;
    let result = '';

    for (const part of parts) {
      if (/^\{\{\s*GAMBAR/i.test(part)) {
        const image = images[imageIndex];
        imageIndex++;
        if (image) result += imageFigureHtml(image);
      } else {
        result += renderTextWithMath(part, mathReady);
      }
    }

    // Jika ada gambar tapi tidak ada placeholder sama sekali, tampilkan di akhir.
    if (imageIndex === 0 && images.some(image => getImageSrc(image))) {
      result += '<div style="margin-top:10px;">';
      images.forEach(image => {
        if (getImageSrc(image)) result += imageFigureHtml(image);
      });
      result += '</div>';
    }

    return result;
  }, [text, gambar, mathReady]);

  return (
    <div
      style={{ fontSize: '14px', color: '#374151', lineHeight: '1.75rem', overflowWrap: 'break-word' }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// ============================================================
// OPTION TABLE (untuk opsi berbentuk tabel, mis. perbandingan 2 kolom)
// ============================================================

function OptionTable({ rows }) {
  if (!safeArray(rows).length) return null;

  return (
    <div style={{ marginTop: '8px', borderRadius: '8px', border: '1px solid #e5e7eb', borderColor: '#e5e7eb', overflow: 'hidden', backgroundColor: '#ffffff' }}>
      {rows.map((row, i) => (
        <div
          key={i}
          style={{
            display: 'grid',
            gridTemplateColumns: '100px 1fr',
            fontSize: '12px',
            borderTop: i > 0 ? '1px solid #f3f4f6' : 'none',
          }}
        >
          <div style={{ paddingLeft: '8px', paddingRight: '8px', paddingTop: '6px', paddingBottom: '6px', backgroundColor: '#f9fafb', fontWeight: '600', color: '#4b5563' }}>
            {row.kolom || `Baris ${i + 1}`}
          </div>
          <div style={{ paddingLeft: '8px', paddingRight: '8px', paddingTop: '6px', paddingBottom: '6px', color: '#374151' }}>{row.isi}</div>
        </div>
      ))}
    </div>
  );
}

function QuestionTable({ table, mathReady }) {
  const header = safeArray(table?.header || table?.headers || table?.kolom);
  const rows = safeArray(table?.baris || table?.rows || table?.data);
  if (!header.length && !rows.length) return null;

  return (
    <div style={{ marginTop: '12px', overflowX: 'auto', border: '1px solid #d1d5db', borderRadius: '10px', background: '#fff' }}>
      <table style={{ width: '100%', minWidth: '360px', borderCollapse: 'collapse', fontSize: '13px' }}>
        {header.length > 0 && (
          <thead>
            <tr>{header.map((cell, index) => <th key={index} style={{ padding: '9px 10px', textAlign: 'left', background: '#f3f4f6', borderBottom: '1px solid #d1d5db' }}><RichText text={safeString(cell)} gambar={[]} mathReady={mathReady} /></th>)}</tr>
          </thead>
        )}
        <tbody>
          {rows.map((row, rowIndex) => {
            const cells = Array.isArray(row) ? row : Object.values(row || {});
            return <tr key={rowIndex}>{cells.map((cell, cellIndex) => <td key={cellIndex} style={{ padding: '8px 10px', verticalAlign: 'top', borderTop: rowIndex > 0 ? '1px solid #e5e7eb' : 'none' }}><RichText text={safeString(cell)} gambar={[]} mathReady={mathReady} /></td>)}</tr>;
          })}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// OPTION LETTER
// ============================================================

function optionLetter(index) {
  return String.fromCharCode(65 + index);
}

// ============================================================
// IMAGE CROP MODAL (crop manual pakai canvas, tanpa library tambahan)
// ============================================================

function ImageCropModal({ src, onCancel, onSave }) {
  const [imgEl, setImgEl] = useState(null);
  const [displaySize, setDisplaySize] = useState({ w: 0, h: 0 });
  const [rect, setRect] = useState(null); // {x,y,w,h} dalam koordinat tampilan
  const [dragStart, setDragStart] = useState(null);
  const containerRef = React.useRef(null);

  useEffect(() => {
    const img = new Image();
    // Skip crossOrigin untuk data: URI (base64) -- tidak perlu dan
    // pada beberapa kasus base64 hasil AI yang datanya korup, pesan
    // error CORS jadi membingungkan padahal masalah sebenarnya adalah
    // datanya sendiri rusak/palsu, bukan soal CORS sama sekali.
    if (!src.startsWith('data:')) img.crossOrigin = 'anonymous';
    img.onload = () => {
      const maxW = 640;
      const scale = img.naturalWidth > maxW ? maxW / img.naturalWidth : 1;
      setDisplaySize({ w: img.naturalWidth * scale, h: img.naturalHeight * scale });
      setImgEl(img);
    };
    img.onerror = () => {
      // 🔥 BARU: pesan diperjelas -- kasus paling sering ternyata BUKAN
      // CORS, tapi data base64 dari AI yang kelihatan valid (signature
      // benar) tapi isinya korup/palsu di tengah, jadi browser menolak
      // memuatnya sama sekali. Sarankan langsung ke solusi: upload manual.
      alert(
        'Gambar ini gagal dimuat browser -- kemungkinan besar data gambar dari hasil scan AI rusak/palsu ' +
        '(bukan gambar asli), bukan soal CORS. Gunakan tombol "Upload Gambar Manual" di bawah untuk ' +
        'mengganti dengan file gambar asli dari komputer kamu.'
      );
      onCancel();
    };
    img.src = src;
  }, [src]);

  const handleMouseDown = e => {
    const bounds = containerRef.current.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const y = e.clientY - bounds.top;
    setDragStart({ x, y });
    setRect({ x, y, w: 0, h: 0 });
  };

  const handleMouseMove = e => {
    if (!dragStart) return;
    const bounds = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(displaySize.w, e.clientX - bounds.left));
    const y = Math.max(0, Math.min(displaySize.h, e.clientY - bounds.top));
    setRect({
      x: Math.min(dragStart.x, x),
      y: Math.min(dragStart.y, y),
      w: Math.abs(x - dragStart.x),
      h: Math.abs(y - dragStart.y),
    });
  };

  const handleMouseUp = () => setDragStart(null);

  const handleSave = () => {
    if (!imgEl || !rect || rect.w < 5 || rect.h < 5) {
      alert('Tarik dulu kotak crop di atas gambar (drag mouse).');
      return;
    }

    const scaleX = imgEl.naturalWidth / displaySize.w;
    const scaleY = imgEl.naturalHeight / displaySize.h;

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(rect.w * scaleX);
    canvas.height = Math.round(rect.h * scaleY);

    const ctx = canvas.getContext('2d');
    ctx.drawImage(
      imgEl,
      rect.x * scaleX, rect.y * scaleY, rect.w * scaleX, rect.h * scaleY,
      0, 0, canvas.width, canvas.height,
    );

    onSave(canvas.toDataURL('image/png'));
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        padding: '20px', boxSizing: 'border-box',
      }}
    >
      {/* Kartu modal: tinggi DIBATASI ke viewport (maxHeight 90vh) supaya
          gambar hasil crop (mis. screenshot 1 halaman PDF yang tinggi)
          tidak bikin modal lebih panjang dari layar. Dibagi 2 bagian
          pakai flex column: (1) area scroll berisi gambar, (2) footer
          tombol yang TIDAK ikut scroll -- selalu kelihatan di bawah,
          seberapa pun tinggi gambarnya. */}
      <div style={{
        backgroundColor: '#ffffff', borderRadius: '16px', maxWidth: '90vw',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Area scroll: judul + instruksi + kotak crop gambar */}
        <div style={{ padding: '20px 20px 0 20px', overflowY: 'auto', flex: '1 1 auto', minHeight: 0 }}>
          <div style={{ fontWeight: '700', marginBottom: '4px', color: '#1f2937' }}>✂️ Crop Gambar</div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>
            Tarik (drag) mouse di atas gambar untuk memilih area yang mau dipakai.
          </div>

          {!imgEl && <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Memuat gambar...</div>}

          {imgEl && (
            <div
              ref={containerRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{
                position: 'relative', width: displaySize.w, height: displaySize.h,
                backgroundImage: `url(${src})`, backgroundSize: 'cover',
                cursor: 'crosshair', userSelect: 'none', border: '1px solid #e5e7eb',
                marginBottom: '20px',
              }}
            >
              {rect && (
                <div
                  style={{
                    position: 'absolute', left: rect.x, top: rect.y, width: rect.w, height: rect.h,
                    border: '2px dashed #2563eb', backgroundColor: 'rgba(37,99,235,0.15)',
                  }}
                />
              )}
            </div>
          )}
        </div>

        {/* Footer tombol -- di LUAR area scroll, jadi selalu nempel di
            bawah kartu modal, tidak peduli seberapa tinggi gambarnya. */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: '8px',
          padding: '14px 20px', borderTop: '1px solid #e5e7eb',
          backgroundColor: '#ffffff', flexShrink: 0,
        }}>
          <button
            type="button"
            onClick={onCancel}
            style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#ffffff', cursor: 'pointer' }}
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#2563eb', color: '#ffffff', fontWeight: '700', cursor: 'pointer' }}
          >
            Simpan Crop
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// IMAGE WITH CROP (thumbnail + tombol crop, dipakai di panel "Kelola Gambar")
// ============================================================

// 🔥 BARU: upload gambar manual dari komputer admin (bukan dari AI).
// Dipakai sebagai jalan keluar utama waktu AI (DeepSeek dkk) gagal
// menyertakan gambar asli -- baik yang kosong (dummy 1x1) maupun yang
// base64-nya kelihatan valid tapi ternyata korup/palsu.
function TombolUploadManual({ onUploaded, label = '📤 Upload Manual' }) {
  const inputRef = React.useRef(null);
  const [busy, setBusy] = useState(false);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar (PNG/JPG/dll).');
      return;
    }
    setBusy(true);
    const reader = new FileReader();
    reader.onload = () => { setBusy(false); onUploaded(reader.result); };
    reader.onerror = () => { setBusy(false); alert('Gagal membaca file gambar.'); };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        style={{
          fontSize: '11px', padding: '4px 8px', borderRadius: '6px',
          border: '1px solid #2563eb', backgroundColor: '#eff6ff', color: '#1d4ed8',
          cursor: busy ? 'default' : 'pointer', fontWeight: '700',
        }}
      >
        {busy ? '⏳...' : label}
      </button>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
    </>
  );
}

function ImageWithCrop({ image, onCropped, status }) {
  const [cropping, setCropping] = useState(false);
  const src = getImageSrc(image);

  // status: 'checking' | 'ok' | 'broken' | undefined (belum divalidasi)
  const rusak = status === 'broken';

  return (
    <div style={{
      display: 'inline-flex', flexDirection: 'column', gap: '4px',
      marginRight: '10px', marginBottom: '10px', padding: '6px',
      borderRadius: '10px', border: rusak ? '2px solid #ef4444' : '1px solid transparent',
      backgroundColor: rusak ? '#fef2f2' : 'transparent',
    }}>
      {rusak ? (
        <div style={{
          width: '120px', height: '90px', borderRadius: '8px', border: '1px dashed #ef4444',
          backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', padding: '4px', fontSize: '10px', color: '#b91c1c', fontWeight: '700',
        }}>
          ❌ Gambar rusak/palsu dari AI
        </div>
      ) : src ? (
        <img
          src={src}
          alt={image.deskripsi || 'Gambar'}
          style={{ width: '120px', height: '90px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb' }}
        />
      ) : (
        <div style={{
          width: '120px', height: '90px', borderRadius: '8px', border: '1px dashed #d1d5db',
          backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', padding: '4px', fontSize: '10px', color: '#9ca3af', fontWeight: '700',
        }}>
          ⬜ Belum ada gambar
        </div>
      )}

      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {!rusak && src && (
          <button
            type="button"
            onClick={() => setCropping(true)}
            style={{
              fontSize: '11px', padding: '4px 8px', borderRadius: '6px',
              border: '1px solid #d1d5db', backgroundColor: '#ffffff', cursor: 'pointer',
            }}
          >
            ✂️ Crop
          </button>
        )}
        <TombolUploadManual
          onUploaded={onCropped}
          label={rusak || !src ? '📤 Upload Gambar Asli' : '📤 Ganti'}
        />
      </div>

      {cropping && (
        <ImageCropModal
          src={src}
          onCancel={() => setCropping(false)}
          onSave={newDataUrl => { setCropping(false); onCropped(newDataUrl); }}
        />
      )}
    </div>
  );
}

// ============================================================
// FIRESTORE DOCUMENT
// ============================================================

function opsiToPlainForFirestore(opsi) {
  return safeArray(opsi).map(opt => ({
    teks: opt.teks || '',
    gambar: safeArray(opt.gambar).map(image => ({
      id: image.id,
      url: image.url,
      uploadedUrl: image.uploadedUrl,
      deskripsi: image.deskripsi,
      nomor: image.nomor,
    })),
    tabel: opt.tabel || [],
  }));
}

function buildDoc(q, meta) {
  const gambarUrls = safeArray(q.gambar).map(image => image.uploadedUrl || image.url || '').filter(Boolean);

  const bacaan = q.bacaan
    ? {
        teks: q.bacaan.teks || '',
        gambar: safeArray(q.bacaan.gambar).map(image => ({
          id: image.id,
          url: image.url,
          uploadedUrl: image.uploadedUrl,
          deskripsi: image.deskripsi,
          nomor: image.nomor,
        })),
      }
    : null;

  return {
    nomor: q.nomor,
    paket: q.paket ?? null,
    paketNama: q.paketMeta?.nama || null,
    bacaan,
    soal: q.teks_soal,
    tipe: q.tipe,
    opsiJawaban: opsiToPlainForFirestore(q.opsi_jawaban),
    opsiBenar: q.opsi_benar,
    pernyataan: q.pernyataan,
    tabelBenarSalah: q.tabel_benar_salah,
    pasangan: q.pasangan,
    kunciJawaban: q.kunci_jawaban,
    jawabanEkuivalen: q.jawaban_ekuivalen || [],
    satuanJawaban: q.satuan_jawaban || '',
    toleransiJawaban: q.toleransi_jawaban ?? null,
    kunciTerverifikasi: q.kunci_terverifikasi,
    pembahasan: q.pembahasan,
    catatanAdmin: q.catatan_admin || '',
    gambarUrls,
    tabelSoal: amankanTabelDariNestedArray(q.tabel_soal) || null,
    referensiSumber: q.referensi_sumber || null,
    materi: q.materi || '',
    capaianPembelajaran: q.capaian_pembelajaran || '',
    mataPelajaran: meta.mataPelajaran,
    // Kelas & kesulitan: pakai hasil analisis AI PER SOAL kalau ada dan
    // valid; kalau AI tidak mengisi/tidak yakin (dikosongkan di
    // normalizeSoal), baru pakai nilai form admin sebagai fallback. Ini
    // supaya kelas/kesulitan tidak sekadar diseragamkan 1 nilai untuk
    // semua soal dalam satu file yang diupload.
    tingkatKelas: q.kelas_soal && DAFTAR_KELAS.includes(q.kelas_soal) ? q.kelas_soal : meta.tingkatKelas,
    jenjang: meta.jenjang,
    jenisUjian: meta.jenisUjian || '',
    sumberSoalId: meta.folderId || null,
    kategori: meta.kategori,
    // 🔥 BERUBAH: dulu tags = meta.tags doang (1 nilai form, sama rata
    // ke semua soal). Sekarang DIGABUNG dengan tags_soal (per soal,
    // opsional dari AI) -- union, bukan override, karena tags sifatnya
    // boleh banyak & saling melengkapi (mis. tags form "TKA, 2026" +
    // tags soal "hots, aljabar" -> soal itu punya keempat-empatnya).
    tags: [...new Set([...(meta.tags || []), ...(q.tags_soal || [])])],
    tingkatKesulitan: q.tingkat_kesulitan_soal || meta.tingkatKesulitan,
    tingkatKesulitanSumber: q.tingkat_kesulitan_soal ? 'ai_per_soal' : 'form_admin',
    tingkatKelasSumber: (q.kelas_soal && DAFTAR_KELAS.includes(q.kelas_soal)) ? 'ai_per_soal' : 'form_admin',
    sumberFile: meta.sumberFile,
    sumberAI: meta.sumberAI,
    createdAt: serverTimestamp(),
    createdBy: auth.currentUser?.uid || null,
    status: 'aktif',
  };
}

// ============================================================
// DOWNLOAD JSON
// ============================================================

function downloadJSON(soalList) {
  try {
    const payload = soalList.map(q => ({
      nomor: q.nomor,
      paket: q.paket ?? null,
      tipe: q.tipe,
      bacaan: q.bacaan,
      teks_soal: q.teks_soal,
      opsi_jawaban: q.opsi_jawaban,
      opsi_benar: q.opsi_benar,
      kunci_jawaban: q.kunci_jawaban,
      jawaban_ekuivalen: q.jawaban_ekuivalen || [],
      satuan_jawaban: q.satuan_jawaban || '',
      toleransi_jawaban: q.toleransi_jawaban ?? null,
      kunci_terverifikasi: q.kunci_terverifikasi,
      pembahasan: q.pembahasan,
      pernyataan: q.pernyataan,
      tabel_benar_salah: q.tabel_benar_salah,
      pasangan: q.pasangan,
      materi: q.materi,
      capaian_pembelajaran: q.capaian_pembelajaran,
      gambar: q.gambar.map(image => ({
        id: image.id,
        url: image.url,
        dataUrl: image.dataUrl,
        uploadedUrl: image.uploadedUrl,
        deskripsi: image.deskripsi,
        nomor: image.nomor,
      })),
      tabel_soal: q.tabel_soal || null,
      referensi_sumber: q.referensi_sumber || null,
    }));

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `hasil-scan-gemilang-${Date.now()}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download JSON error:', error);
    alert('Gagal membuat file JSON.');
  }
}

// ============================================================
// DOWNLOAD HTML MASTER — backup portable dengan gambar embedded
// ============================================================

function downloadHTMLMaster(soalList) {
  try {
    const esc = value => escapeHtml(value);
    const renderImages = images => safeArray(images).map(image => {
      const src = getImageSrc(image);
      return src ? `<img src="${esc(src)}" alt="${esc(image.deskripsi || 'Gambar soal')}" data-id="${esc(image.id || '')}" />` : '';
    }).join('\n');

    const questionHTML = safeArray(soalList).map(q => {
      const options = safeArray(q.opsi_jawaban).map(opt => `<li>${esc(opt.teks || '')}${renderImages(opt.gambar)}</li>`).join('\n');
      const images = renderImages(q.gambar);
      const key = Array.isArray(q.kunci_jawaban) ? q.kunci_jawaban.join(',') : (q.kunci_jawaban || '');
      return `<article data-gemilang-question data-nomor="${Number(q.nomor) || 0}" data-tipe="${esc(q.tipe || 'pg_sederhana')}"${q.paket != null ? ` data-paket="${esc(q.paket)}"` : ''}>
<div data-field="materi">${esc(q.materi || '')}</div>
<div data-field="capaian_pembelajaran">${esc(q.capaian_pembelajaran || '')}</div>
<div data-field="teks_soal">${esc(q.teks_soal || '')}</div>
${images ? `<div data-field="gambar">${images}</div>` : ''}
${options ? `<ol data-field="opsi_jawaban">${options}</ol>` : ''}
<meta data-field="kunci_jawaban" data-value="${esc(key)}" />
<div data-field="pembahasan">${esc(q.pembahasan || '')}</div>
</article>`;
    }).join('\n\n');

    const html = `<!doctype html>\n<html lang="id">\n<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Gemilang - HTML Master</title></head>\n<body>${questionHTML}\n</body>\n</html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `bank-soal-gemilang-master-${Date.now()}.html`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download HTML Master error:', error);
    alert('Gagal membuat HTML Master.');
  }
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function ImportHasilScanPage() {
  const mathReady = useSafeKaTeX();

  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false,
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [format, setFormat] = useState('html'); // default HTML Master -- lihat catatan di bawah
  const [rawInput, setRawInput] = useState('');
  const [sumberAI, setSumberAI] = useState('Gemini Canvas');

  const [soalList, setSoalList] = useState([]);
  const [parseError, setParseError] = useState('');
  const [warnings, setWarnings] = useState([]);

  // 🔥 BARU: status validasi gambar -- key unik per gambar (lihat
  // buatKunciGambar()), value: 'checking' | 'ok' | 'broken'. Diisi
  // otomatis lewat validasiSemuaGambar() setiap kali soalList berubah
  // (habis parse, habis crop, habis upload manual). INI YANG MENJAWAB
  // masalah "gambar dari AI kelihatan ada tapi ternyata rusak/palsu" --
  // sekarang dicek beneran bisa dimuat browser atau tidak, bukan cuma
  // dicek "ada isinya atau kosong".
  const [imageStatus, setImageStatus] = useState({});

  const [mataPelajaran, setMataPelajaran] = useState('');
  const [tingkatKelas, setTingkatKelas] = useState('');
  const [jenjang, setJenjang] = useState('');
  // 🔥 BARU: pembeda jenis ujian -- TANPA ini, "TKA Bahasa Indonesia
  // SMP kelas 8" dan "Ulangan Harian Bahasa Indonesia SMP kelas 8"
  // punya metadata IDENTIK di database, tidak bisa dibedakan sama
  // sekali saat nanti dicari/difilter di TerbitkanKuisPage.
  const [jenisUjian, setJenisUjian] = useState('');
  const [kategori, setKategori] = useState('');
  const [tags, setTags] = useState('');
  const [tingkatKesulitan, setTingkatKesulitan] = useState('sedang');
  const [sumberFile, setSumberFile] = useState('');

  // 🔥 BARU: FOLDER SUMBER (sumber_soal) -- 1 folder = 1 buku/PDF asal.
  // Kenapa ini penting: (1) jenjang/kelas TIDAK VALID sebagai pengelompok
  // utama untuk SNBT/TKA (soalnya lintas kelas/jenjang), lebih masuk
  // akal dikelompokkan per BUKU SUMBER + bab/materi di dalamnya; (2)
  // kalau besok admin lanjut scan halaman lain dari PDF YANG SAMA,
  // tinggal pilih folder yang sudah ada (bukan bikin baru / isi ulang
  // metadata dari nol) -- soal baru otomatis "menyambung" ke folder
  // yang sama; (3) metadata (mapel/jenisUjian/jenjang) nempel di
  // FOLDER, diwariskan ke semua soal di dalamnya -- akar penyebab bug
  // "Kelas 10 nyangkut" (metadata diketik ulang tiap sesi, gampang lupa
  // diganti) jadi hilang karena cukup diisi SEKALI saat folder dibuat.
  const [daftarFolder, setDaftarFolder] = useState([]);
  const [folderAktif, setFolderAktif] = useState(null); // { id, judul, coverUrl, mataPelajaran, jenisUjian, jenjang }
  const [modeFolder, setModeFolder] = useState('pilih'); // 'pilih' | 'baru'
  const [judulFolderBaru, setJudulFolderBaru] = useState('');
  const [coverFolderBaru, setCoverFolderBaru] = useState('');
  const [membuatFolder, setMembuatFolder] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, 'sumber_soal'), orderBy('createdAt', 'desc')));
        setDaftarFolder(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error('Gagal ambil daftar folder sumber:', e);
      }
    })();
  }, []);

  const pilihFolder = useCallback((folder) => {
    setFolderAktif(folder);
    // Metadata IKUT folder -- ini yang mencegah admin lupa ganti/isi
    // ulang tiap sesi import (akar bug "Kelas 10 nyangkut" kemarin).
    setMataPelajaran(folder.mataPelajaran || '');
    setJenisUjian(folder.jenisUjian || '');
    setJenjang(folder.jenjang || '');
  }, []);

  // 🔥 BARU: hapus folder langsung dari panel ini -- supaya folder
  // percobaan/salah tidak numpuk terus. Sama seperti di TerbitkanKuisPage:
  // admin pilih mau ikut hapus soal di dalamnya atau cuma lepas foldernya
  // (soal tetap disimpan, cuma lepas kaitan sumberSoalId).
  const [menghapusFolder, setMenghapusFolder] = useState(null);

  const hapusFolderDariImport = useCallback(async (folder, ikutHapusSoal) => {
    setMenghapusFolder(folder.id);
    try {
      const snap = await getDocs(query(collection(db, 'bank_soal'), where('sumberSoalId', '==', folder.id)));
      const soalTerkait = snap.docs;
      if (soalTerkait.length > 0) {
        for (let i = 0; i < soalTerkait.length; i += 400) {
          const potongan = soalTerkait.slice(i, i + 400);
          const batch = writeBatch(db);
          potongan.forEach((d) => {
            if (ikutHapusSoal) batch.delete(doc(db, 'bank_soal', d.id));
            else batch.update(doc(db, 'bank_soal', d.id), { sumberSoalId: null });
          });
          await batch.commit();
        }
      }
      await deleteDoc(doc(db, 'sumber_soal', folder.id));
      setDaftarFolder((prev) => prev.filter((f) => f.id !== folder.id));
      if (folderAktif?.id === folder.id) setFolderAktif(null);
    } catch (e) {
      console.error('Gagal menghapus folder:', e);
      alert('Gagal menghapus folder: ' + e.message);
    }
    setMenghapusFolder(null);
  }, [folderAktif]);

  const konfirmasiHapusFolderImport = useCallback((folder, e) => {
    e.stopPropagation();
    const ikutHapusSoal = window.confirm(
      `Hapus folder "${folder.judul}"?\n\n` +
      `Folder ini punya ${folder.jumlahSoal || 0} soal.\n\n` +
      `OK = hapus folder + SEMUA soalnya (permanen).\nCancel akan menawarkan opsi lebih aman.`,
    );
    if (ikutHapusSoal) {
      hapusFolderDariImport(folder, true);
      return;
    }
    const lepasSaja = window.confirm(
      `Lepas folder "${folder.judul}" saja? Folder dihapus, tapi ${folder.jumlahSoal || 0} soal di dalamnya TETAP TERSIMPAN di Bank Soal (cuma lepas kaitan folder).`,
    );
    if (lepasSaja) hapusFolderDariImport(folder, false);
  }, [hapusFolderDariImport]);

  const buatFolderBaru = useCallback(async () => {
    if (!judulFolderBaru.trim()) return alert('Judul folder (nama buku/PDF sumber) wajib diisi.');
    if (!mataPelajaran) return alert('Isi dulu Mata Pelajaran di bawah -- ini akan disimpan sebagai metadata folder baru.');
    if (!jenisUjian) return alert('Isi dulu Jenis Ujian di bawah -- ini akan disimpan sebagai metadata folder baru.');
    if (!jenjang) return alert('Isi dulu Jenjang di bawah -- ini akan disimpan sebagai metadata folder baru.');

    setMembuatFolder(true);
    try {
      const payload = {
        judul: judulFolderBaru.trim(),
        coverUrl: coverFolderBaru || '',
        mataPelajaran,
        jenisUjian,
        jenjang,
        jumlahSoal: 0,
        createdAt: serverTimestamp(),
        createdBy: 'admin',
      };
      const docRef = await addDoc(collection(db, 'sumber_soal'), payload);
      const folderBaru = { id: docRef.id, ...payload };
      setDaftarFolder(prev => [folderBaru, ...prev]);
      setFolderAktif(folderBaru);
      setModeFolder('pilih');
      setJudulFolderBaru('');
      setCoverFolderBaru('');
    } catch (e) {
      console.error('Gagal membuat folder:', e);
      alert('Gagal membuat folder: ' + e.message);
    }
    setMembuatFolder(false);
  }, [judulFolderBaru, coverFolderBaru, mataPelajaran, jenisUjian, jenjang]);

  const handleCoverFolderUpload = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return alert('Cover harus berupa gambar.');
    const reader = new FileReader();
    reader.onload = () => setCoverFolderBaru(reader.result);
    reader.readAsDataURL(file);
  };

  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(null);
  const [saveLog, setSaveLog] = useState([]);

  // -------- Prompt AI khusus (generate prompt sinkron dengan skema sistem) --------
  const [showPromptPanel, setShowPromptPanel] = useState(false);
  const [promptMode, setPromptMode] = useState('html');
  const [catatanPrompt, setCatatanPrompt] = useState('');
  const [promptCopied, setPromptCopied] = useState(false);

  const generatedPrompt = useMemo(() => {
    const meta = { mataPelajaran, jenjang, tingkatKelas, tingkatKesulitan, catatanTambahan: catatanPrompt };
    return promptMode === 'html' ? buildMasterHTMLPrompt(meta) : buildMasterPrompt(meta);
  }, [mataPelajaran, jenjang, tingkatKelas, tingkatKesulitan, catatanPrompt, promptMode]);

  const handleCopyPrompt = useCallback(async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(generatedPrompt);
      } else {
        const ta = document.createElement('textarea');
        ta.value = generatedPrompt;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2000);
    } catch (error) {
      console.error('Gagal menyalin prompt:', error);
    }
  }, [generatedPrompt]);

  // ----------------------------------------------------------
  // STATS
  // ----------------------------------------------------------

  const statistik = useMemo(() => {
    const total = soalList.length;
    const valid = soalList.filter(q => q.valid).length;
    const invalid = total - valid;

    const denganGambar = soalList.filter(q =>
      safeArray(q.gambar).some(image => Boolean(getImageSrc(image))) ||
      q.opsi_jawaban.some(opt => safeArray(opt.gambar).some(image => Boolean(getImageSrc(image)))),
    ).length;

    const denganPembahasan = soalList.filter(q => Boolean(safeString(q.pembahasan).trim())).length;
    const denganKunci = soalList.filter(q => Boolean(q.kunci_jawaban)).length;

    const paketSet = new Set(soalList.map(q => q.paket).filter(p => p !== null && p !== undefined));

    return { total, valid, invalid, denganGambar, denganPembahasan, denganKunci, jumlahPaket: paketSet.size };
  }, [soalList]);

  // Soal dikelompokkan per paket untuk ditampilkan di preview.
  // Jika tidak ada info paket sama sekali, semua masuk grup "null" (tampil polos, tanpa header grup).
  const groupedByPaket = useMemo(() => {
    const map = new Map();
    soalList.forEach(q => {
      const key = q.paket ?? '__no_paket__';
      if (!map.has(key)) map.set(key, { paket: q.paket ?? null, nama: q.paketMeta?.nama || null, soal: [] });
      map.get(key).soal.push(q);
    });
    return Array.from(map.values());
  }, [soalList]);

  const adaPengelompokan = groupedByPaket.length > 1 || (groupedByPaket.length === 1 && groupedByPaket[0].paket !== null);

  // ----------------------------------------------------------
  // CROP GAMBAR — update dataUrl gambar tertentu di soalList (identitas via _idx)
  // location: 'soal' | 'bacaan' | { opsi: optionIndex }
  // ----------------------------------------------------------

  // 🔥 BARU: validasi SEMUA gambar di seluruh daftar soal dengan
  // benar-benar mencoba memuatnya lewat Image() -- bukan cuma cek field
  // terisi atau tidak. Dipanggil otomatis setelah parse, dan setelah
  // admin crop/upload manual gambar mana pun (supaya status ✅/❌ selalu
  // sinkron dengan kondisi terbaru). Didefinisikan SEBELUM
  // handleCropImage karena handleCropImage memakainya di dependency
  // array useCallback -- kalau dibalik urutannya akan error TDZ.
  const runValidasiGambar = useCallback(async (list) => {
    const semuaGambar = kumpulkanSemuaGambar(list).filter(g => g.src);
    if (semuaGambar.length === 0) { setImageStatus({}); return; }

    setImageStatus(prev => {
      const next = { ...prev };
      semuaGambar.forEach(g => { next[g.key] = 'checking'; });
      return next;
    });

    const hasil = await Promise.all(
      semuaGambar.map(async (g) => ({ key: g.key, ok: await cobaMuatGambar(g.src) })),
    );

    setImageStatus(prev => {
      const next = { ...prev };
      hasil.forEach(h => { next[h.key] = h.ok ? 'ok' : 'broken'; });
      return next;
    });
  }, []);

  const handleCropImage = useCallback((idx, location, imageIndex, newDataUrl) => {
    setSoalList(prev => {
      const updated = prev.map(q => {
        if (q._idx !== idx) return q;

        if (location === 'soal') {
          const images = [...safeArray(q.gambar)];
          images[imageIndex] = { ...images[imageIndex], dataUrl: newDataUrl, uploadedUrl: '', url: '' };
          return { ...q, gambar: images };
        }

        if (location === 'bacaan' && q.bacaan) {
          const images = [...safeArray(q.bacaan.gambar)];
          images[imageIndex] = { ...images[imageIndex], dataUrl: newDataUrl, uploadedUrl: '', url: '' };
          return { ...q, bacaan: { ...q.bacaan, gambar: images } };
        }

        if (location && typeof location === 'object' && typeof location.opsi === 'number') {
          const opsi = [...safeArray(q.opsi_jawaban)];
          const opt = opsi[location.opsi];
          const images = [...safeArray(opt.gambar)];
          images[imageIndex] = { ...images[imageIndex], dataUrl: newDataUrl, uploadedUrl: '', url: '' };
          opsi[location.opsi] = { ...opt, gambar: images };
          return { ...q, opsi_jawaban: opsi };
        }

        return q;
      });
      // 🔥 BARU: validasi ulang gambar yang baru saja diganti (crop
      // ATAU upload manual) -- supaya status ✅/❌ langsung update begitu
      // admin selesai, tidak perlu tunggu parse ulang.
      runValidasiGambar(updated);
      return updated;
    });
  }, [runValidasiGambar]);

  // ----------------------------------------------------------
  // PARSE (dipakai bareng oleh tombol Parse & oleh auto-parse setelah upload file)
  // ----------------------------------------------------------

  const runParse = useCallback((content, formatOverride) => {
    setParseError('');
    setWarnings([]);
    setSoalList([]);
    setImageStatus({});
    setSaveResult(null);
    setSaveLog([]);

    const activeFormat = formatOverride || format;

    if (!safeString(content).trim()) {
      setParseError('Input kosong. Upload 1 file JSON/CSV/.tex (bisa berisi banyak paket sekaligus).');
      return;
    }

    try {
      const raw =
        activeFormat === 'json' ? parseJSON(content)
        : activeFormat === 'html' ? parseHTMLMaster(content)
        : activeFormat === 'tex' ? parseTeX(content)
        : parseCSV(content);
      const normalized = raw
        .map((question, index) => normalizeSoal(question, index))
        .map((q, index) => ({ ...q, _idx: index }));

      // 🔥 BARU: deteksi lintas-soal -- kalau beberapa soal berbagi grup
      // bacaan yang sama (field bacaan.grup identik, mis. "bacaan_1"),
      // tapi bacaan salah satu soal jauh lebih pendek dari yang lain di
      // grup sama, itu sinyal kuat AI meringkas/lupa menyalin utuh ke
      // soal itu -- lebih pintar dari sekadar cek 1 soal sendirian,
      // karena bisa nangkap kasus yang bahasanya tidak eksplisit
      // menunjuk "teks tersebut" (lolos dari detektor per-soal biasa).
      // Ini TIDAK BISA dilakukan di dalam normalizeSoal() sendiri
      // (yang cuma lihat 1 soal), makanya dijalankan di sini sebagai
      // langkah tambahan setelah semua soal selesai dinormalisasi.
      const grupBacaan = new Map();
      normalized.forEach(q => {
        const grup = q.bacaan?.grup;
        if (!grup) return;
        if (!grupBacaan.has(grup)) grupBacaan.set(grup, []);
        grupBacaan.get(grup).push(q);
      });
      grupBacaan.forEach((anggota, grup) => {
        if (anggota.length < 2) return; // grup cuma 1 soal, tidak ada pembanding
        const panjangMax = Math.max(...anggota.map(s => s.bacaan?.teks?.length || 0));
        anggota.forEach(q => {
          const panjangIni = q.bacaan?.teks?.length || 0;
          if (panjangMax > 0 && panjangIni < panjangMax * 0.9) {
            q.peringatan.push(
              `Bacaan soal ini (${panjangIni} karakter) lebih pendek dari soal lain di grup bacaan "${grup}" (sampai ${panjangMax} karakter) -- kemungkinan AI tidak menyalin bacaan secara utuh ke soal ini. Bandingkan manual dengan soal segrup.`,
            );
          }
        });
      });

      const warningList = normalized
        .filter(q => !q.valid)
        .map(q => `Soal ${q.nomor}${q.paket ? ` (Paket ${q.paket})` : ''}: ${q.errors.join(' ')}`);

      setWarnings(warningList);
      setSoalList(normalized);
      runValidasiGambar(normalized); // fire-and-forget, hasil masuk lewat setImageStatus
    } catch (error) {
      console.error('Parse error:', error);
      setParseError(error?.message || 'Gagal membaca data.');
    }
  }, [format, runValidasiGambar]);

  const handleParse = useCallback(() => {
    runParse(rawInput, format);
  }, [rawInput, format, runParse]);

  // ----------------------------------------------------------
  // FILE HANDLER — satu-satunya jalur upload utama.
  // Begitu file dipilih, otomatis langsung di-parse (tidak perlu klik tombol lagi).
  // ----------------------------------------------------------

  const handleFile = useCallback(event => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      const lowerName = file.name.toLowerCase();
      const detectedFormat = lowerName.endsWith('.csv')
        ? 'csv'
        : lowerName.endsWith('.tex')
        ? 'tex'
        : (lowerName.endsWith('.html') || lowerName.endsWith('.htm'))
        ? 'html'
        : 'json';
      setFormat(detectedFormat);
      setSumberFile(file.name);

      const reader = new FileReader();
      reader.onload = e => {
        const content = safeString(e.target?.result);
        setRawInput(content);
        runParse(content, detectedFormat);
      };
      reader.onerror = () => setParseError('File gagal dibaca.');
      reader.readAsText(file, 'UTF-8');
    } catch (error) {
      console.error('File error:', error);
      setParseError('Gagal membaca file.');
    }
  }, [runParse]);

  // ----------------------------------------------------------
  // SAVE
  // ----------------------------------------------------------

  const handleSave = useCallback(async () => {
    if (!soalList.length) return;

    // 🔥 BARU: GERBANG WAJIB -- Mata Pelajaran, Jenis Ujian, dan Jenjang
    // TIDAK BOLEH kosong. Ditemukan kasus nyata: dulu field-field ini
    // punya nilai default (Matematika/SMA-MA/Kelas 10) yang diam-diam
    // ke-pakai kalau admin lupa ganti -- soal TKA Bahasa Indonesia SMP
    // hampir tersimpan dengan label Matematika/SMA/Kelas 10 tanpa
    // disadari. Sekarang field-field ini KOSONG by default (memaksa
    // pilihan sadar), dan di sini ditolak keras kalau masih kosong.
    const metadataKurang = [];
    if (!mataPelajaran) metadataKurang.push('Mata Pelajaran');
    if (!jenisUjian) metadataKurang.push('Jenis Ujian');
    if (!jenjang) metadataKurang.push('Jenjang');
    if (metadataKurang.length > 0) {
      alert(`Lengkapi dulu di Metadata Soal: ${metadataKurang.join(', ')}. Ini wajib diisi supaya soal tidak salah label saat disimpan.`);
      return;
    }

    // 🔥 BARU: GERBANG WAJIB -- Folder Sumber wajib dipilih/dibuat.
    // Tanpa ini, soal tidak punya "rumah" (buku/PDF asal) yang jelas,
    // dan tidak bisa dikelompokkan/dijelajahi per folder+bab nanti di
    // Terbitkan Kuis (keranjang lintas-folder).
    if (!folderAktif) {
      alert('Pilih atau buat Folder Sumber (buku/PDF) dulu di panel "📁 Folder Sumber" sebelum menyimpan.');
      return;
    }

    // 🔥 BARU: GERBANG WAJIB -- tolak simpan kalau masih ada gambar
    // yang terdeteksi rusak/palsu (hasil validasi Image() beneran, lihat
    // runValidasiGambar) atau masih dalam proses pengecekan. Ini yang
    // memastikan soal dengan gambar bohongan dari AI (base64 kelihatan
    // valid tapi datanya korup) TIDAK BISA lolos ke Bank Soal begitu
    // saja -- admin wajib upload gambar asli manual dulu.
    const cekKunciSoal = (q) => [
      ...safeArray(q.gambar).map((_, i) => kunciGambar(q._idx, 'soal', i)),
      ...(q.bacaan ? safeArray(q.bacaan.gambar).map((_, i) => kunciGambar(q._idx, 'bacaan', i)) : []),
      ...safeArray(q.opsi_jawaban).flatMap((opt, oi) => safeArray(opt.gambar).map((_, i) => kunciGambar(q._idx, { opsi: oi }, i))),
    ];

    const soalMasihDicek = soalList.filter(q => cekKunciSoal(q).some(k => imageStatus[k] === 'checking'));
    if (soalMasihDicek.length > 0) {
      alert('Masih memeriksa validitas gambar, tunggu beberapa detik lagi lalu coba simpan ulang.');
      return;
    }

    const soalGambarRusak = soalList.filter(q => cekKunciSoal(q).some(k => imageStatus[k] === 'broken'));
    if (soalGambarRusak.length > 0) {
      const daftar = soalGambarRusak
        .map(q => `Soal ${q.nomor}${q.paket ? ` (Paket ${q.paket})` : ''}`)
        .join(', ');
      alert(
        `Tidak bisa disimpan -- ${soalGambarRusak.length} soal punya gambar RUSAK/PALSU dari hasil scan AI:\n\n${daftar}\n\n` +
        'Buka panel "KELOLA GAMBAR" di tiap soal itu dan klik "Upload Gambar Manual" untuk mengganti dengan gambar asli, baru simpan lagi.',
      );
      return;
    }

    const invalid = soalList.filter(q => !q.valid);
    if (invalid.length > 0) {
      const proceed = window.confirm(
        `Ada ${invalid.length} soal yang belum lengkap/valid.\n\nTetap simpan soal yang valid saja?`,
      );
      if (!proceed) return;
    }

    const validSoal = soalList.filter(q => q.valid);
    if (validSoal.length === 0) {
      setSaveResult({ success: false, error: 'Tidak ada soal valid untuk disimpan.' });
      return;
    }

    // 🔥 BARU: DETEKSI DUPLIKAT -- ditemukan kasus nyata: kalau PDF yang
    // sama diimpor 2x (sengaja atau lupa sudah pernah), sistem sebelum
    // ini diam-diam menyimpan 2 dokumen terpisah untuk soal yang
    // ISINYA SAMA PERSIS -- siswa bisa ketemu "soal yang sama" 2x, dan
    // progres Leitner Box-nya kepecah jadi 2 record padahal seharusnya
    // 1. Sekarang dicek DUA arah sebelum benar-benar menulis:
    // (1) terhadap SELURUH Bank Soal yang sudah ada, (2) sesama soal
    // di DALAM batch yang mau disimpan ini (jaga-jaga kalau admin gak
    // sadar menempel konten yang sama 2x dalam 1 sesi import).
    let peringatanDuplikat = [];
    try {
      const existingSnap = await getDocs(collection(db, 'bank_soal'));
      const existingSet = new Map(); // teks ternormalisasi -> nomor soal lama (buat pesan)
      existingSnap.forEach(d => {
        const data = d.data();
        const teks = normalisasiTeksDuplikat(data.soal || data.teksSoal || '');
        if (teks) existingSet.set(teks, data.nomor || '?');
      });

      const dalamBatchSet = new Set();
      validSoal.forEach(q => {
        const teks = normalisasiTeksDuplikat(q.teks_soal);
        if (!teks) return;
        if (existingSet.has(teks)) {
          peringatanDuplikat.push(`Soal ${q.nomor}${q.paket ? ` (Paket ${q.paket})` : ''}: mirip/sama dengan soal yang SUDAH ADA di Bank Soal (nomor ${existingSet.get(teks)}).`);
        } else if (dalamBatchSet.has(teks)) {
          peringatanDuplikat.push(`Soal ${q.nomor}${q.paket ? ` (Paket ${q.paket})` : ''}: sama dengan soal LAIN di batch import ini juga -- kemungkinan tempel dobel.`);
        }
        dalamBatchSet.add(teks);
      });
    } catch (e) {
      console.error('Gagal cek duplikat (dilewati, tidak menghalangi simpan):', e);
    }

    if (peringatanDuplikat.length > 0) {
      const proceed = window.confirm(
        `⚠️ Terdeteksi ${peringatanDuplikat.length} kemungkinan soal DUPLIKAT:\n\n${peringatanDuplikat.slice(0, 8).join('\n')}` +
        (peringatanDuplikat.length > 8 ? `\n...dan ${peringatanDuplikat.length - 8} lainnya.` : '') +
        `\n\nKlik OK untuk TETAP simpan semua (termasuk yang mirip di atas), atau Cancel untuk batal dan cek manual dulu.`,
      );
      if (!proceed) return;
    }

    setSaving(true);
    setSaveResult(null);
    setSaveLog([]);

    const logs = [];
    const addLog = message => { logs.push(message); setSaveLog([...logs]); };

    const meta = {
      mataPelajaran,
      tingkatKelas,
      jenjang,
      jenisUjian,
      folderId: folderAktif?.id || null,
      kategori,
      tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
      tingkatKesulitan,
      sumberFile,
      sumberAI,
    };

    // Clone dalam (soal + gambar soal + gambar tiap opsi).
    const soalProcessed = validSoal.map(q => ({
      ...q,
      gambar: safeArray(q.gambar).map(image => ({ ...image })),
      bacaan: q.bacaan ? { ...q.bacaan, gambar: safeArray(q.bacaan.gambar).map(image => ({ ...image })) } : null,
      opsi_jawaban: safeArray(q.opsi_jawaban).map(opt => ({
        ...opt,
        gambar: safeArray(opt.gambar).map(image => ({ ...image })),
      })),
    }));

    // ------------------------------------------------------
    // KUMPULKAN SEMUA GAMBAR BASE64 (gambar soal + gambar tiap opsi)
    // ------------------------------------------------------

    const toUpload = [];

    soalProcessed.forEach((question, qi) => {
      safeArray(question.gambar).forEach((image, gi) => {
        if (safeString(image.dataUrl).startsWith('data:image')) {
          toUpload.push({
            key: `q${qi}-soal-g${gi}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            dataUrl: image.dataUrl,
            kind: 'soal',
            qi, gi,
          });
        }
      });

      if (question.bacaan) {
        safeArray(question.bacaan.gambar).forEach((image, gi) => {
          if (safeString(image.dataUrl).startsWith('data:image')) {
            toUpload.push({
              key: `q${qi}-bacaan-g${gi}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              dataUrl: image.dataUrl,
              kind: 'bacaan',
              qi, gi,
            });
          }
        });
      }

      safeArray(question.opsi_jawaban).forEach((opt, oi) => {
        safeArray(opt.gambar).forEach((image, gi) => {
          if (safeString(image.dataUrl).startsWith('data:image')) {
            toUpload.push({
              key: `q${qi}-opsi${oi}-g${gi}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              dataUrl: image.dataUrl,
              kind: 'opsi',
              qi, oi, gi,
            });
          }
        });
      });
    });

    if (toUpload.length > 0) {
      addLog(`⏳ Menyiapkan ${toUpload.length} gambar (soal + opsi)...`);

      try {
        const response = await fetch('/api/uploadBankSoalImages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            images: toUpload.map(item => ({ key: item.key, dataUrl: item.dataUrl })),
          }),
        });

        let result = null;
        try { result = await response.json(); } catch (_) { result = null; }

        if (!response.ok) {
          throw new Error(result?.error || `Server upload mengembalikan HTTP ${response.status}`);
        }

        const urlMap = {};
        safeArray(result?.uploaded).forEach(upload => {
          if (upload?.key && upload?.url) urlMap[upload.key] = upload.url;
        });

        let uploadedCount = 0;

        toUpload.forEach(item => {
          const uploadedUrl = urlMap[item.key];
          if (!uploadedUrl) return;

          if (item.kind === 'soal') {
            const images = [...safeArray(soalProcessed[item.qi].gambar)];
            images[item.gi] = { ...images[item.gi], uploadedUrl, dataUrl: '' };
            soalProcessed[item.qi] = { ...soalProcessed[item.qi], gambar: images };
          } else if (item.kind === 'bacaan') {
            const bacaan = soalProcessed[item.qi].bacaan;
            const images = [...safeArray(bacaan?.gambar)];
            images[item.gi] = { ...images[item.gi], uploadedUrl, dataUrl: '' };
            soalProcessed[item.qi] = { ...soalProcessed[item.qi], bacaan: { ...bacaan, gambar: images } };
          } else {
            const opsi = [...safeArray(soalProcessed[item.qi].opsi_jawaban)];
            const opt = opsi[item.oi];
            const images = [...safeArray(opt.gambar)];
            images[item.gi] = { ...images[item.gi], uploadedUrl, dataUrl: '' };
            opsi[item.oi] = { ...opt, gambar: images };
            soalProcessed[item.qi] = { ...soalProcessed[item.qi], opsi_jawaban: opsi };
          }

          uploadedCount++;
        });

        addLog(`✅ ${uploadedCount}/${toUpload.length} gambar berhasil diproses.`);

        const uploadErrors = safeArray(result?.errors);
        if (uploadErrors.length) addLog(`⚠️ ${uploadErrors.length} gambar gagal diupload.`);
      } catch (error) {
        console.error('Image upload error:', error);
        addLog(`⚠️ Upload gambar gagal: ${error?.message || 'error tidak diketahui'}`);
        addLog('ℹ️ Proses penyimpanan tetap dilanjutkan. Gambar base64 yang gagal upload tidak akan menjadi URL.');
      }
    }

    // ------------------------------------------------------
    // FIRESTORE
    // ------------------------------------------------------

    try {
      addLog(`📝 Menyimpan ${soalProcessed.length} soal valid ke Firestore...`);

      const CHUNK = 400;
      let saved = 0;

      for (let i = 0; i < soalProcessed.length; i += CHUNK) {
        const chunk = soalProcessed.slice(i, i + CHUNK);
        const batch = writeBatch(db);

        chunk.forEach(question => {
          const ref = doc(collection(db, BANK_SOAL_COLLECTION));
          batch.set(ref, buildDoc(question, meta));
        });

        await batch.commit();
        saved += chunk.length;
        addLog(`💾 ${saved}/${soalProcessed.length} soal tersimpan...`);
      }

      addLog(`🎉 Selesai! ${saved} soal berhasil masuk Bank Soal.`);

      // 🔥 BARU: catat berapa soal masuk ke folder ini -- dipakai
      // TerbitkanKuisPage buat tampilkan "X soal" per folder tanpa perlu
      // query bank_soal setiap kali buka daftar folder.
      if (folderAktif?.id && saved > 0) {
        try {
          await updateDoc(doc(db, 'sumber_soal', folderAktif.id), { jumlahSoal: increment(saved) });
          setFolderAktif(prev => prev ? { ...prev, jumlahSoal: (prev.jumlahSoal || 0) + saved } : prev);
        } catch (e) {
          console.error('Gagal update jumlahSoal folder:', e);
        }
      }

      setSaveResult({
        success: true,
        count: saved,
        skipped: soalList.length - validSoal.length,
      });
    } catch (error) {
      console.error('Firestore save error:', error);
      addLog(`❌ Gagal simpan Firestore: ${error?.message || 'error tidak diketahui'}`);
      setSaveResult({ success: false, error: error?.message || 'Gagal menyimpan soal.' });
    } finally {
      setSaving(false);
    }
  }, [soalList, mataPelajaran, tingkatKelas, jenjang, jenisUjian, folderAktif, kategori, tags, tingkatKesulitan, sumberFile, sumberAI, imageStatus]);

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <SidebarAdmin />

      <main
        style={{
          flex: 1,
          marginLeft: isMobile ? 0 : 260,
          minHeight: '100vh',
          transition: 'margin-left .2s',
        }}
      >
        <div style={{ padding: '16px', maxWidth: '72rem', marginLeft: 'auto', marginRight: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* HEADER */}
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>Import Hasil Scan AI</h1>
              <span style={{ paddingLeft: '10px', paddingRight: '10px', paddingTop: '4px', paddingBottom: '4px', borderRadius: '9999px', backgroundColor: '#d1fae5', color: '#047857', fontSize: '12px', fontWeight: '700' }}>
                SAFE IMPORT
              </span>
            </div>
            <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
              Import soal hasil scan AI ke Bank Soal Gemilang — mendukung 1 file JSON gabungan
              berisi banyak paket (otomatis dikelompokkan), gambar/grafik per opsi, tabel per opsi,
              kunci jawaban, dan pembahasan.
            </p>
          </div>

          {/* PROMPT AI KHUSUS */}
          <div style={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid #1e293b', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>🤖</span>
                  <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
                    Prompt AI Khusus untuk Scan Soal
                  </h2>
                  <span style={{ paddingLeft: '8px', paddingRight: '8px', paddingTop: '2px', paddingBottom: '2px', borderRadius: '9999px', backgroundColor: '#1e40af', color: '#dbeafe', fontSize: '10px', fontWeight: '700' }}>
                    SINKRON DENGAN SISTEM
                  </span>
                </div>
                <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px', maxWidth: '620px' }}>
                  Generate prompt siap-pakai untuk memproses PDF/gambar soal. <strong>HTML Master</strong> sekarang menjadi mode utama untuk soal kompleks karena mempertahankan struktur gambar, tabel, dan LaTeX; JSON tetap tersedia sebagai mode legacy.
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                  {['html', 'json'].map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPromptMode(mode)}
                      style={{ padding: '7px 12px', borderRadius: '9999px', border: promptMode === mode ? '1px solid #60a5fa' : '1px solid #334155', backgroundColor: promptMode === mode ? '#1d4ed8' : '#111827', color: '#e2e8f0', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      {mode === 'html' ? '⭐ Prompt HTML Master' : 'Prompt JSON Legacy'}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPromptPanel(v => !v)}
                style={{
                  flexShrink: 0, paddingLeft: '18px', paddingRight: '18px', paddingTop: '10px', paddingBottom: '10px',
                  borderRadius: '8px', border: 'none', backgroundColor: '#3b82f6', color: '#ffffff',
                  fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                }}
              >
                {showPromptPanel ? 'Sembunyikan Prompt ▲' : 'Buka & Generate Prompt ▼'}
              </button>
            </div>

            {showPromptPanel && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
                  <div style={{ backgroundColor: '#1e293b', borderRadius: '8px', padding: '10px 12px' }}>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Mapel / Jenjang / Kelas dipakai otomatis dari form di bawah</div>
                    <div style={{ fontSize: '13px', color: '#e2e8f0', marginTop: '2px', fontWeight: '600' }}>
                      {mataPelajaran} · {jenjang} · Kelas {tingkatKelas} · Kesulitan default: {tingkatKesulitan}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px', display: 'block' }}>
                      Catatan tambahan untuk AI (opsional — mis. "fokus materi kalkulus" / "jangan proses halaman sampul")
                    </label>
                    <input
                      type="text"
                      value={catatanPrompt}
                      onChange={e => setCatatanPrompt(e.target.value)}
                      placeholder="Contoh: Proses per paket, tunggu konfirmasi sebelum lanjut paket berikutnya."
                      style={{ width: '100%', border: '1px solid #334155', borderRadius: '8px', paddingLeft: '10px', paddingRight: '10px', paddingTop: '8px', paddingBottom: '8px', fontSize: '13px', backgroundColor: '#0f172a', color: '#e2e8f0' }}
                    />
                  </div>
                </div>

                <textarea
                  readOnly
                  rows={12}
                  value={generatedPrompt}
                  onClick={e => e.target.select()}
                  style={{
                    width: '100%', resize: 'vertical', fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                    fontSize: '11.5px', lineHeight: 1.5, backgroundColor: '#0b1220', color: '#cbd5e1',
                    border: '1px solid #334155', borderRadius: '8px', padding: '12px',
                  }}
                />

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={handleCopyPrompt}
                    style={{
                      paddingLeft: '18px', paddingRight: '18px', paddingTop: '10px', paddingBottom: '10px',
                      borderRadius: '8px', border: 'none', backgroundColor: promptCopied ? '#16a34a' : '#3b82f6',
                      color: '#ffffff', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                    }}
                  >
                    {promptCopied ? '✅ Tersalin ke Clipboard' : '📋 Copy Prompt'}
                  </button>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    Alur: 1) Copy prompt → 2) Lampirkan PDF/gambar ke AI → 3) minta output sesuai mode → 4) upload HTML Master/JSON di bawah. Gambar sebaiknya berupa data URL atau URL yang benar-benar tersedia.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* FORMAT */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e5e7eb', borderColor: '#e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#4b5563' }}>Format:</span>

              {['html', 'json', 'csv', 'tex'].map(currentFormat => (
                <button
                  key={currentFormat}
                  type="button"
                  onClick={() => { setFormat(currentFormat); setParseError(''); }}
                  style={{
                    paddingLeft: '16px', paddingRight: '16px', paddingTop: '8px', paddingBottom: '8px',
                    borderRadius: '8px', fontSize: '14px', fontWeight: '700',
                    border: format === currentFormat ? '1px solid #2563eb' : '1px solid #d1d5db',
                    backgroundColor: format === currentFormat ? '#2563eb' : '#ffffff',
                    color: format === currentFormat ? '#ffffff' : '#4b5563',
                    cursor: 'pointer',
                  }}
                >
                  {currentFormat === 'html' ? 'HTML MASTER' : currentFormat === 'tex' ? '.TEX' : currentFormat.toUpperCase()}
                  <span style={{ marginLeft: '4px', fontSize: '10px', opacity: 0.7 }}>
                    {currentFormat === 'html'
                      ? '⭐ Disarankan · gambar + rumus + tabel'
                      : currentFormat === 'json'
                      ? 'Legacy · data aplikasi'
                      : currentFormat === 'tex'
                      ? 'LaTeX (enumerate/item)'
                      : 'Teks'}
                  </span>
                </button>
              ))}

              <label style={{ cursor: 'pointer', marginLeft: 'auto', paddingLeft: '20px', paddingRight: '20px', paddingTop: '10px', paddingBottom: '10px', borderRadius: '8px', border: '2px solid #3b82f6', borderColor: '#3b82f6', fontSize: '14px', fontWeight: '700', color: '#2563eb', backgroundColor: '#ffffff' }}>
                📂 Upload File (1 file, semua paket)
                <input
                  type="file"
                  accept=".html,.htm,.json,.csv,.tex,text/html,application/json,text/csv,text/x-tex"
                  onChange={handleFile}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
            <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '-8px', background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: '10px', padding: '10px 12px' }}>
              <strong>Alur baru:</strong> PDF/gambar → AI → <strong>HTML Master</strong> → preview & validasi → Firebase.
              HTML Master menjaga gambar, tabel, dan LaTeX tetap terstruktur. JSON tetap tersedia untuk kompatibilitas lama.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, minmax(0, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>Sumber AI</label>
                <input
                  type="text"
                  value={sumberAI}
                  onChange={e => setSumberAI(e.target.value)}
                  placeholder="Gemini Canvas, ChatGPT, Claude..."
                  style={{ width: '100%', border: '1px solid #e5e7eb', borderColor: '#d1d5db', borderRadius: '8px', paddingLeft: '12px', paddingRight: '12px', paddingTop: '8px', paddingBottom: '8px', fontSize: '14px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>Nama File Sumber</label>
                <input
                  type="text"
                  value={sumberFile}
                  onChange={e => setSumberFile(e.target.value)}
                  placeholder="Contoh: 7 Paket Tryout TKA Fisika.pdf"
                  style={{ width: '100%', border: '1px solid #e5e7eb', borderColor: '#d1d5db', borderRadius: '8px', paddingLeft: '12px', paddingRight: '12px', paddingTop: '8px', paddingBottom: '8px', fontSize: '14px' }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label style={{ fontSize: '12px', color: '#6b7280' }}>Paste {format === 'html' ? 'HTML MASTER' : format.toUpperCase()}</label>
                <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                  Bisa 1 file gabungan banyak paket — otomatis dikelompokkan
                </span>
              </div>

              <textarea
                rows={14}
                value={rawInput}
                onChange={e => setRawInput(e.target.value)}
                spellCheck="false"
                placeholder={
                  format === 'html'
                    ? `<!doctype html>
<html lang="id"><body>
<article data-gemilang-question data-nomor="1" data-tipe="pg_sederhana" data-paket="1">
<div data-field="teks_soal">Soal dengan rumus $x^2+1$ {{GAMBAR}}</div>
<div data-field="gambar"><img src="data:image/png;base64,..." alt="Grafik/diagram soal" /></div>
<ol data-field="opsi_jawaban"><li>A</li><li>B</li><li>C</li><li>D</li><li>E</li></ol>
<meta data-field="kunci_jawaban" data-value="C" />
<div data-field="pembahasan">Pembahasan lengkap.</div>
</article>
</body></html>`
                  : format === 'tex' 
                    ? `\\begin{enumerate}
\\item Akar-akar persamaan kuadrat $x^2 + ax - 4 = 0$ adalah p dan q. Jika $p^2 - 2pq + q^2 = 8a$ maka nilai a = ....
\\begin{enumerate}[label=\\Alph*.]
  \\item $-8$
  \\item $-4$
  \\item $4$
  \\item $6$
  \\item $8$
\\end{enumerate}
\\kunci{E}
\\pembahasan{Langkah-langkah penyelesaian lengkap di sini.}
\\end{enumerate}

\\section*{Kunci Jawaban}
1. E`
                    : format === 'json'
                    ? `{
  "tryout": [
    {
      "paket": 1,
      "soal": [
        {
          "nomor": 1,
          "tipe": "pg_sederhana",
          "teks_soal": "Berapakah hasil $2+3$? {{GAMBAR}}",
          "gambar": [{ "url": "https://.../gambar1.png", "deskripsi": "Ilustrasi" }],
          "opsi_jawaban": [
            "4",
            { "teks": "5" },
            { "teks": "Opsi berupa tabel", "tabel": { "Rutherford": "...", "Bohr": "..." } },
            { "teks": "Opsi berupa grafik", "gambar": [{ "url": "https://.../grafikA.png" }] }
          ],
          "kunci_jawaban": "B",
          "pembahasan": "2 + 3 = 5."
        }
      ]
    }
  ]
}`
                    : `Nomor,Tipe,Soal,Opsi A,Opsi B,Opsi C,Opsi D,Opsi E,Kunci,Pembahasan
1,pg_sederhana,"Berapakah 2+3?",4,5,6,7,8,B,"2+3=5"`
                }
                style={{ width: '100%', border: '1px solid #e5e7eb', borderColor: '#d1d5db', borderRadius: '12px', paddingLeft: '12px', paddingRight: '12px', paddingTop: '12px', paddingBottom: '12px', fontSize: '14px', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', lineHeight: '1.5rem', resize: 'vertical', backgroundColor: '#f9fafb' }}
              />
            </div>

            {parseError && (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #e5e7eb', borderColor: '#fecaca', borderRadius: '12px', paddingLeft: '16px', paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px', fontSize: '14px', color: '#b91c1c' }}>
                <div style={{ fontWeight: '700', marginBottom: '4px' }}>❌ Format {format === 'html' ? 'HTML Master' : format.toUpperCase()} tidak dapat diproses</div>
                <div>{parseError}</div>
              </div>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <button
                type="button"
                onClick={handleParse}
                style={{ paddingLeft: '24px', paddingRight: '24px', paddingTop: '10px', paddingBottom: '10px', backgroundColor: '#2563eb', color: '#ffffff', borderRadius: '12px', fontSize: '14px', fontWeight: '700', transition: 'all .15s ease' }}
              >
                🔍 Parse & Preview
              </button>

              {soalList.length > 0 && (
                <button
                  type="button"
                  onClick={() => downloadJSON(soalList)}
                  style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '10px', paddingBottom: '10px', backgroundColor: '#1f2937', color: '#ffffff', borderRadius: '12px', fontSize: '14px', fontWeight: '700' }}
                >
                  ⬇️ Download JSON
                </button>
              )}

              {rawInput && (
                <button
                  type="button"
                  onClick={() => { setRawInput(''); setSoalList([]); setParseError(''); setWarnings([]); }}
                  style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '10px', paddingBottom: '10px', backgroundColor: '#ffffff', color: '#374151', border: '1px solid #e5e7eb', borderColor: '#d1d5db', borderRadius: '12px', fontSize: '14px', fontWeight: '700' }}
                >
                  🗑️ Bersihkan
                </button>
              )}
            </div>
          </div>

          {/* WARNING */}
          {warnings.length > 0 && (
            <div style={{ backgroundColor: '#fffbeb', border: '1px solid #e5e7eb', borderColor: '#fde68a', borderRadius: '16px', padding: '20px' }}>
              <div style={{ fontWeight: '700', color: '#92400e', marginBottom: '8px' }}>⚠️ Ada soal yang perlu diperiksa</div>
              <div style={{ maxHeight: '192px', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {warnings.map((warning, index) => (
                  <div key={index} style={{ fontSize: '12px', color: '#b45309' }}>{warning}</div>
                ))}
              </div>
              <div style={{ fontSize: '12px', color: '#b45309', marginTop: '12px' }}>Soal yang valid tetap bisa disimpan.</div>
            </div>
          )}

          {/* STATS + PREVIEW */}
          {soalList.length > 0 && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                <StatCard label="Total" value={statistik.total} icon="📚" />
                <StatCard label="Valid" value={statistik.valid} icon="✅" good />
                <StatCard label="Perlu Cek" value={statistik.invalid} icon="⚠️" />
                <StatCard label="Gambar" value={statistik.denganGambar} icon="🖼️" />
                <StatCard label="Kunci" value={statistik.denganKunci} icon="🔑" />
                <StatCard label="Pembahasan" value={statistik.denganPembahasan} icon="💡" />
                <StatCard label="Paket" value={statistik.jumlahPaket || (adaPengelompokan ? 1 : 0)} icon="📦" />
              </div>

              <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e5e7eb', borderColor: '#e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div>
                    <h2 style={{ fontWeight: '700', color: '#1f2937', fontSize: '18px' }}>Preview — {soalList.length} soal</h2>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                      {adaPengelompokan
                        ? `Dikelompokkan otomatis menjadi ${groupedByPaket.length} paket. Gambar/tabel/grafik opsi ditampilkan apa adanya.`
                        : 'Gambar & tabel opsi ditampilkan tanpa cropping.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => downloadJSON(soalList)}
                    style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '8px', paddingBottom: '8px', backgroundColor: '#f3f4f6', color: '#374151', borderRadius: '8px', fontSize: '12px', fontWeight: '700' }}
                  >
                    ⬇️ Export JSON
                  </button>
                </div>

                <div style={{ maxHeight: '700px', overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {groupedByPaket.map((group, gIdx) => (
                    <div key={gIdx}>
                      {adaPengelompokan && (
                        <div style={{ position: 'sticky', top: '0', zIndex: 10, backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', paddingLeft: '12px', paddingRight: '12px', paddingTop: '8px', paddingBottom: '8px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', borderColor: '#dbeafe', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ paddingLeft: '10px', paddingRight: '10px', paddingTop: '4px', paddingBottom: '4px', backgroundColor: '#2563eb', color: '#ffffff', fontSize: '12px', fontWeight: '700', borderRadius: '9999px' }}>
                            {group.nama || `Paket ${group.paket ?? '-'}`}
                          </span>
                          <span style={{ fontSize: '12px', color: '#6b7280' }}>{group.soal.length} soal</span>
                        </div>
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {group.soal.slice(0, 100).map((q, index) => (
                          <QuestionPreview
                            key={`${q.paket ?? 'x'}-${q.nomor}-${index}`}
                            question={q}
                            mathReady={mathReady}
                            onCropImage={handleCropImage}
                            imageStatus={imageStatus}
                          />
                        ))}
                      </div>
                    </div>
                  ))}

                  {soalList.length > 100 && (
                    <div style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af', paddingTop: '12px', paddingBottom: '12px' }}>
                      Total {soalList.length} soal dimuat (preview membatasi 100 soal per grup).
                    </div>
                  )}
                </div>

                {/* 🔥 BARU: FOLDER SUMBER (sumber_soal) -- pilih buku/PDF yang
                    sedang di-scan, atau buat baru. Metadata (mapel/jenis
                    ujian/jenjang) nempel di folder, bukan diketik ulang
                    tiap sesi import. */}
                <div style={{ borderTop: '1px solid #e5e7eb', borderColor: '#f3f4f6', paddingTop: '20px', marginBottom: '20px' }}>
                  <h3 style={{ fontWeight: '700', color: '#374151', marginBottom: '4px' }}>📁 Folder Sumber (Buku/PDF)</h3>
                  <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px' }}>
                    Satu folder = satu buku/PDF sumber soal. Pilih folder yang sama kalau ini lanjutan scan PDF yang sudah pernah diimport sebelumnya.
                  </p>

                  {folderAktif ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '10px', border: '1px solid #a5f3fc', backgroundColor: '#ecfeff' }}>
                      {folderAktif.coverUrl ? (
                        <img src={folderAktif.coverUrl} alt="cover" style={{ width: '40px', height: '52px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #67e8f9' }} />
                      ) : (
                        <div style={{ width: '40px', height: '52px', borderRadius: '4px', backgroundColor: '#a5f3fc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>📘</div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '700', color: '#0e7490', fontSize: '14px' }}>{folderAktif.judul}</div>
                        <div style={{ fontSize: '11px', color: '#0891b2' }}>{folderAktif.mataPelajaran} · {folderAktif.jenisUjian} · {folderAktif.jenjang} · {folderAktif.jumlahSoal || 0} soal tersimpan</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setFolderAktif(null); }}
                        style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: 'white', cursor: 'pointer' }}
                      >
                        Ganti Folder
                      </button>
                    </div>
                  ) : (
                    <div style={{ border: '1px dashed #d1d5db', borderRadius: '10px', padding: '14px' }}>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                        <button type="button" onClick={() => setModeFolder('pilih')} style={{ ...(modeFolder === 'pilih' ? tabAktifStyle : tabPasifStyle) }}>Pilih Folder Ada</button>
                        <button type="button" onClick={() => setModeFolder('baru')} style={{ ...(modeFolder === 'baru' ? tabAktifStyle : tabPasifStyle) }}>+ Folder Baru</button>
                      </div>

                      {modeFolder === 'pilih' ? (
                        daftarFolder.length === 0 ? (
                          <div style={{ fontSize: '13px', color: '#9ca3af' }}>Belum ada folder. Klik "+ Folder Baru" untuk membuat yang pertama.</div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                            {daftarFolder.map(f => (
                              <div
                                key={f.id}
                                onClick={() => pilihFolder(f)}
                                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e5e7eb', cursor: 'pointer', backgroundColor: 'white' }}
                              >
                                {f.coverUrl ? (
                                  <img src={f.coverUrl} alt="" style={{ width: '28px', height: '36px', objectFit: 'cover', borderRadius: '3px' }} />
                                ) : <span style={{ fontSize: '16px' }}>📘</span>}
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{f.judul}</div>
                                  <div style={{ fontSize: '11px', color: '#9ca3af' }}>{f.mataPelajaran} · {f.jenisUjian} · {f.jenjang} · {f.jumlahSoal || 0} soal</div>
                                </div>
                                {menghapusFolder === f.id ? (
                                  <span style={{ fontSize: '11px', color: '#9ca3af' }}>Menghapus...</span>
                                ) : (
                                  <button
                                    onClick={(e) => konfirmasiHapusFolderImport(f, e)}
                                    title="Hapus folder ini"
                                    style={{ padding: '5px', borderRadius: '6px', border: '1px solid #fecaca', backgroundColor: '#fef2f2', color: '#dc2626', cursor: 'pointer', flexShrink: 0 }}
                                  >
                                    🗑️
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )
                      ) : (
                        <div>
                          <input
                            placeholder="Judul buku/PDF sumber (mis. E-Book TKA Bahasa Indonesia SMP/MTs)"
                            value={judulFolderBaru}
                            onChange={e => setJudulFolderBaru(e.target.value)}
                            className="input"
                            style={{ width: '100%', marginBottom: '8px' }}
                          />
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                            {coverFolderBaru && <img src={coverFolderBaru} alt="" style={{ width: '32px', height: '42px', objectFit: 'cover', borderRadius: '4px' }} />}
                            <label style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: 'white', cursor: 'pointer' }}>
                              📤 Upload Cover (opsional)
                              <input type="file" accept="image/*" onChange={handleCoverFolderUpload} style={{ display: 'none' }} />
                            </label>
                          </div>
                          <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '10px' }}>
                            Isi dulu Mata Pelajaran, Jenis Ujian, dan Jenjang di panel "Metadata Soal" di bawah -- nilai itu akan disimpan sebagai metadata folder baru ini.
                          </p>
                          <button type="button" onClick={buatFolderBaru} disabled={membuatFolder} style={btnBiruKecil}>
                            {membuatFolder ? 'Membuat...' : '✓ Buat & Pakai Folder Ini'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* METADATA */}
                <div style={{ borderTop: '1px solid #e5e7eb', borderColor: '#f3f4f6', paddingTop: '20px' }}>
                  <h3 style={{ fontWeight: '700', color: '#374151', marginBottom: '12px' }}>Metadata Soal</h3>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, minmax(0, 1fr))', gap: '12px' }}>
                    <Field label="Mata Pelajaran *">
                      <select value={mataPelajaran} onChange={e => setMataPelajaran(e.target.value)} disabled={!!folderAktif} className="input" style={{ color: mataPelajaran ? undefined : '#9ca3af' }}>
                        <option value="">-- Pilih mata pelajaran --</option>
                        {DAFTAR_MAPEL.map(mapel => <option key={mapel} value={mapel}>{mapel}</option>)}
                      </select>
                      {folderAktif && <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>Terkunci oleh folder aktif. Klik "Ganti Folder" untuk mengubah.</div>}
                    </Field>

                    <Field label="Jenis Ujian *">
                      {/* 🔥 BARU: pembeda "ini soal TKA / SNBT / ulangan
                          biasa" -- tanpa ini, soal TKA dan soal reguler
                          untuk mapel+jenjang yang sama tidak bisa
                          dibedakan sama sekali di database. */}
                      <select value={jenisUjian} onChange={e => setJenisUjian(e.target.value)} disabled={!!folderAktif} className="input" style={{ color: jenisUjian ? undefined : '#9ca3af' }}>
                        <option value="">-- Pilih jenis ujian --</option>
                        <option value="TKA">TKA (Tes Kemampuan Akademik)</option>
                        <option value="SNBT/UTBK">SNBT/UTBK</option>
                        <option value="Reguler">Reguler (Ulangan/Kurikulum Sekolah)</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    </Field>

                    <Field label="Jenjang *">
                      <select value={jenjang} onChange={e => setJenjang(e.target.value)} disabled={!!folderAktif} className="input" style={{ color: jenjang ? undefined : '#9ca3af' }}>
                        <option value="">-- Pilih jenjang --</option>
                        {DAFTAR_JENJANG.map(item => <option key={item} value={item}>{item}</option>)}
                      </select>
                    </Field>

                    <Field label="Kelas">
                      {/* 🔥 CATATAN: untuk soal TKA (kompetensi lintas
                          kelas dalam 1 jenjang), "Semua" biasanya yang
                          PALING BENAR -- bukan kelas spesifik. Kelas
                          spesifik cuma cocok untuk soal reguler yang
                          memang terikat 1 topik kurikulum 1 kelas. */}
                      <select value={tingkatKelas} onChange={e => setTingkatKelas(e.target.value)} className="input" style={{ color: tingkatKelas ? undefined : '#9ca3af' }}>
                        <option value="">-- Pilih kelas (kosongkan = ikut per-soal AI) --</option>
                        {DAFTAR_KELAS.map(item => <option key={item} value={item}>{item === 'Semua' ? 'Semua Kelas' : `Kelas ${item}`}</option>)}
                      </select>
                    </Field>

                    <Field label="Kategori / Bab">
                      <input
                        value={kategori}
                        onChange={e => setKategori(e.target.value)}
                        placeholder="Contoh: Eksponen"
                        className="input"
                      />
                    </Field>

                    <Field label="Kesulitan">
                      <select value={tingkatKesulitan} onChange={e => setTingkatKesulitan(e.target.value)} className="input">
                        {DAFTAR_KESULITAN.map(item => (
                          <option key={item} value={item}>{item.charAt(0).toUpperCase() + item.slice(1)}</option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Tags">
                      <input
                        value={tags}
                        onChange={e => setTags(e.target.value)}
                        placeholder="TKA, HOTS, UTBK"
                        className="input"
                      />
                    </Field>
                  </div>
                </div>

                {saveLog.length > 0 && (
                  <div style={{ backgroundColor: '#030712', borderRadius: '12px', padding: '16px', maxHeight: '192px', overflowY: 'auto' }}>
                    {saveLog.map((log, index) => (
                      <div key={index} style={{ fontSize: '12px', color: '#4ade80', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', marginBottom: '4px' }}>{log}</div>
                    ))}
                  </div>
                )}

                {saveResult && (
                  <div
                    style={{
                      borderRadius: '12px', paddingLeft: '16px', paddingRight: '16px',
                      paddingTop: '16px', paddingBottom: '16px', fontSize: '14px',
                      border: saveResult.success ? '1px solid #bbf7d0' : '1px solid #fecaca',
                      backgroundColor: saveResult.success ? '#f0fdf4' : '#fef2f2',
                      color: saveResult.success ? '#15803d' : '#b91c1c',
                    }}
                  >
                    {saveResult.success ? (
                      <>
                        <div style={{ fontWeight: '700' }}>🎉 Berhasil!</div>
                        <div style={{ marginTop: '4px' }}>{saveResult.count} soal berhasil disimpan ke Bank Soal.</div>
                        {saveResult.skipped > 0 && (
                          <div style={{ fontSize: '12px', marginTop: '4px' }}>{saveResult.skipped} soal dilewati karena tidak valid.</div>
                        )}
                      </>
                    ) : (
                      <>
                        <div style={{ fontWeight: '700' }}>❌ Gagal</div>
                        <div style={{ marginTop: '4px' }}>{saveResult.error}</div>
                      </>
                    )}
                  </div>
                )}

                {!saveResult?.success && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => downloadJSON(soalList)}
                      style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '12px', paddingBottom: '12px', backgroundColor: '#1f2937', color: '#ffffff', borderRadius: '12px', fontSize: '14px', fontWeight: '700' }}
                    >
                      ⬇️ Download JSON
                    </button>

                    <button type="button" onClick={() => downloadHTMLMaster(soalList)} style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '12px', paddingBottom: '12px', backgroundColor: '#0f766e', color: '#ffffff', borderRadius: '12px', fontSize: '14px', fontWeight: '700' }}>
                      ⬇️ HTML Master
                    </button>

                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      style={{ paddingLeft: '24px', paddingRight: '24px', paddingTop: '12px', paddingBottom: '12px', backgroundColor: '#059669', color: '#ffffff', borderRadius: '12px', fontSize: '14px', fontWeight: '700' }}
                    >
                      {saving ? '⏳ Menyimpan...' : '💾 Simpan Soal Valid ke Bank Soal'}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      <style>
        {`
          .input {
            width: 100%;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            padding: 8px 12px;
            font-size: 14px;
            outline: none;
            background: white;
          }
          .input:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 2px rgba(59,130,246,.15);
          }
          .math-fallback {
            display: inline-block;
            padding: 1px 4px;
            border-radius: 4px;
            background: #f3f4f6;
            color: #374151;
            font-family: Georgia, serif;
          }
          .katex-display {
            overflow-x: auto;
            overflow-y: hidden;
            padding: 4px 0;
          }
          .katex {
            max-width: 100%;
          }
          .rich-text-math-wrap {
            overflow-x: auto;
            max-width: 100%;
          }
          .master-badge { display: inline-flex; align-items: center; gap: 6px; padding: 5px 9px; border-radius: 999px; background: #ecfdf5; border: 1px solid #a7f3d0; color: #047857; font-size: 11px; font-weight: 700; }
          .admin-note {
            display: block;
            margin-top: 6px;
            padding: 8px 10px;
            border-radius: 8px;
            background: #fffbeb;
            border: 1px solid #fde68a;
            color: #92400e;
            font-size: 12px;
          }
          @media (max-width: 640px) {
            .katex-display { max-width: 100%; }
          }
        `}
      </style>
    </div>
  );
}

// ============================================================
// STAT CARD
// ============================================================

function StatCard({ label, value, icon, good = false }) {
  return (
    <div
      style={{
        borderRadius: '12px',
        border: good ? '1px solid #bbf7d0' : '1px solid #e5e7eb',
        padding: '12px',
        backgroundColor: good ? '#f0fdf4' : '#ffffff',
      }}
    >
      <div style={{ fontSize: '18px' }}>{icon}</div>
      <div style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>{value}</div>
      <div style={{ fontSize: '11px', color: '#6b7280' }}>{label}</div>
    </div>
  );
}

// ============================================================
// FIELD
// ============================================================

function Field({ label, children }) {
  return (
    <div>
      <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>{label}</label>
      {children}
    </div>
  );
}

const tabAktifStyle = { fontSize: '12px', padding: '6px 14px', borderRadius: '6px', border: '1px solid #06b6d4', backgroundColor: '#ecfeff', color: '#0e7490', fontWeight: '700', cursor: 'pointer' };
const tabPasifStyle = { fontSize: '12px', padding: '6px 14px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: 'white', color: '#6b7280', cursor: 'pointer' };
const btnBiruKecil = { fontSize: '13px', padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#06b6d4', color: 'white', fontWeight: '700', cursor: 'pointer' };

// ============================================================
// QUESTION PREVIEW
// ============================================================

function QuestionPreview({ question, mathReady, onCropImage, imageStatus = {} }) {
  const q = question;
  const correctIndexes = safeArray(q.opsi_benar);

  // 🔥 BERUBAH: dulu di-filter cuma yang SUDAH punya src (jadi kalau
  // AI sama sekali tidak menyertakan gambar, admin tidak punya cara
  // menambahkannya manual). Sekarang SEMUA entri gambar ditampilkan
  // apa adanya -- termasuk yang kosong/rusak -- supaya slot "Upload
  // Gambar Manual" selalu kelihatan dan bisa diisi admin.
  const semuaGambar = [
    ...safeArray(q.gambar).map((img, i) => ({ img, location: 'soal', imageIndex: i, label: `Gambar soal #${i + 1}` })),
    ...(q.bacaan ? safeArray(q.bacaan.gambar).map((img, i) => ({ img, location: 'bacaan', imageIndex: i, label: `Gambar bacaan #${i + 1}` })) : []),
    ...safeArray(q.opsi_jawaban).flatMap((opt, oi) =>
      safeArray(opt.gambar).map((img, i) => ({ img, location: { opsi: oi }, imageIndex: i, label: `Gambar opsi ${optionLetter(oi)} #${i + 1}` })),
    ),
  ];

  // Ringkasan status gambar soal ini -- dipakai buat badge peringatan
  // di header kartu soal.
  const statusPerGambar = semuaGambar.map(item => imageStatus[kunciGambar(q._idx, item.location, item.imageIndex)]);
  const jumlahRusak = statusPerGambar.filter(s => s === 'broken').length;
  const jumlahDicek = statusPerGambar.filter(s => s === 'checking').length;

  return (
    <div
      style={{
        borderRadius: '16px',
        border: q.valid ? '1px solid #e5e7eb' : '1px solid #fcd34d',
        padding: '16px',
        backgroundColor: q.valid ? '#f9fafb' : '#fffbeb',
      }}
    >
      {/* HEADER */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <span style={{ paddingLeft: '10px', paddingRight: '10px', paddingTop: '4px', paddingBottom: '4px', backgroundColor: '#dbeafe', color: '#1d4ed8', fontSize: '12px', fontWeight: '700', borderRadius: '9999px' }}>
          Soal {q.nomor}
        </span>

        <span style={{ paddingLeft: '10px', paddingRight: '10px', paddingTop: '4px', paddingBottom: '4px', backgroundColor: '#ede9fe', color: '#6d28d9', fontSize: '12px', fontWeight: '700', borderRadius: '9999px' }}>
          {TIPE_LABELS[q.tipe] || q.tipe}
        </span>

        {q.valid ? (
          <span style={{ paddingLeft: '10px', paddingRight: '10px', paddingTop: '4px', paddingBottom: '4px', backgroundColor: '#dcfce7', color: '#15803d', fontSize: '12px', fontWeight: '700', borderRadius: '9999px' }}>✓ Valid</span>
        ) : (
          <span style={{ paddingLeft: '10px', paddingRight: '10px', paddingTop: '4px', paddingBottom: '4px', backgroundColor: '#fef3c7', color: '#b45309', fontSize: '12px', fontWeight: '700', borderRadius: '9999px' }}>⚠ Perlu cek</span>
        )}

        {q.kunci_jawaban && (
          <span style={{ paddingLeft: '10px', paddingRight: '10px', paddingTop: '4px', paddingBottom: '4px', backgroundColor: '#d1fae5', color: '#047857', fontSize: '12px', fontWeight: '700', borderRadius: '9999px', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
            Kunci: {q.kunci_jawaban}
          </span>
        )}

        {q.gambar?.length > 0 && (
          <span style={{ paddingLeft: '10px', paddingRight: '10px', paddingTop: '4px', paddingBottom: '4px', backgroundColor: '#f3e8ff', color: '#7e22ce', fontSize: '12px', fontWeight: '700', borderRadius: '9999px' }}>
            🖼️ {q.gambar.length} gambar
          </span>
        )}

        {q.pembahasan && (
          <span style={{ paddingLeft: '10px', paddingRight: '10px', paddingTop: '4px', paddingBottom: '4px', backgroundColor: '#cffafe', color: '#0e7490', fontSize: '12px', fontWeight: '700', borderRadius: '9999px' }}>💡 Pembahasan</span>
        )}

        {q.materi && (
          <span style={{ paddingLeft: '10px', paddingRight: '10px', paddingTop: '4px', paddingBottom: '4px', backgroundColor: '#ffedd5', color: '#c2410c', fontSize: '12px', fontWeight: '700', borderRadius: '9999px' }}>
            📘 {q.materi}
          </span>
        )}

        {q.tingkat_kesulitan_soal && (
          <span style={{ paddingLeft: '10px', paddingRight: '10px', paddingTop: '4px', paddingBottom: '4px', backgroundColor: '#e0e7ff', color: '#4338ca', fontSize: '12px', fontWeight: '700', borderRadius: '9999px' }}>
            🎯 {q.tingkat_kesulitan_soal.charAt(0).toUpperCase() + q.tingkat_kesulitan_soal.slice(1)} <span style={{ opacity: 0.6, fontWeight: 500 }}>(AI)</span>
          </span>
        )}

        {q.kelas_soal && (
          <span style={{ paddingLeft: '10px', paddingRight: '10px', paddingTop: '4px', paddingBottom: '4px', backgroundColor: '#e0e7ff', color: '#4338ca', fontSize: '12px', fontWeight: '700', borderRadius: '9999px' }}>
            🎓 Kelas {q.kelas_soal} <span style={{ opacity: 0.6, fontWeight: 500 }}>(AI)</span>
          </span>
        )}

        {safeArray(q.tags_soal).map((tag, ti) => (
          <span key={ti} style={{ paddingLeft: '10px', paddingRight: '10px', paddingTop: '4px', paddingBottom: '4px', backgroundColor: '#fce7f3', color: '#9d174d', fontSize: '12px', fontWeight: '700', borderRadius: '9999px' }}>
            🏷️ {tag}
          </span>
        ))}

        {jumlahRusak > 0 && (
          <span style={{ paddingLeft: '10px', paddingRight: '10px', paddingTop: '4px', paddingBottom: '4px', backgroundColor: '#fee2e2', color: '#b91c1c', fontSize: '12px', fontWeight: '700', borderRadius: '9999px' }}>
            ❌ {jumlahRusak} gambar rusak -- perlu upload manual
          </span>
        )}
        {jumlahRusak === 0 && jumlahDicek > 0 && (
          <span style={{ paddingLeft: '10px', paddingRight: '10px', paddingTop: '4px', paddingBottom: '4px', backgroundColor: '#f3f4f6', color: '#6b7280', fontSize: '12px', fontWeight: '700', borderRadius: '9999px' }}>
            ⏳ Memeriksa gambar...
          </span>
        )}
      </div>

      {q.errors?.length > 0 && (
        <div style={{ marginBottom: '12px', borderRadius: '8px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderColor: '#fde68a', padding: '12px', fontSize: '12px', color: '#b45309' }}>
          {q.errors.map((error, index) => <div key={index}>⚠️ {error}</div>)}
        </div>
      )}

      {q.peringatan?.length > 0 && (
        <div style={{ marginBottom: '12px', borderRadius: '8px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', padding: '12px', fontSize: '12px', color: '#1d4ed8' }}>
          {q.peringatan.map((p, index) => <div key={index}>ℹ️ {p}</div>)}
        </div>
      )}

      {/* BACAAN / STIMULUS (kalau ada) */}
      {q.bacaan && (q.bacaan.teks || safeArray(q.bacaan.gambar).length > 0) && (
        <div
          style={{
            marginBottom: '12px',
            borderRadius: '12px',
            border: '1px solid #e0e7ff',
            backgroundColor: '#eef2ff',
            padding: '12px',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#4338ca', marginBottom: '6px' }}>
            📖 BACAAN / DATA (dipakai untuk soal ini){q.bacaan.grup ? ` — grup: ${q.bacaan.grup}` : ''}
          </div>
          <RichText text={q.bacaan.teks} gambar={q.bacaan.gambar} mathReady={mathReady} />
        </div>
      )}

      {/* QUESTION */}
      <RichText text={q.teks_soal} gambar={q.gambar} mathReady={mathReady} />

      {q.tabel_soal && <QuestionTable table={q.tabel_soal} mathReady={mathReady} />}

      {(q.satuan_jawaban || q.toleransi_jawaban !== null || safeArray(q.jawaban_ekuivalen).length > 0) && (
        <div style={{ marginTop: '12px', borderRadius: '10px', padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '12px', color: '#475569' }}>
          {q.satuan_jawaban && <span style={{ marginRight: '14px' }}>Satuan jawaban: <strong>{q.satuan_jawaban}</strong></span>}
          {q.toleransi_jawaban !== null && <span style={{ marginRight: '14px' }}>Toleransi: <strong>{q.toleransi_jawaban}</strong></span>}
          {safeArray(q.jawaban_ekuivalen).length > 0 && <span>Jawaban ekuivalen: <strong>{q.jawaban_ekuivalen.join(', ')}</strong></span>}
        </div>
      )}

      {/* OPTIONS (teks / gambar / tabel per opsi) */}
      {q.opsi_jawaban?.length > 0 && (
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {q.opsi_jawaban.map((option, optionIndex) => {
            const isCorrect = Boolean(correctIndexes[optionIndex]);

            return (
              <div
                key={optionIndex}
                style={{
                  display: 'flex', gap: '12px', alignItems: 'flex-start',
                  borderRadius: '12px', paddingLeft: '12px', paddingRight: '12px',
                  paddingTop: '10px', paddingBottom: '10px',
                  border: isCorrect ? '1px solid #86efac' : '1px solid #e5e7eb',
                  backgroundColor: isCorrect ? '#f0fdf4' : '#ffffff',
                }}
              >
                <div
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '28px', height: '28px', borderRadius: '9999px',
                    fontSize: '12px', fontWeight: '700', flexShrink: 0,
                    backgroundColor: isCorrect ? '#16a34a' : '#f3f4f6',
                    color: isCorrect ? '#ffffff' : '#4b5563',
                  }}
                >
                  {optionLetter(optionIndex)}
                </div>

                <div style={{ flex: '1' }}>
                  {option.teks && (
                    <RichText text={option.teks} gambar={[]} mathReady={mathReady} />
                  )}

                  {safeArray(option.gambar).length > 0 && (
                    <div style={option.teks ? { marginTop: '8px' } : undefined}>
                      {option.gambar.map((image, gi) => (
                        <div
                          key={gi}
                          dangerouslySetInnerHTML={{ __html: imageFigureHtml(image) }}
                        />
                      ))}
                    </div>
                  )}

                  {safeArray(option.tabel).length > 0 && <OptionTable rows={option.tabel} />}
                </div>

                {isCorrect && (
                  <span style={{ color: '#16a34a', fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap' }}>✓ BENAR</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* PERNYATAAN BENAR/SALAH -- didesain menyerupai lembar jawaban CBT resmi:
          bernomor, kolom Benar/Salah eksplisit dengan tanda centang di kolom
          yang benar, warna netral (bukan warna-warni), tanpa animasi. Dipakai
          bersama untuk tipe "benar_salah" (field pernyataan) maupun
          "pg_kategori" (field tabel_benar_salah) -- bentuknya sama. */}
      {(q.tabel_benar_salah?.length > 0 || q.pernyataan?.length > 0) && (() => {
        const baris = q.tabel_benar_salah?.length ? q.tabel_benar_salah : q.pernyataan;
        return (
          <div style={{ marginTop: '16px', borderRadius: '10px', border: '1px solid #cbd5e1', overflow: 'hidden', backgroundColor: '#ffffff' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ backgroundColor: '#1e293b' }}>
                  <th style={{ width: '36px', padding: '10px 8px', textAlign: 'center', color: '#e2e8f0', fontWeight: '600', fontSize: '12px', borderRight: '1px solid #334155' }}>No</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: '#e2e8f0', fontWeight: '600', fontSize: '12px' }}>Pernyataan</th>
                  <th style={{ width: '76px', padding: '10px 6px', textAlign: 'center', color: '#e2e8f0', fontWeight: '600', fontSize: '12px', borderLeft: '1px solid #334155' }}>Benar</th>
                  <th style={{ width: '76px', padding: '10px 6px', textAlign: 'center', color: '#e2e8f0', fontWeight: '600', fontSize: '12px', borderLeft: '1px solid #334155' }}>Salah</th>
                </tr>
              </thead>
              <tbody>
                {baris.map((item, index) => {
                  const teks = typeof item === 'object' ? (item.pernyataan || item.teks || '') : String(item);
                  const jawabanRaw = typeof item === 'object' ? safeString(item.jawaban) : '';
                  const jawabanNorm = jawabanRaw.trim().toLowerCase();
                  const isBenar = ['benar', 'true', 'ya', 'b'].includes(jawabanNorm);
                  const isSalah = ['salah', 'false', 'tidak', 's'].includes(jawabanNorm);

                  return (
                    <tr key={index} style={{ borderTop: index > 0 ? '1px solid #e2e8f0' : 'none', backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                      <td style={{ padding: '10px 8px', textAlign: 'center', color: '#64748b', fontWeight: '600', borderRight: '1px solid #e2e8f0', verticalAlign: 'top' }}>
                        {index + 1}
                      </td>
                      <td style={{ padding: '10px 14px', color: '#1e293b', verticalAlign: 'top' }}>
                        <RichText text={teks} gambar={[]} mathReady={mathReady} />
                      </td>
                      <td style={{ padding: '10px 6px', textAlign: 'center', borderLeft: '1px solid #e2e8f0', verticalAlign: 'middle' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: '22px', height: '22px', borderRadius: '4px',
                          border: isBenar ? '2px solid #15803d' : '1.5px solid #cbd5e1',
                          backgroundColor: isBenar ? '#15803d' : 'transparent',
                          color: isBenar ? '#ffffff' : 'transparent',
                          fontSize: '13px', fontWeight: '700', lineHeight: 1,
                        }}>✓</span>
                      </td>
                      <td style={{ padding: '10px 6px', textAlign: 'center', borderLeft: '1px solid #e2e8f0', verticalAlign: 'middle' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: '22px', height: '22px', borderRadius: '4px',
                          border: isSalah ? '2px solid #b91c1c' : '1.5px solid #cbd5e1',
                          backgroundColor: isSalah ? '#b91c1c' : 'transparent',
                          color: isSalah ? '#ffffff' : 'transparent',
                          fontSize: '13px', fontWeight: '700', lineHeight: 1,
                        }}>✓</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {baris.some(item => {
              const j = (typeof item === 'object' ? safeString(item.jawaban) : '').trim().toLowerCase();
              return !['benar', 'true', 'ya', 'b', 'salah', 'false', 'tidak', 's'].includes(j);
            }) && (
              <div style={{ padding: '8px 14px', fontSize: '11.5px', color: '#b45309', backgroundColor: '#fffbeb', borderTop: '1px solid #fde68a' }}>
                ⚠️ Ada pernyataan yang jawabannya belum jelas Benar/Salah — kolom dikosongkan, cek manual sebelum simpan.
              </div>
            )}
          </div>
        );
      })()}

      {/* MATCHING */}
      {q.pasangan?.length > 0 && (
        <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(1, minmax(0, 1fr))', gap: '8px' }}>
          {q.pasangan.map((pair, index) => (
            <div key={index} style={{ borderRadius: '8px', border: '1px solid #e5e7eb', borderColor: '#e5e7eb', backgroundColor: '#ffffff', padding: '12px', fontSize: '14px' }}>
              <div style={{ fontWeight: '600' }}>{pair.kiri}</div>
              <div style={{ color: '#2563eb', marginTop: '4px', marginBottom: '4px' }}>↕</div>
              <div>{pair.kanan}</div>
            </div>
          ))}
        </div>
      )}

      {/* PEMBAHASAN */}
      {q.pembahasan && (
        <div style={{ marginTop: '16px', borderRadius: '12px', border: '1px solid #e5e7eb', borderColor: '#a5f3fc', backgroundColor: '#ecfeff', padding: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#0e7490', marginBottom: '8px' }}>💡 PEMBAHASAN</div>
          <RichText text={q.pembahasan} gambar={[]} mathReady={mathReady} />
        </div>
      )}

      {q.kunci_terverifikasi && (
        <div style={{ marginTop: '12px', fontSize: '12px', color: '#15803d', fontWeight: '600' }}>✓ Kunci jawaban terverifikasi.</div>
      )}

      {!q.kunci_terverifikasi && (
        <div style={{ marginTop: '12px', fontSize: '12px', color: '#b45309', fontWeight: '600' }}>⚠️ Kunci jawaban BELUM terverifikasi — cek ulang sebelum dipublikasi.</div>
      )}

      {/* CATATAN ADMIN — hanya tampil di panel review ini, TIDAK disimpan sebagai bagian pembahasan yang dibaca siswa */}
      {q.catatan_admin && (
        <div style={{ marginTop: '12px', borderRadius: '12px', border: '1px solid #fde68a', backgroundColor: '#fffbeb', padding: '12px 14px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#92400e', marginBottom: '4px' }}>
            📝 CATATAN UNTUK ADMIN (tidak tampil ke siswa)
          </div>
          <div style={{ fontSize: '13px', color: '#78350f', lineHeight: 1.5 }}>{q.catatan_admin}</div>
        </div>
      )}

      {/* PANEL KELOLA GAMBAR: crop / upload manual / lihat status validasi */}
      {semuaGambar.length > 0 && onCropImage && (
        <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px dashed #d1d5db' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', marginBottom: '8px' }}>
            🖼️ KELOLA GAMBAR ({semuaGambar.length}){jumlahRusak > 0 ? ` -- ${jumlahRusak} PERLU DIPERBAIKI` : ''}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {semuaGambar.map((item, i) => (
              <div key={i}>
                <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '2px' }}>{item.label}</div>
                <ImageWithCrop
                  image={item.img}
                  status={imageStatus[kunciGambar(q._idx, item.location, item.imageIndex)]}
                  onCropped={newDataUrl => onCropImage(q._idx, item.location, item.imageIndex, newDataUrl)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}