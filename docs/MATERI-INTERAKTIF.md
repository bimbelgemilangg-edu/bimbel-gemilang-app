# 🎮 MATERI INTERAKTIF v1 — Skema Widget (Turn 87)

> Perintah owner Turn 87: *"menambahkan materi interaktif di materi digital."*
> Dokumen ini = kontrak skema widget interaktif yang bisa disisipkan di TENGAH
> materi lewat **Impor JSON** (Admin → Materi v2) — main-compatible, tanpa
> deploy ulang untuk konten baru. Berlaku di:
> 1. **Materi Belajar v3** (`/siswa/belajar`) — renderer `IsiSections.jsx`
> 2. **Buku Digital** bab terstruktur (`/siswa/buku`) — `BukuBacaPage.renderBlok`
> 3. **Panggung presentasi guru** (lewat `slideMateri.jsx`, otomatis)

## 0. PRINSIP

- Semua widget = **section biasa** di array `sections` bab: `{ "jenis": "<nama widget>", ... }`.
- Koreksi instan **LOKAL** (sama seperti Zona Berlatih) — tidak menulis ke Firestore,
  aman dibuka berkali-kali, cocok untuk pemanasan/penanaman konsep.
- Teks mendukung LaTeX `$...$` (dirender MathText/KaTeX).
- **ATURAN FIRESTORE:** dilarang nested array. `items` berisi objek atau string;
  field array (mis. `jawaban` isianRumpang) hanya berisi string.
- Aksara asing (CJK) dilarang — sama seperti aturan emas konten.

## 1. JENIS WIDGET & SKEMA

### 1.1 `jodohMini` — menjodohkan pasangan
```json
{
  "jenis": "jodohMini",
  "judul": "🔗 Jodohkan: partikel dasar atom",
  "keterangan": "Pilih pasangan yang tepat untuk setiap pernyataan, lalu tekan Cek.",
  "items": [
    { "kiri": "Penemu elektron", "kanan": "J.J. Thomson", "penjelasan": "Tabung sinar katoda, 1897." },
    { "kiri": "Penemu inti atom", "kanan": "Rutherford" }
  ]
}
```
- Minimal 2 pasangan. Kolom kanan otomatis DIACAK + berhuruf A, B, C.
- `penjelasan` opsional (muncul setelah Cek).

### 1.2 `isianRumpang` — isian singkat / fill-in-the-blank
```json
{
  "jenis": "isianRumpang",
  "judul": "✍️ Isian Rumpang",
  "items": [
    {
      "teks": "Jumlah mol = massa dibagi ...",
      "jawaban": ["Mr", "massa molar", "Ar"],
      "hint": "Satuannya gram/mol",
      "penjelasan": "n = m / Mr"
    }
  ]
}
```
- `jawaban`: string tunggal ATAU array varian (semua varian diterima).
  Boleh juga string dengan pemisah `|`: `"Mr|massa molar"`.
- Pencocokan: huruf besar/kecil diabaikan, spasi dirapatkan, titik/koma akhir diabaikan.
- `hint` opsional → tombol "Petunjuk".

### 1.3 `flashcard` — kartu bolak-balik
```json
{
  "jenis": "flashcard",
  "judul": "🃏 Flashcard istilah",
  "items": [
    { "depan": "Isobar", "belakang": "Atom berbeda nomor atom, sama nomor massa" }
  ]
}
```
- Minimal 2 kartu. Ketuk kartu = flip 3D; tombol Mundur/Lanjut/Acak;
  penanda "Sudah hafal" / "Ulangi lagi" per kartu (lokal).

### 1.4 `urutan` — susun urutan langkah/proses
```json
{
  "jenis": "urutan",
  "judul": "🧩 Susun urutan penyetaraan reaksi",
  "keterangan": "Urutkan dari langkah pertama sampai terakhir.",
  "items": [
    "Tulis kerangka reaksi",
    "Setarakan atom selain O dan H",
    "Setarakan O lalu H",
    "Periksa jumlah atom tiap unsur"
  ]
}
```
- `items` = urutan **BENAR** (tampilan awal otomatis diacak).
- Minimal 2 langkah. Tombol panah ↑↓ untuk memindah; Cek memberi hijau/merah
  per posisi + skor; "Acak ulang" untuk mengulang.

