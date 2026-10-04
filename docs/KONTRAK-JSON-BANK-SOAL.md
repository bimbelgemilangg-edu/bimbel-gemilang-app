# KONTRAK JSON BANK SOAL — standar sistem Bimbel Gemilang

> **Dokumen ini adalah RUJUKAN RESMI** bentuk JSON yang diterima halaman
> **Admin → Bank Soal & Perkakas → Mesin Bank Soal** (tombol upload `.json`/`.txt`).
> Ia direkonstruksi langsung dari kode validatornya
> (`src/utils/bankSoalSanitizer.js`) dan mesin skoringnya
> (`src/utils/skorSoalTryOut.js`, `src/utils/skoringSoalKompleks.js`) —
> jadi apa yang tertulis di sini adalah apa yang benar-benar diterima sistem,
> bukan harapan.
>
> ⚠️ JANGAN TERTUKAR dengan standar lain yang juga ada di repo ini:
> | Standar | Bentuk | Untuk | Validator |
> |---|---|---|---|
> | **KONTRAK INI** | daftar soal 12-field | bank soal → **try out** | `bankSoalSanitizer.js` (otomatis saat upload) |
> | Draft materi | `{materi, bab:[{sections, ujiPemahaman}]}` | impor materi/buku | `scripts/validasi-draft.mjs` + `docs/PROMPT-PRODUKSI-MATERI-UNTUK-AI-LAIN.md` |
>
> Soal ber-tipe `pg`/`pgMulti` gaya draft lama akan DITOLAK lembut di sini
> (tipe tak dikenal → dipaksa jadi `pg_sederhana` + warning). Pakai enum di bawah.

---

## 1. Bentuk terluar

Salah satu dari tiga bentuk ini (validator menerima semuanya):

```jsonc
[ {soal1}, {soal2}, ... ]                 // array langsung
{ "questions": [ {soal1}, ... ] }         // objek ber-key questions
{ "soal": [ {soal1}, ... ] }              // objek ber-key soal
```

Tidak perlu bungkus metadata lain. Mapel/jenjang/kelas diisi lewat **kolom
petunjuk di halaman upload** (itu yang memenangkan taksonomi), bukan di dalam file.

## 2. Kontrak 12 field per soal

| Field | Tipe | Wajib untuk | Isi |
|---|---|---|---|
| `nomor` | number | semua | nomor urut. Hilang → diisi otomatis urutan file + warning |
| `tipe` | string | semua | salah satu dari 5 enum di bawah |
| `teksSoal` | string | semua | teks soal. LaTeX pakai **backslash ganda** (lihat §4) |
| `opsiJawaban` | string[] | `pg_sederhana`, `pg_kompleks` | daftar pilihan, tanpa huruf "A." di depan |
| `pernyataan` | string[] | `pg_kompleks` | pernyataan yang dinilai benar/salah oleh siswa |
| `tabelBenarSalah` | object[] | `benar_salah` | `[{ "pernyataan": "...", "kunci": "benar"\|"salah" }]` |
| `pasangan` | object[] | `menjodohkan` | `[{ "kiri": "...", "kanan": "..." }]` = pasangan BENARnya |
| `kunciJawaban` | lihat §3 | semua | format berbeda per tipe |
| `gambar` | object[] | opsional | `[{ "id": "GAMBAR_1", "deskripsi": "..." }]` |
| `topik` | string | semua (dianjurkan kuat) | bab/topik, mis. "Relasi dan Fungsi". Kosong → warning |
| `subtopik` | string | opsional | mis. "Domain dan Kodomain" |
| `topikBaru` | boolean | opsional | true jika topik ini belum ada di taksonomi |

Field yang tidak relevan dengan tipenya boleh dikosongkan (`[]` / `""`) —
validator menormalkannya, tidak menolak.

### Enum `tipe` (persis, huruf kecil, underscore)

| Nilai | Arti |
|---|---|
| `pg_sederhana` | pilihan ganda satu jawaban |
| `pg_kompleks` | pilihan ganda kompleks: centang pernyataan yang benar |
| `benar_salah` | tabel pernyataan, siswa memilih benar/salah per baris |
| `isian_singkat` | isian teks pendek |
| `menjodohkan` | menjodohkan kiri–kanan |
| `esai` | uraian bebas: siswa mengetik di kotak jawaban ATAU memotret jawaban tulisan tangan; dinilai MANUAL oleh admin (0–100) di Hasil Try Out |

## 3. Format `kunciJawaban` per tipe (ini yang paling sering salah)

