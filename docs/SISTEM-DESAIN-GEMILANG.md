# Sistem Desain Gemilang — sumber kebenaran tunggal wajah aplikasi

**Status:** Fase 0 (fondasi di atas kertas). Belum ada kode aplikasi yang memakai
token ini; penerapan dimulai di fase E (item E1–E4 rencana kerja besar).
Dokumen ini ditulis 2 Nov 2026 sebagai bagian item **B1**.

**Keputusan owner yang masih terbuka dan menempel di dokumen ini:**
palet akhir (**19**, saran: 19c = krem untuk latar + ungu merek untuk tindakan),
bentuk bilah tab bawah (**20**), lingkup prototipe (**21**).
Bila owner memilih lain, yang diubah hanya tabel token — aturan di bawahnya tetap.

---

## 1. Prinsip (urutan = prioritas saat bertabrakan)

1. **Satu layar, satu tindakan utama.** Tepat satu tombol paling menonjol per
   layar. Siswa: *kerjakan minggu ini*. Guru: *mulai kelas*. Admin: tindakan
   yang sedang dibahas. Semua tombol lain visualnya lebih tenang.
2. **Kejujuran data di atas kecantikan.** Angka yang belum terukur ditulis
   "belum terukur", tidak dihias jadi nol atau bintang. Laporan orang tua
   tidak pernah memakai kata defisit. Token tidak boleh menyembunyikan fakta.
3. **Empat keadaan wajib per komponen:** isi, kosong, memuat, error — plus
   keadaan *tak berizin* untuk halaman berpengawal. Keadaan kosong harus
   memberi jalan keluar ("belum ada try out minggu ini — lihat latihan harian"),
   bukan layar putih.
4. **Hemat bacaan Firestore adalah fitur desain.** Kartu yang butuh data besar
   wajib bertanya "bisakah ini dihitung server-side atau di-cache?" sebelum
   digambar. Desain yang memaksa baca penuh = desain yang ditolak.
5. **Gerak menjelaskan, bukan menghias.** Animasi hanya untuk menunjukkan
   dari mana sesuatu datang / ke mana sesuatu pergi.
6. **Konsisten mengalahkan keren.** Komponen yang sudah ada di dokumen ini
   tidak boleh dibuat varian keduanya di halaman tertentu "karena cuma sekali".

---

## 2. Token warna (rasio kontras DIUKUR, bukan dikira)

Rasio di bawah dihitung terhadap latar pasangannya masing-masing.
Ambang yang dipakai: **teks normal ≥ 4,5:1**, teks besar/tebal ≥ 3:1.

| Token | Hex | Dipakai untuk | Rasio terukur | Catatan |
|---|---|---|---|---|
| `latar.halaman` | `#FAF6F0` | latar seluruh layar (krem hangat) | — | pengganti abu-abu dingin |
| `latar.kartu` | `#FFFFFF` | kartu, modal, sheet | — | |
| `latar.lapis2` | `#F3EDE4` | inset, well, baris selang-seling | — | |
| `merek.ungu` | `#652D90` | tombol primer, identitas, node aktif | 9,01:1 di putih | warna merek dipertahankan |
| `merek.unguTekan` | `#52237A` | keadaan tekan/fokus ungu | 9,61:1 di `#F3EBFA` | |
| `merek.unguLembut` | `#F3EBFA` | latar chip ungu, sorotan pilihan | — | teks di atasnya pakai `merek.ungu` |
| `teks.utama` | `#1F2937` | judul & tubuh | 13,63:1 di krem | |
| `teks.sekunder` | `#4B5563` | penjelasan, meta penting | 7,02:1 di krem | **jangan** `#6B7280` di krem (4,49:1, gagal) |
| `teks.lembut` | `#6B7280` | meta kecil **di atas putih saja** | 4,83:1 di putih | dilarang di latar krem |
| `sukses.teks` | `#15803D` | status selesai/hadir | 4,79:1 di `#F0FDF4` | `#16A34A` gagal (3,15:1) — hanya untuk ikon/blok besar |
| `sukses.latar` | `#F0FDF4` | banner sukses | — | |
| `bahaya.teks` | `#B91C1C` | error, alpa, penolakan | 5,91:1 di `#FEF2F2` | `#DC2626` hanya ikon/garis |
| `bahaya.latar` | `#FEF2F2` | banner bahaya | — | |
| `peringatan.teks` | `#B45309` | peringatan, utang, menunggu | 4,84:1 di `#FFFBEB` | `#D97706` gagal (3,07:1) — hanya ikon |
| `peringatan.latar` | `#FFFBEB` | banner peringatan | — | |
| `info.teks` | `#2563EB` | tautan, informasi | 5,17:1 di putih | `#3498DB` lama gagal (3,15:1) — pensiunkan untuk teks |
| `aksen.hijauPeta` | `#22C55E` | hanya elemen dekoratif jalur/peta | — | never for text |

