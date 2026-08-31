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
    benar_salah: 'Benar / Salah (pernyataan majemuk)',
    isian_singkat: 'Isian Singkat',
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
  // SAFE HELPERS
  // ============================================================
  
  function safeString(value, fallback = '') {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return fallback;
  }
  
  function safeArray(value) {
    return Array.isArray(value) ? value : [];
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
      benar_salah: 'benar_salah',
      true_false: 'benar_salah',
      isian: 'isian_singkat',
      isian_singkat: 'isian_singkat',
      short_answer: 'isian_singkat',
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
  
    const tipe = normalizeTipe(q.tipe || q.type || q.jenis || q.jenis_soal);
  
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
  
    if (!teksSoal.trim()) errors.push('Teks soal kosong.');
  
    if (['pg_sederhana', 'pg_kompleks'].includes(tipe) && opsiJawaban.length < 2) {
      errors.push('Pilihan jawaban kurang dari 2.');
    }
  
    if (['pg_sederhana', 'pg_kompleks'].includes(tipe) && !kunciJawaban) {
      errors.push('Kunci jawaban belum ditemukan.');
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
      pernyataan,
      tabel_benar_salah: tabelBenarSalah,
      pasangan,
      kunci_jawaban: kunciJawaban,
      kunci_terverifikasi: safeBoolean(
        q.kunci_terverifikasi ?? q.kunciTerverifikasi ?? q.verifiedAnswer ?? false,
      ),
      pembahasan: safeString(q.pembahasan || q.penjelasan || q.explanation || q.solusi || ''),
      catatan_admin: safeString(q.catatan_admin || q.catatanAdmin || q.admin_note || ''),
      gambar,
      materi: safeString(q.materi || q.meta_materi || ''),
      capaian_pembelajaran: safeString(q.capaian_pembelajaran || q.meta_capaian_pembelajaran || ''),
      valid: errors.length === 0,
      errors,
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
      if (depth === 0 && source.startsWith('\\item', i)) {
        const cmd = readTexCommandWithArgs(source, i);
        if (current) items.push({ raw: source.slice(current.contentStart, i).trim(), start: current.start, end: i });
        current = { start: i, contentStart: cmd ? cmd.end : i + 5 };
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

  function normalizeChoiceCommand(item) {
    const correct = findTexCommand(item, ['correctchoice']);
    if (correct?.requiredArgs?.length) return { text: correct.requiredArgs[0], correct: true };
    const choice = findTexCommand(item, ['choice']);
    if (choice?.requiredArgs?.length) return { text: choice.requiredArgs[0], correct: false };
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
      const optionEnv = findTexEnvironment(content, ['choices', 'options', 'enumerate', 'itemize']);
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
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const maxW = 640;
        const scale = img.naturalWidth > maxW ? maxW / img.naturalWidth : 1;
        setDisplaySize({ w: img.naturalWidth * scale, h: img.naturalHeight * scale });
        setImgEl(img);
      };
      img.onerror = () => {
        alert('Gambar gagal dimuat untuk di-crop (kemungkinan URL belum diupload / CORS diblokir).');
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
        }}
      >
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '20px', maxWidth: '90vw' }}>
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
  
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
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
  
  function ImageWithCrop({ image, onCropped }) {
    const [cropping, setCropping] = useState(false);
    const src = getImageSrc(image);
  
    if (!src) return null;
  
    return (
      <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '4px', marginRight: '10px', marginBottom: '10px' }}>
        <img
          src={src}
          alt={image.deskripsi || 'Gambar'}
          style={{ width: '120px', height: '90px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb' }}
        />
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
      kunciTerverifikasi: q.kunci_terverifikasi,
      pembahasan: q.pembahasan,
      catatanAdmin: q.catatan_admin || '',
      gambarUrls,
      materi: q.materi || '',
      capaianPembelajaran: q.capaian_pembelajaran || '',
      mataPelajaran: meta.mataPelajaran,
      tingkatKelas: meta.tingkatKelas,
      jenjang: meta.jenjang,
      kategori: meta.kategori,
      tags: meta.tags,
      tingkatKesulitan: meta.tingkatKesulitan,
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
  
    const [format, setFormat] = useState('json');
    const [rawInput, setRawInput] = useState('');
    const [sumberAI, setSumberAI] = useState('Gemini Canvas');
  
    const [soalList, setSoalList] = useState([]);
    const [parseError, setParseError] = useState('');
    const [warnings, setWarnings] = useState([]);
  
    const [mataPelajaran, setMataPelajaran] = useState('Matematika');
    const [tingkatKelas, setTingkatKelas] = useState('10');
    const [jenjang, setJenjang] = useState('SMA/MA');
    const [kategori, setKategori] = useState('');
    const [tags, setTags] = useState('');
    const [tingkatKesulitan, setTingkatKesulitan] = useState('sedang');
    const [sumberFile, setSumberFile] = useState('');
  
    const [saving, setSaving] = useState(false);
    const [saveResult, setSaveResult] = useState(null);
    const [saveLog, setSaveLog] = useState([]);

    // -------- Prompt AI khusus (generate prompt sinkron dengan skema sistem) --------
    const [showPromptPanel, setShowPromptPanel] = useState(false);
    const [catatanPrompt, setCatatanPrompt] = useState('');
    const [promptCopied, setPromptCopied] = useState(false);

    const generatedPrompt = useMemo(() => buildMasterPrompt({
      mataPelajaran,
      jenjang,
      tingkatKelas,
      tingkatKesulitan,
      catatanTambahan: catatanPrompt,
    }), [mataPelajaran, jenjang, tingkatKelas, tingkatKesulitan, catatanPrompt]);

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
  
    const handleCropImage = useCallback((idx, location, imageIndex, newDataUrl) => {
      setSoalList(prev => prev.map(q => {
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
      }));
    }, []);
  
    // ----------------------------------------------------------
    // PARSE (dipakai bareng oleh tombol Parse & oleh auto-parse setelah upload file)
    // ----------------------------------------------------------
  
    const runParse = useCallback((content, formatOverride) => {
      setParseError('');
      setWarnings([]);
      setSoalList([]);
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
          : activeFormat === 'tex' ? parseTeX(content)
          : parseCSV(content);
        const normalized = raw
          .map((question, index) => normalizeSoal(question, index))
          .map((q, index) => ({ ...q, _idx: index }));
  
        const warningList = normalized
          .filter(q => !q.valid)
          .map(q => `Soal ${q.nomor}${q.paket ? ` (Paket ${q.paket})` : ''}: ${q.errors.join(' ')}`);
  
        setWarnings(warningList);
        setSoalList(normalized);
      } catch (error) {
        console.error('Parse error:', error);
        setParseError(error?.message || 'Gagal membaca data.');
      }
    }, [format]);
  
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
  
      setSaving(true);
      setSaveResult(null);
      setSaveLog([]);
  
      const logs = [];
      const addLog = message => { logs.push(message); setSaveLog([...logs]); };
  
      const meta = {
        mataPelajaran,
        tingkatKelas,
        jenjang,
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
    }, [soalList, mataPelajaran, tingkatKelas, jenjang, kategori, tags, tingkatKesulitan, sumberFile, sumberAI]);
  
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
                    Generate prompt siap-pakai yang mengikuti struktur field sistem ini persis (bukan mengikuti bentuk
                    PDF sumber). Tempel ke AI apa pun (Claude, ChatGPT, Gemini, dll) bersama file PDF/gambar soal —
                    hasil JSON-nya otomatis bisa langsung diupload ke bawah tanpa perlu diedit ulang.
                  </p>
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
                      Alur pemakaian: 1) Copy prompt ini → 2) Tempel ke AI + lampirkan PDF/gambar soal →
                      3) Salin JSON hasilnya → 4) Upload / tempel di kotak "Format" di bawah.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* FORMAT */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e5e7eb', borderColor: '#e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#4b5563' }}>Format:</span>
  
                {['json', 'csv', 'tex'].map(currentFormat => (
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
                    {currentFormat === 'tex' ? '.TEX' : currentFormat.toUpperCase()}
                    <span style={{ marginLeft: '4px', fontSize: '10px', opacity: 0.7 }}>
                      {currentFormat === 'json'
                        ? 'Gambar + tabel + pembahasan'
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
                    accept=".json,.csv,.tex,application/json,text/csv,text/x-tex"
                    onChange={handleFile}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
  
              <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '-8px' }}>
                Ini satu-satunya jalur upload: pilih 1 file JSON (boleh berisi banyak paket sekaligus),
                otomatis langsung ter-parse & dikelompokkan. Kotak teks di bawah hanya untuk
                tempel manual / edit cepat sebagai alternatif, bukan jalur upload terpisah.
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
                  <label style={{ fontSize: '12px', color: '#6b7280' }}>Paste {format.toUpperCase()}</label>
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
                    format === 'tex'
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
                  <div style={{ fontWeight: '700', marginBottom: '4px' }}>❌ JSON/CSV/.tex tidak dapat diproses</div>
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
  
                  {/* METADATA */}
                  <div style={{ borderTop: '1px solid #e5e7eb', borderColor: '#f3f4f6', paddingTop: '20px' }}>
                    <h3 style={{ fontWeight: '700', color: '#374151', marginBottom: '12px' }}>Metadata Soal</h3>
  
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, minmax(0, 1fr))', gap: '12px' }}>
                      <Field label="Mata Pelajaran">
                        <select value={mataPelajaran} onChange={e => setMataPelajaran(e.target.value)} className="input">
                          {DAFTAR_MAPEL.map(mapel => <option key={mapel} value={mapel}>{mapel}</option>)}
                        </select>
                      </Field>
  
                      <Field label="Jenjang">
                        <select value={jenjang} onChange={e => setJenjang(e.target.value)} className="input">
                          {DAFTAR_JENJANG.map(item => <option key={item} value={item}>{item}</option>)}
                        </select>
                      </Field>
  
                      <Field label="Kelas">
                        <select value={tingkatKelas} onChange={e => setTingkatKelas(e.target.value)} className="input">
                          {DAFTAR_KELAS.map(item => <option key={item} value={item}>Kelas {item}</option>)}
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
  
  // ============================================================
  // QUESTION PREVIEW
  // ============================================================
  
  function QuestionPreview({ question, mathReady, onCropImage }) {
    const q = question;
    const correctIndexes = safeArray(q.opsi_benar);
  
    const semuaGambar = [
      ...safeArray(q.gambar).map((img, i) => ({ img, location: 'soal', imageIndex: i, label: `Gambar soal #${i + 1}` })),
      ...(q.bacaan ? safeArray(q.bacaan.gambar).map((img, i) => ({ img, location: 'bacaan', imageIndex: i, label: `Gambar bacaan #${i + 1}` })) : []),
      ...safeArray(q.opsi_jawaban).flatMap((opt, oi) =>
        safeArray(opt.gambar).map((img, i) => ({ img, location: { opsi: oi }, imageIndex: i, label: `Gambar opsi ${optionLetter(oi)} #${i + 1}` })),
      ),
    ].filter(item => getImageSrc(item.img));
  
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
        </div>
  
        {q.errors?.length > 0 && (
          <div style={{ marginBottom: '12px', borderRadius: '8px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderColor: '#fde68a', padding: '12px', fontSize: '12px', color: '#b45309' }}>
            {q.errors.map((error, index) => <div key={index}>⚠️ {error}</div>)}
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
              📖 BACAAN / DATA (dipakai untuk soal ini)
            </div>
            <RichText text={q.bacaan.teks} gambar={q.bacaan.gambar} mathReady={mathReady} />
          </div>
        )}
  
        {/* QUESTION */}
        <RichText text={q.teks_soal} gambar={q.gambar} mathReady={mathReady} />
  
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
  
        {/* TRUE FALSE */}
        {q.tabel_benar_salah?.length > 0 && (
          <div style={{ marginTop: '16px', borderRadius: '12px', border: '1px solid #e5e7eb', borderColor: '#e5e7eb', backgroundColor: '#ffffff', overflow: 'hidden' }}>
            <div style={{ paddingLeft: '12px', paddingRight: '12px', paddingTop: '8px', paddingBottom: '8px', backgroundColor: '#f3f4f6', fontSize: '12px', fontWeight: '700', color: '#374151' }}>Pernyataan</div>
            {q.tabel_benar_salah.map((item, index) => (
              <div key={index} style={{ display: 'grid', gridTemplateColumns: 'repeat(1, minmax(0, 1fr))', borderTop: '1px solid #e5e7eb', borderColor: '#e5e7eb' }}>
                <div style={{ padding: '12px', fontSize: '14px' }}>
                  {typeof item === 'object'
                    ? <RichText text={item.pernyataan} gambar={[]} mathReady={mathReady} />
                    : item}
                </div>
                <div style={{ padding: '12px', fontSize: '14px', fontWeight: '700', textAlign: 'center' }}>
                  {typeof item === 'object' ? item.jawaban : ''}
                </div>
              </div>
            ))}
          </div>
        )}
  
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
  
        {/* PANEL KELOLA & CROP GAMBAR */}
        {semuaGambar.length > 0 && onCropImage && (
          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px dashed #d1d5db' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', marginBottom: '8px' }}>
              🖼️ KELOLA & CROP GAMBAR ({semuaGambar.length})
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {semuaGambar.map((item, i) => (
                <div key={i}>
                  <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '2px' }}>{item.label}</div>
                  <ImageWithCrop
                    image={item.img}
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