| Tipe | Format | Contoh |
|---|---|---|
| `pg_sederhana` | SATU huruf besar posisi opsi | `"B"` |
| `pg_kompleks` | array huruf yang benar | `["A", "C", "D"]` |
| `benar_salah` | tidak dipakai (kunci ada di tiap baris `tabelBenarSalah`) | `""` |
| `menjodohkan` | tidak dipakai (kunci = pemetaan `pasangan`) | `""` |
| `isian_singkat` | teks jawaban persis | `"fotosintesis"` |
| `esai` | teks jawaban rujukan/rubrik penilai (tidak untuk mencocokkan otomatis) | `"memuat istilah klorofil, cahaya, glukosa"` |

- Untuk `isian_singkat` sediakan juga `jawabanEkuivalen: ["...","..."]`
  (array string) bila ada ejaan/sinonim yang juga benar — mesin skor
  menerimanya sebagai kunci tambahan.
- Skoring `pg_kompleks`: `(centang benar − centang salah) ÷ jumlah kunci`.
  Jadi kunci yang kosong membuat soal bernilai 0 — jangan pernah kosong.

## 4. Aturan LaTeX & karakter (pelanggaran paling umum AI)

1. **Backslash wajib ganda di dalam JSON**: tulis `"\\frac{1}{2}"`,
   BUKAN `"\frac{1}{2}"`. Backslash tunggal membuat JSON tidak valid
   menurut spesifikasi, atau lebih buruk: diam-diam memakan huruf perintah
   LaTeX (`\begin`, `\frac`, `\neq` ...) tanpa error sama sekali.
   Validator mencoba memperbaiki, tapi jangan mengandalkan perbaikan.
2. Kurung kurawal himpunan: `"\\{2, 3\\}"` — bukan `"{2, 3}"`.
   (Insiden nyata: Matematika Bab 7 tayang sebagai "A = 2, 3".)
3. D kutip di dalam teks soal harus di-escape: `\"`.
4. Tidak boleh ada aksara CJK (China/Jepang/Korea) terselip — penjaga CI menolak.
5. Gambar: tempatkan placeholder `{{GAMBAR_1}}` di `teksSoal` PERSIS sama
   dengan `id` di field `gambar`. Placeholder tanpa pasangan = warning.

## 5. Contoh minimal per tipe

```json
[
  {
    "nomor": 1,
    "tipe": "pg_sederhana",
    "teksSoal": "Himpunan penyelesaian dari $x + 2 = 5$ adalah ....",
    "opsiJawaban": ["$\\{2\\}$", "$\\{3\\}$", "$\\{4\\}$", "$\\{5\\}$"],
    "pernyataan": [], "tabelBenarSalah": [], "pasangan": [],
    "kunciJawaban": "B",
    "gambar": [], "topik": "Persamaan Linear", "subtopik": "", "topikBaru": false
  },
  {
    "nomor": 2,
    "tipe": "pg_kompleks",
    "teksSoal": "Pernyataan yang BENAR tentang senyawa ion adalah ....",
    "opsiJawaban": [],
    "pernyataan": [
      "Lelehannya menghantarkan listrik",
      "Titik leleh umumnya tinggi",
      "Tidak pernah larut dalam air"
    ],
    "tabelBenarSalah": [], "pasangan": [],
    "kunciJawaban": ["A", "B"],
    "gambar": [], "topik": "Ikatan Kimia", "subtopik": "Senyawa Ion", "topikBaru": false
  },
  {
    "nomor": 3,
    "tipe": "benar_salah",
    "teksSoal": "Tentukan nilai kebenaran pernyataan berikut.",
    "opsiJawaban": [], "pernyataan": [],
    "tabelBenarSalah": [
      { "pernyataan": "Fotosintesis terjadi di kloroplas", "kunci": "benar" },
      { "pernyataan": "Respirasi terjadi di ribosom", "kunci": "salah" }
    ],
    "pasangan": [], "kunciJawaban": "",
    "gambar": [], "topik": "Sel", "subtopik": "", "topikBaru": false
  },
  {
    "nomor": 4,
    "tipe": "isian_singkat",
    "teksSoal": "Proses perubahan wujud dari padat langsung ke gas disebut ....",
    "opsiJawaban": [], "pernyataan": [], "tabelBenarSalah": [], "pasangan": [],
    "kunciJawaban": "menyublim",
    "jawabanEkuivalen": ["sublimasi"],
    "gambar": [], "topik": "Wujud Zat", "subtopik": "", "topikBaru": false
  },
  {
    "nomor": 5,
    "tipe": "esai",
    "teksSoal": "Sebuah kubus memiliki rusuk 6 cm. Jelaskan langkah menentukan volumenya tanpa rumus jadi.",
    "opsiJawaban": [], "pernyataan": [], "tabelBenarSalah": [], "pasangan": [],
    "kunciJawaban": "Rubrik: menyebut rusuk×rusuk×rusuk atau 6×6×6 (=216 cm³) dan satuan benar",
    "gambar": [], "topik": "Bangun Ruang", "subtopik": "Kubus", "topikBaru": false
  },
  {
    "nomor": 6,
    "tipe": "menjodohkan",
    "teksSoal": "Pasangkan tokoh dengan penemuannya.",
    "opsiJawaban": [], "pernyataan": [], "tabelBenarSalah": [],
    "pasangan": [
      { "kiri": "Bohr", "kanan": "Model kulit atom" },
      { "kiri": "Rutherford", "kanan": "Inti atom" }
    ],
    "kunciJawaban": "",
    "gambar": [], "topik": "Struktur Atom", "subtopik": "", "topikBaru": false
  }
]
```