**Aturan pasang:** teks selalu memakai pasangan latar yang tercantum. Bila
kombinasi baru dibutuhkan, hitung rasionya dulu (skrip kecil di bawah) dan
catat hasilnya di tabel ini — jangan menebak.

```bash
# penghitung rasio kontras cepat (WCAG):
node -e "function lum(h){const c=h.replace('#','');const v=[0,2,4].map(i=>parseInt(c.substr(i,2),16)/255).map(x=>x<=0.03928?x/12.92:Math.pow((x+0.055)/1.055,2.4));return .2126*v[0]+.7152*v[1]+.0722*v[2]}function r(a,b){const L=Math.max(lum(a),lum(b)),S=Math.min(lum(a),lum(b));return ((L+.05)/(S+.05)).toFixed(2)}console.log(r(process.argv[1],process.argv[2])+':1')" '#B45309' '#FFFBEB'
```

---

## 3. Token bentuk, jarak, bayangan

| Token | Nilai | Dipakai untuk |
|---|---|---|
| `radius.kartu` | 20 px | kartu besar, modal |
| `radius.kontrol` | 14 px | tombol, input, kartu kecil |
| `radius.pil` | 999 px | chip, bilah tab, badge |
| `radius.node` | 50% | node jalur, avatar |
| `jarak.1..6` | 4 / 8 / 12 / 16 / 24 / 32 px | semua spasi; **tidak ada angka di luar tangga ini** |
| `bayang.kartu` | `0 8px 24px rgba(31,41,55,.08)` | kartu terangkat |
| `bayang.apung` | `0 12px 32px rgba(31,41,55,.16)` | bilah tab, menu apung |
| `garis` | `1px solid #E7DFD3` | pemisah di latar krem |

---

## 4. Tipografi

| Peran | Ukuran / berat | Tinggi baris |
|---|---|---|
| Judul layar | 20 px / 800 | 1,25 |
| Judul kartu | 15 px / 700 | 1,3 |
| Tubuh | 13,5 px / 450 | 1,55 |
| Meta | 11 px / 600 | 1,4 |

- Tidak ada teks di bawah 11 px. Meta 11 px wajib `teks.sekunder` atau lebih gelap.
- Angka yang bermakna (skor, hitungan) ditampilkan **tabular** dan satu ukuran
  lebih besar dari teks sekitarnya — angka adalah isi aplikasi ini.
- Maksimal dua berat huruf per layar (mis. 450 + 800) supaya tidak berisik.

---

## 5. Komponen inti & keadaan wajibnya

| Komponen | Isi | Kosong | Memuat | Error | Tak berizin |
|---|---|---|---|---|---|
| `KartuNodeJalur` (selesai/aktif/terkunci/siluet) | bintang + label minggu | — | kerangka berkilau | ikon putus + coba lagi | — |
| `KartuStat` (angka + label) | angka tabular | "—" + label | kerangka | "gagal memuat" kecil | — |
| `TombolPrimer/Sekunder/Bahaya` | label + ikon | — | spinner, nonaktif | teks error di bawah | terkunci + alasan |
| `BilahTabBawah` (pil apung) | 5 tujuan | — | — | — | tujuan disembunyikan |
| `ChipMapel` | kode v2 + nama | — | — | chip abu "tak dikenal" | — |
| `BannerTugas` (utang/kewajiban) | teks + CTA | tidak dirender | — | — | tidak dirender |
| `KartuUtangKelas` (guru) | daftar + tenggat | "tidak ada utang" | kerangka | coba lagi | — |

