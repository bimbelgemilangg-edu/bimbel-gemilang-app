# 📚 INSTRUKSI KERJA — CHAT KONVERSI BUKU/PDF (Materi v2 Gemilang)

> **CARA PAKAI (untuk OWNER):** buka chat baru, lampirkan 2 file:
> 1. `DOKUMEN-PROYEK.md` (memori proyek — konteks lengkap)
> 2. `INSTRUKSI-CHAT-BUKU.md` (file ini — tugas & aturan main)
> lalu kirim PDF buku + sebutkan: judul materi, mapel, kelas, jenjang, program.
>
> **BATAS ROLE (jangan dilanggar):**
> - Chat buku HANYA memproduksi KONTEN: crop gambar buku, upload Supabase,
>   draft JSON, commit ke branch `book/<nama-buku>`.
> - Chat buku TIDAK mengubah kode aplikasi (src/, route, service, UI).
>   Perubahan sistem = tugas chat sistem (chat induk).
> - Hasil akhir dilaporkan owner kembali ke chat sistem untuk review/merge.

---

## 0. Setup lingkungan (wajib baca dulu)
```bash
git clone -b feat/materi-v2-xp https://github.com/bimbelgemilangg-edu/bimbel-gemilang-app.git
cd bimbel-gemilang-app && npm install --no-audit --no-fund
```
- Sandbox RAM ±1 GB: **JANGAN** jalankan `npm run build` (OOM). Verifikasi cukup eslint + dev server.
- Tidak ada `curl/pkill/free`. Tes HTTP pakai `node -e "fetch(...)"`.
- ⚠️ Jangan kill proses dengan pola kata yang muncul di perintahmu sendiri (shell ikut mati).
- ⚠️ supabase-js versi repo: `getPublicUrl()` TIDAK mengembalikan `.publicUrl`.
  Konstruksi manual: `https://hqoasblnrsijbflupoir.supabase.co/storage/v1/object/public/materi-bimbel/<path>`.
- Kredensial Supabase sudah publik di `src/services/uploadService.js` (bucket `materi-bimbel`).
  Token GitHub untuk push: minta ke owner saat dibutuhkan (fine-grained, repo ini, Contents RW).

## 1. PRINSIP FIDELITY (hukum tertinggi)
1. Teks materi **verbatim** dari buku — DILARANG meringkas/parafrase.
2. Rumus, tabel, diagram, foto = **potongan cetakan buku asli** (crop gambar),
   bukan render ulang LaTeX/teks. Każdy crop diberi `keterangan`:
   `"Sesuai buku hal. X"` (nomor halaman CETAK buku, bukan nomor file PDF).
3. Soal latihan: salin soal + opsi persis; pembahasan boleh tulisan sendiri
   tetapi WAJIF menyebut `(Buku hal. X no. Y)`.
4. **Kunci jawaban harus terverifikasi manual** (kerjakan sendiri).
   Soal yang grafiknya ambigu/tidak bisa dibaca pasti → JANGAN dipaksa masuk;
   simpan crop-nya di Bank dan catat di laporan sebagai "perlu bedah bareng owner".
5. Jangan hapus/ubah file konten milik materi lain.

## 2. Pipeline produksi (urutan kerja)
### 2.1 Ekstrak halaman PDF scan
PDF scan = gambar per halaman. Pakai parser JPEG mini (salin apa adanya ke `extract_jpg.mjs`):
```js
import fs from 'fs';
const src = process.argv[2], outDir = process.argv[3];
fs.mkdirSync(outDir, { recursive: true });
const b = fs.readFileSync(src); const out = []; let i = 0;
while (i < b.length - 3) {
  if (b[i] === 0xff && b[i+1] === 0xd8) {
    let p = i + 2, ok = false, segs = 0;
    while (p < b.length - 1) {
      if (b[p] !== 0xff) { p++; continue; }
      const m = b[p+1];
      if (m === 0xff) { p++; continue; }
      if (m === 0x00 || (m >= 0xd0 && m <= 0xd7)) { p += 2; continue; }
      if (m === 0xd9) { if (segs > 2) { out.push([i, p+2]); ok = true; } break; }
      if (m === 0xda) {
        const len = b.readUInt16BE(p+2); let q = p + 2 + len;
        while (q < b.length - 1) {
          if (b[q] === 0xff && b[q+1] !== 0x00 && !(b[q+1] >= 0xd0 && b[q+1] <= 0xd7) && b[q+1] !== 0xff) break;
          q++;
        }
        p = q; segs++; continue;
      }
      const len = b.readUInt16BE(p+2); p += 2 + len; segs++;
      if (segs > 40) break;
    }
    if (ok) i = p + 2; else i += 2;
  } else i++;
}
console.log('jpeg:', out.length);
out.forEach((r, idx) => fs.writeFileSync(`${outDir}/hal-${idx+1}.jpg`, b.subarray(r[0], r[1])));
```
Jalankan: `node extract_jpg.mjs "file.pdf" pdf-jpg` lalu **LIHAT setiap halaman** (read_file) untuk transkripsi & koordinat crop.