## 6. Perilaku validator (supaya tidak kaget)

- **Tidak ada soal yang dibuang diam-diam.** Soal janggal tetap masuk,
  ditandai `__valid: false` + daftar `__warnings`, dan halaman upload
  menampilkan ringkasan "perlu dicek N soal" beserta alasannya.
- Tipe tak dikenal → dipaksa `pg_sederhana` + warning.
- `nomor` hilang → diisi urutan + warning.
- JSON rusak → tiga lapis usaha: parse langsung → perbaiki escape →
  selamatkan sebagian soal yang utuh (dengan laporan berapa yang terselamatkan).

---

## 7. 📜 PROMPT SIAP SALIN untuk AI produsen soal

Salin seluruh blok di bawah ini sebagai prompt ke Gemini/ChatGPT/Claude,
lalu tempel mapel+bab+sumber yang Anda mau di bagian akhir.

```
Kamu adalah TIM KURIKULUM BIMBEL GEMILANG. Hasil akhirnya SATU file JSON
yang akan diupload ke halaman Mesin Bank Soal. Patuhi kontrak berikut
TANPA pengecualian:

1. Bentuk terluar: array objek soal. Tanpa teks penjelasan di luar JSON,
   tanpa markdown fence, tanpa komentar.
2. Setiap soal punya 12 field persis: nomor, tipe, teksSoal, opsiJawaban,
   pernyataan, tabelBenarSalah, pasangan, kunciJawaban, gambar, topik,
   subtopik, topikBaru. Field yang tidak dipakai diisi [] atau "" atau false.
3. Nilai tipe hanya: pg_sederhana | pg_kompleks | benar_salah |
   isian_singkat | menjodohkan | esai. Untuk tipe esai: kunciJawaban diisi
   RUBRIK/jawaban rujukan untuk penilai manusia (bukan pencocok otomatis).
4. kunciJawaban: pg_sederhana = satu huruf besar; pg_kompleks = array huruf;
   isian_singkat = teks persis (+ jawabanEkuivalen bila ada sinonim);
   benar_salah & menjodohkan = "" (kunci ada di tabelBenarSalah / pasangan).
5. LaTeX WAJIB backslash ganda di dalam string JSON ("\\frac{1}{2}").
   Kurung himpunan WAJIB "\\{" dan "\\}". D kutip di dalam teks di-escape.
6. Tidak boleh ada aksara China/Jepang/Korea di mana pun.
7. opsiJawaban tanpa huruf "A." di depan — huruf ditambahkan sistem.
8. gambar: hanya bila ada aset; placeholder di teksSoal ditulis
   {{GAMBAR_n}} dan wajib punya pasangan di field gambar dengan id sama.
9. topik WAJIB diisi nama bab yang saya sebut di bawah; subtopik diisi
   bila ada; topikBaru=false kecuali saya bilang sebaliknya.
10. Sebelum menjawab, periksa sendiri: (a) setiap pg_sederhana punya
    opsiJawaban tidak kosong dan kunciJawaban berada di rentang opsi;
    (b) setiap pg_kompleks punya pernyataan tidak kosong dan kunci tidak
    kosong; (c) JSON valid menurut spesifikasi RFC 8259.

Sekarang buat 20 soal: MAPEL=..., KELAS=..., BAB=..., SUMBER=....
Sebar tipe: minimal 12 pg_sederhana, 4 pg_kompleks, 2 benar_salah,
2 isian_singkat. Bila diminta owner, tambah maksimal 2 esai dengan rubrik
penilaian yang jelas di kunciJawaban. Tingkat kesulitan: 6 mudah, 10 sedang, 4 sulit.
```

Setelah JSON kembali dari AI: upload di
**Admin → Bank Soal & Perkakas → Mesin Bank Soal**, isi kolom petunjuk
(mapel/jenjang/kelas), lihat ringkasan "perlu dicek" — periksa soal
ber-warning sebelum menyimpan ke bank soal. Dari bank soal, racik try out
lewat kartu **Try Out Otomatis**, lalu **Terbitkan Try Out**.