Aturan keadaan memuat: **kerangka (skeleton) berbentuk sama dengan isinya**,
bukan spinner besar di tengah layar. Spinner hanya untuk aksi yang menunggu
(< 1 detik terasa), kerangka untuk data yang dimuat.

---

## 6. Aksesibilitas (terukur, diperiksa di gerbang)

- Kontras teks ≥ 4,5:1 (tabel §2 adalah buktinya).
- Sasaran sentuh ≥ 44 × 44 px; jarak antar-sasaran ≥ 8 px.
- Fokus keyboard terlihat: cincin 2 px `merek.ungu` + offset 2 px; tidak boleh
  `outline: none` tanpa pengganti.
- Makna tidak pernah hanya lewat warna: status selalu punya teks/ikon
  (✓ selesai, 🔒 terkunci, ⚠ menunggu) — buta warna tetap aman.
- Semua ikon-tombol punya `aria-label` berbahasa manusia.
- Menghormati `prefers-reduced-motion`: matikan transisi & kilau kerangka.

---

## 7. Anggaran gerak

- Transisi keadaan: 120–180 ms, kurva `ease-out`.
- Perpindahan layar: tanpa animasi besar (maks fade 120 ms) — aplikasi dipakai
  di HP murah; animasi mahal terasa sebagai lag, bukan kemewahan.
- Kerangka memuat: kilau 1,2 s berulang; berhenti saat `prefers-reduced-motion`.
- Tidak ada animasi yang menahan pengguna: tombol tetap bisa ditekan saat
  elemen lain bergerak.

---

## 8. Gerbang tinjauan desain (wajib dilampirkan di commit fase E)

Setiap perubahan wajah wajib menyertakan di deskripsi commit/PR:

1. Tangkapan layar 360 px **dan** desktop untuk layar yang berubah, termasuk
   keadaan kosong & error (bukan hanya keadaan isi yang cantik).
2. Daftar token yang dipakai; bila ada warna di luar tabel §2, alasannya +
   rasio kontras terhitung.
3. Pernyataan tindakan utama layar itu (satu kalimat).
4. Pernyataan biaya bacaan Firestore layar itu (jumlah query per mount).
5. Ceklis §6 tercentang semua, atau penjelasan butir yang dilewati.

Commit tanpa lampiran ini dikembalikan — bukan sebagai hukuman, karena
inilah cara wajah aplikasi tetap satu bahasa saat dikerjakan bergiliran.

---

## 9. Pemetaan layar referensi → fungsi kita (ringkas)

Referensi owner (gambar jalan berkelok & dasbor krem): hero = node minggu ini;
dua kartu stat = try out selesai & jam belajar; batang bulanan = partisipasi
3 bulan; chip subjek = chip mapel katalog v2; kartu gelap ber-avatar = kartu
subtest/misi; layar Progress = Papan Analitik; "10 best students" = papan
peringkat **hanya-positif**; bilah pil = menu bawah. Untuk guru: hero = kelas
berikutnya + tombol mulai; stat = jam mengajar & honor menunggu validasi;
kartu gelap = utang kuis pasca-kelas & laporan belajar belum diisi.

---

## 10. Catatan teknis terhubung

- **Tanggal bisnis = tanggal lokal** (`src/utils/waktuLokal.js`, v1.6.3).
  Komponen kalender/jalur wajib memakai `tanggalLokalStr`, bukan `toISOString`,
  supaya node "hari ini" tidak bergeser pada dini hari WIB.
- Penerapan fase E dilakukan **komponen demi komponen**, bukan search-replace
  warna lintas berkas: satu komponen dikonversi + diuji visual, baru lanjut.
  Warna lama dibiarkan hidup di halaman yang belum dikonversi (janji
  kompatibel-mundur SOP), dipungut terakhir saat semua halaman sudah pindah.