### 2.2 Crop rumus/tabel/diagram
```python
from PIL import Image
Image.open('pdf-jpg/hal-N.jpg').crop((x1, y1, x2, y2)).save('crops/nama.png')
```
- Selalu **verifikasi visual** setiap crop (read_file); perbaiki box bila terpotong.
- Nama file crop: `h<halCetak>_<topik>` mis. `h21_rumus_mean`, `s09_kursi` (s = soal).
- Upload semua crop:
```js
// node: upload crop ke Supabase (upsert aman)
const { createClient } = require('@supabase/supabase-js'); const fs = require('fs');
const sb = createClient('https://hqoasblnrsijbflupoir.supabase.co','sb_publishable_TsPJgcnaLOCPV9-DpSyMuA_EQkbrEKt');
// per file: sb.storage.from('materi-bimbel').upload('materi-v2/gambar-buku/<nama>.png', buf, {contentType:'image/png', upsert:true})
// url = 'https://hqoasblnrsijbflupoir.supabase.co/storage/v1/object/public/materi-bimbel/materi-v2/gambar-buku/<nama>.png'
```
- Upload juga PDF utuh: path `materi-v2/pdf-<slug-buku>.pdf`.

### 2.3 Susun draft JSON (skema materi v2)
Simpan di `docs/drafts/draft-<slug-buku>.json`:
```json
{ "materi": { "judul","mapel","kelas","jenjang":"sd|smp|sma","program":"semua|<nama>",
   "premium":false,"warna":"#hex","emoji","deskripsi","urutan":1,"status":"draft" },
  "bab": [ { "judul","ringkasan","estimasiMenit","urutan","tipe":"teks",
     "pdfUrl":"<url pdf>",
     "sections":[ {"jenis":"judul|paragraf|gambar|callout|contoh|langkah|rumus", ...} ],
     "ujiPemahaman":[ {"soal","tipe":"pg","soalGambar?":"<url>","opsi":[...],
        "jawaban":<idx>,"pembahasan":"... (Buku hal. X no. Y)"} ] } ] }
```
- `jenis gambar` = { "url", "keterangan" } → pakai untuk SEMUA rumus/tabel/diagram.
- `jenis paragraf/judul` = { "teks" } verbatim.
- `soalGambar` opsional bila soal punya gambar.
- Impor oleh owner lewat admin → `/admin/materi-v2` → 📥 Impor JSON.

### 2.4 Commit & push (branch konten, JANGAN sentuh branch sistem)
```bash
git checkout -b book/<slug-buku>
git add docs/drafts/... && git commit -m "book(<slug>): draft fidelity <judul> (<n> crop, <m> soal)"
git push origin book/<slug-buku>   # pakai token owner bila diberi
```
Bila tanpa token: serahkan file draft ke owner untuk dibawa ke chat sistem.

## 3. Laporan wajib ke owner (untuk diteruskan ke chat sistem)
1. Daftar file: draft JSON, jumlah crop, URL PDF.
2. Tabel isi: bab → jumlah section → jumlah soal → rentang halaman buku.
3. **Daftar soal yang DIBUANG karena ambigu** + alasannya.
4. Catatan anomali scan (halaman gagal ekstrak, crop ragu-ragu).
5. Branch/commit tempat konten berada.

## 4. Checklist kualitas sebelum lapor
- [ ] Semua crop diverifikasi visual (tidak terpotong teks/rumus)
- [ ] Semua keterangan gambar menyebut halaman cetak buku
- [ ] Semua kunci soal dikerjakan manual & cocok dengan opsi
- [ ] JSON valid (`node -e "JSON.parse(require('fs').readFileSync('...'))"`)
- [ ] Tidak ada file konten materi lain yang berubah
- [ ] Commit masuk branch `book/*`, bukan branch sistem