### 1.5 `benarSalah` — penilaian pernyataan
```json
{
  "jenis": "benarSalah",
  "judul": "⚖️ Benar atau Salah?",
  "items": [
    { "teks": "Semua isotop suatu unsur memiliki nomor proton sama.", "jawaban": true, "penjelasan": "Isotop = beda neutron saja." },
    { "teks": "Massa atom terpusat di kulit elektron.", "jawaban": false }
  ]
}
```
- `jawaban`: `true`/`false` (boolean) — validator juga menerima `'benar'`/`'salah'`.
- Tiap baris tampil tombol ✔ Benar / ✘ Salah; Cek semua → hijau/merah + skor.

### 1.6 `video` — embed video
```json
{
  "jenis": "video",
  "judul": "🎬 Video: reaksi pembakaran",
  "url": "https://www.youtube.com/watch?v=XXXXXXXXXXX",
  "keterangan": "Tonton 2 menit pertama saja, lalu kerjakan zona di bawahnya."
}
```
- URL yang didukung: YouTube (`watch?v=`, `youtu.be/`, `shorts/`, `embed/`, `live/`)
  → iframe embed; berkas langsung `.mp4/.webm/.ogg/.mov` → player HTML5;
  URL lain → kartu tautan "Buka video".
- Video bisa dari **Bank File admin** (jenis `video`, Supabase) — tempel URL-nya.

## 2. PENEMPATAN DI TEMPLATE SUBBAB (anjuran)

Template 12 kartu per subbab TETAP berlaku. Widget interaktif disisipkan
SETELAH kartu konsep yang berkaitan, sebelum `zona`:

```
... 9 contoh → 10 caraGemilang → [🎮 widget interaktif] → 11 callout jebakan → 12 zona
```

Anjuran pemakaian per tujuan:
| Tujuan | Widget |
|---|---|
| Hafalan istilah/pasangan konsep | `flashcard`, `jodohMini` |
| Prosedur/langkah kerja | `urutan` |
| Cek miskonsepsi cepat | `benarSalah` |
| Latihan recall rumus/angka | `isianRumpang` |
| Penjelasan visual/demonstrasi | `video` |

Maksimal **2-3 widget per subbab** agar reader tetap ringan (bite-sized).

## 3. BUKU DIGITAL (bab terstruktur)

Di bab `tipe: 'terstruktur'` koleksi `buku_digital`, widget dipasang sebagai blok:

```json
{ "tipe": "flashcard", "judul": "...", "items": [ ... ] }
```
atau bentuk bersarang:
```json
{ "tipe": "interaktif", "widget": { "jenis": "flashcard", "items": [ ... ] } }
```

## 4. VALIDASI & IMPOR

1. Validator: `node scripts/validasi-draft.mjs <file.json>` — jenis baru sudah dikenali
   (aturan: items wajib, minimal pasangan/kartu/langkah, video wajib url http(s),
   tanpa nested array).
2. Owner impor via **Admin → Materi v2 → Impor JSON** (mode baru/tambah) —
   sama seperti draft materi biasa.
3. Editor bab admin punya tombol `+ jodohMini`, `+ flashcard`, dst. lengkap dengan
   editor items (JSON) + **pratinjau live** persis tampilan siswa.
4. Mode PPT guru: widget dirender sebagai slide statis (pasangan = tabel,
   langkah = poin bernomor) KECUALI `video` yang tetap bisa diputar.

## 5. CONTOH SIAP IMPOR

Lihat `docs/drafts/draft-contoh-materi-interaktif.json`
(salinan root: `IMPOR-CONTOH-MATERI-INTERAKTIF.json`, status `draft`).

## 6. RENCANA LANJUTAN (belum di v1)

- Hotspot gambar berlabel (klik area anatomi/bagan).
- Simulasi slider (mis. kurva reaksi, grafik fungsi).
- Skor widget → XP Firestore + laporan guru (butuh keputusan skema XP owner).
- Drag-drop sejati untuk `urutan`/`jodohMini` (v1 pakai panah/dropdown — lebih
  andal di HP entry-level).
