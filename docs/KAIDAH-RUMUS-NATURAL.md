# 🧮 KAIDAH RUMUS NATURAL (Turn 100)

> Arahan owner turn 100: *"pastikan sistem menulis rumus secara natural agar
> jelas sama seperti buku."* Semua rumus di aplikasi harus tampil seperti
> cetakan: pecahan bertingkat, pangkat atas, akar bergaris — bukan teks linear
> `3/8` atau `2^31`.

## 1. Prinsip
1. **Semua konten rumus ditulis LaTeX** dan dirender KaTeX oleh `MathText`
   (`$...$` inline, `$$...$$` baris tersendiri). Berlaku untuk: sections
   (kilat/paragraf/poin/tabelinfo/zona/caraGemilang), soal, opsi, dan pembahasan.
2. Konten KURASI (kartu materi, CG, zona buatan tim) ditulis manual ber-LaTeX.
3. Konten BUKU (soal/opsi/pembahasan hasil ekstraksi) dinaturalisasi otomatis
   oleh pipeline (lihat §3) — tidak perlu menulis ulang manual.
4. Bila ragu: `$` hanya membungkus rumus; kata Indonesia di luar `$`.

## 2. Penulisan baku
| Buku | LaTeX | Hasil |
|---|---|---|
| 3/8 (pecahan) | `$\frac{3}{8}$` | pecahan bertingkat |
| a^m × a^n = a^(m+n) | `$a^{m} \times a^{n} = a^{m+n}$` | pangkat atas |
| √a atau ⁿ√aᵐ | `$\sqrt{a}$` / `$\sqrt[n]{a^{m}}$` | akar bergaris |
| kali/titik | `\times` / `\cdot` | × / · |
| ≤ ≥ ≠ ± | `\leq \geq \neq \pm` | simbol presisi |
| himpunan ∈ ∉ ⊂ ∪ ∩ | `\in \notin \subset \cup \cap` | simbol himpunan |
| satuan dalam rumus | `\text{menit}` | teks tegak di dalam rumus |
| desimal Indonesia | `4,2` (koma apa adanya) | KaTeX merender koma tipis — aman |
| persen di dalam rumus | `125\%` | `%` WAJIB di-escape |

Catatan: di JSON, backslash digandakan (`"$\\frac{3}{8}$"`).

## 3. Pipeline otomatis (konten buku)
1. `node scripts/ekstrak-bab-html.mjs <file.html> <out.json> --matematika`
   → flag `--matematika` mengaktifkan `praMatematika()` (scripts/latex-utils.mjs):
   markup buku `<span class="frac">`, `<span class="sqrt">`, `<sup>`, `<sub>`,
   dan 30+ entitas (&times; &le; &isin; ...) dikonversi ke LaTeX mentah
   SEBELUM tag dibuang. Tanpa flag = perilaku lama (bindo/bing tidak berubah).
2. Builder memanggil `naturalisasi(teks)` untuk soal/opsi/baris/pembahasan:
   - "pulau rumus" dibungkus `$...$`; baris rumus murni jadi `$$...$$`
   - kata Indonesia di luar kurung kurawal menjadi pemisah pulau (tidak ikut
     terbungkus); kata satuan di DALAM rumus otomatis jadi `\text{...}`
   - ekor `Jawaban: X` selalu di luar rumus
   - **setiap bungkaan divalidasi parser KaTeX saat build** — bila gagal
     compile, teks dibiarkan polos (tidak pernah tampil merah/mentah di siswa)
3. Uji cepat: `node -e "import('./scripts/latex-utils.mjs').then(m=>console.log(m.naturalisasi('Hasil dari 2^{3} + \\frac{1}{2} adalah')))"`

## 4. Checklist konten baru bermatematika
[ ] Ekstraksi pakai flag `--matematika`
[ ] Kartu materi/CG/zona: rumus ditulis `$...$` manual (bukan teks linear)
[ ] Jalankan build → tidak ada error KaTeX di log build
[ ] Buka pratinjau (SSR/demo): pecahan bertingkat & pangkat atas tampil
[ ] Validator hijau + `cek-aset-materi.mjs` hijau (bila ada gambar)
