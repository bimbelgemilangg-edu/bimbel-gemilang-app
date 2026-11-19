// src/data/modul-smp/matematikaSmpData.js
// ==============================================================================
// MODUL MASTER 52 HALAMAN RESMI TKA SMP 2027 - BIMBEL GEMILANG
// Subtes: Matematika (Numerasi TKA) (MTK_SMP)
// 4 Bab, 39 Unit Lengkap, Latihan Soal, Kuis Interaktif & PDF Master
// DILENGKAPI ASET VISUAL: Slide Asli, Ilustrasi Khusus, Cheat Sheet Master & Mini Tryout
// ==============================================================================

export const MTK_SMP_MODUL = [
  {
    "id": "mtk_smp_bab_1",
    "subtestKode": "MTK_SMP",
    "subtestNama": "Matematika (Numerasi TKA)",
    "subtestSingkatan": "MTK",
    "subtestEmoji": "📐",
    "subtestWarna": "#ea580c",
    "subtestBgLight": "#fff7ed",
    "babNumber": 1,
    "slug": "bilangan-operasi-pecahan-pangkat-notasi",
    "judul": "Bab 1 · Bilangan (Operasi, Pecahan, Pangkat & Notasi Ilmiah)",
    "durasiBacaMenit": 15,
    "ringkasanSingkat": "Kuasai operasi bilangan bulat, pecahan, desimal, sifat-sifat eksponen, rasionalisasi akar, dan konversi notasi ilmiah baku resmi Pusmendik.",
    "learningObjectives": [
      "Menerapkan prioritas KaBaTaKu dan aturan tanda pada bilangan bulat dan pecahan.",
      "Menyederhanakan eksponen aljabar dan merasionalkan penyebut bentuk akar sekawan.",
      "Menuliskan bilangan sangat kecil dan sangat besar ke dalam notasi ilmiah resmi $a \\times 10^n$."
    ],
    "pdfUrl": "/modul-pdf/Modul_Master_TKA_SMP_Matematika_2027.pdf",
    "pdfFilename": "Modul_Master_TKA_SMP_Matematika_2027.pdf",
    "pdfTotalHalaman": 52,
    "isUtama": true,
    "units": [
      {
        "unitNumber": "1.1",
        "judul": "Bilangan Bulat & Operasi Campuran",
        "hook": "Makin ke kanan di garis bilangan makin besar; makin ke kiri makin kecil!",
        "teori": "Bilangan Bulat terdiri dari bilangan negatif (..., −3, −2, −1), nol (0), dan bilangan positif (1, 2, 3, ...). Bayangkan seperti termometer suhu atau lantai gedung bertingkat: naik = tambah (+), turun = kurang (−). Termometer Suhu: Contoh nyata bilangan bulat positif (+), nol (0), dan negatif (−) dalam kehidupan sehari-hari Aturan tanda perkalian & pembagian gampang banget: tanda sama → positif (+), sedangkan tanda beda → negatif (−).",
        "pondasi": "Pondasi · Urutan KaBaTaKu & Tanda Prioritas: (1) Dalam Kurung → (2) Pangkat/Akar → (3) Kali/Bagi (kiri ke kanan) → (4) Tambah/Kurang. Tanda bertemu: a − (−b) = a + b (minus ketemu minus jadi plus!).",
        "jebakanTka": "Banyak siswa menghitung 12 − 2 × 5 dari kiri ke kanan jadi 10 × 5 = 50. Salah! Kali/bagi harus didahulukan: 12 − 10 = 2.",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 1.1",
          "soal": "Suhu daging di dalam freezer mula-mula −6°C. Saat dikeluarkan dan dimasak, suhunya naik 4°C setiap 3 menit. Berapa suhu daging setelah 15 menit?",
          "opsiString": "A. 10°C · B. 14°C · C. 20°C · D. 26°C",
          "jawaban": "B",
          "solusi": "Yuk Bahas · Suhu Ruang Pendingin (PG Aplikasi) Soal: Suhu daging di dalam freezer mula-mula −6°C. Saat dikeluarkan dan dimasak, suhunya naik 4°C setiap 3 menit. Berapa suhu daging setelah 15 menit? Opsi: A. 10°C · B. 14°C · C. 20°C · D. 26°C Hitung dulu berapa kali suhunya naik: dalam 15 menit ada 15 ÷ 3 = 5 kali kenaikan. Total kenaikan suhu = 5 × 4°C = +20°C. Nah, tambahkan ke suhu awal: −6 + 20 = 14°C! (Hati-hati: opsi C adalah jebakan kalau lupa suhu awal −6.) Jawaban: B. 14°C"
        },
        "trikCepat": "Trik Cepat · Skor Ujian Benar–Salah Untuk soal skor olimpiade (Benar +4, Salah −2, Kosong −1): selalu hitung jumlah soal kosong dulu (Total − Dijawab), baru kalikan tiap kategori!",
        "pageNumber": 4,
        "illustrationImg": "/modul-assets/illustrations/mtk_p4.jpeg",
        "illustrationCaption": "Termometer Suhu: Contoh nyata bilangan bulat positif (+), nol (0), dan",
        "slideImg": "/modul-assets/pages/mtk_p4.png"
      },
      {
        "unitNumber": "1.2",
        "judul": "Pecahan, Desimal & Persen",
        "hook": "Tiga baju berbeda untuk nilai yang sama persis: ½ = 0,5 = 50%!",
        "teori": "Bilangan Rasional adalah bilangan yang bisa ditulis dalam bentuk pecahan a/b (dengan b ≠ 0). Di TKA SMP, kemampuan mengubah pecahan ke desimal/persen secara refleks bikin hitungan 3 kali lebih cepat! Konsep Pecahan: 1 loyang pizza dibagi 8 potong sama besar — tiap potong bernilai 1/8 (12,5%) Untuk tambah/kurang pecahan, samakan penyebutnya (pakai KPK atau cara kupu-kupu). Untuk bagi pecahan, cukup ubah jadi kali lalu balik pecahan belakang (a/b ÷ c/d = a/b × d/c).",
        "pondasi": "Pondasi · Pecahan Istimewa Wajib Hafal ½ = 0,5 · ¼ = 0,25 · ¾ = 0,75 · ⅕ = 0,2 · ⅖ = 0,4 · ⅛ = 0,125 · ⅓ ≈ 0,333 · ⅔ ≈ 0,667.",
        "jebakanTka": "Saat mengurutkan pecahan seperti ⅗, 0,65, 58%, ubah semuanya ke persen dulu (60%, 65%, 58%)—jangan menebak dari besar angka penyebutnya!",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 1.2",
          "soal": "Pak Budi punya lahan 600 m². Sebanyak ⅓ bagian ditanami jagung, 25% bagian ditanami cabai, dan sisanya dibuat kolam ikan. Berapa luas kolam ikan Pak Budi?",
          "opsiString": "A. 200 m² · B. 250 m² · C. 300 m² · D. 350 m²",
          "jawaban": "B",
          "solusi": "Yuk Bahas · Sisa Lahan Kebun (PG Aplikasi) Soal: Pak Budi punya lahan 600 m². Sebanyak ⅓ bagian ditanami jagung, 25% bagian ditanami cabai, dan sisanya dibuat kolam ikan. Berapa luas kolam ikan Pak Budi? Opsi: A. 200 m² · B. 250 m² · C. 300 m² · D. 350 m² Hitung satu per satu atau gabung pecahannya! Jagung = ⅓ × 600 = 200 m². Cabai = 25% × 600 = ¼ × 600 = 150 m². Total yang sudah dipakai = 200 + 150 = 350 m². Maka sisa untuk kolam = 600 − 350 = 250 m²! Jawaban: B. 250 m²"
        },
        "trikCepat": "Trik Cepat · Bandingkan 2 Pecahan (Kali Silang) Mana lebih besar: 5/7 atau 7/10? Kali silang ke atas: kiri 5×10 = 50, kanan 7×7 = 49. Karena 50 > 49, maka 5/7 > 7/10!",
        "pageNumber": 5,
        "illustrationImg": "/modul-assets/illustrations/mtk_p5.jpeg",
        "illustrationCaption": "Mana lebih besar: 5/7 atau 7/10? Kali silang ke atas: kiri 5×10 = 50, kanan 7×7 = 49. Karena 50 > 49, maka 5/7 > 7/10!",
        "slideImg": "/modul-assets/pages/mtk_p5.png"
      },
      {
        "unitNumber": "1.3",
        "judul": "Bilangan Berpangkat Bulat",
        "hook": "Pangkat itu singkatan perkalian berulang—asalkan basisnya sama,",
        "teori": "pangkatnya tinggal dioperasikan! Jika basisnya sama (a), kita tidak perlu menghitung hasil pangkat yang nilainya jutaan! Cukup pakai 5 aturan emas eksponen di bawah ini—kalau basisnya beda (misal 4 dan 8), ubah dulu keduanya ke basis prima sama (2² dan 2³). 5 Aturan Emas Bilangan Berpangkat Bulat 1. aᵐ × aⁿ = aᵐ⁺ⁿ Kali basis sama → pangkat ditambah 2. aᵐ ÷ aⁿ = aᵐ⁻ⁿ Bagi basis sama → pangkat dikurang 3. (aᵐ)ⁿ = aᵐˣⁿ Pangkat dipangkatkan → dikali 4. a⁰ = 1 (a ≠ 0) Semua bilangan ≠ 0 pangkat nol = 1 5. a⁻ⁿ = 1 / aⁿ Pangkat negatif = pecahan terbalik",
        "pondasi": "Pondasi · Ubah ke Basis Prima Terkecil Hafalkan pangkat kecil: 4 = 2², 8 = 2³, 16 = 2⁴, 32 = 2⁵ · 9 = 3², 27 = 3³, 81 = 3⁴ · 25 = 5², 125 = 5³.",
        "jebakanTka": "Bedakan (−3)² = (−3)×(−3) = +9 dengan −3² = −(3×3) = −9! Tanpa tanda kurung, minus tidak ikut dipangkatkan. Dan ingat 2⁻³ = 1/8, bukan −8!",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 1.3",
          "soal": "Hasil dari (4³ × 8²) ÷ 16² adalah …",
          "opsiString": "A. 4 · B. 8 · C. 16 · D. 32 Jangan dihitung manual! Ubah semua ke basis",
          "jawaban": "C",
          "solusi": "Yuk Bahas · Operasi Pangkat Campuran (PG) Soal: Hasil dari (4³ × 8²) ÷ 16² adalah … Opsi: A. 4 · B. 8 · C. 16 · D. 32 Jangan dihitung manual! Ubah semua ke basis 2: 4³ = (2²)³ = 2⁶, 8² = (2³)² = 2⁶, dan 16² = (2⁴)² = 2⁸. Sekarang gabungkan pangkatnya: 2⁶⁺⁶⁻⁸ = 2⁴ = 16! Super bersih dan cepat! Jawaban: C. 16"
        },
        "trikCepat": "Trik Cepat · Penjumlahan Pangkat Sama Kalau ketemu 2⁵ + 2⁵, itu bukan 2¹⁰! Artinya ada 2 buah 2⁵ → 2 × 2⁵ = 2⁶. Sama halnya 3⁴ + 3⁴ + 3⁴ = 3 × 3⁴ = 3⁵!",
        "pageNumber": 6,
        "illustrationImg": null,
        "illustrationCaption": "",
        "slideImg": "/modul-assets/pages/mtk_p6.png"
      },
      {
        "unitNumber": "1.4",
        "judul": "Bentuk Akar & Notasi Ilmiah",
        "hook": "Pecah akar pakai bilangan kuadrat; tulis angka raksasa/super kecil pakai ×",
        "teori": "10ⁿ! Bentuk Akar seperti √2, √3, √5 adalah bilangan irasional. Untuk menyederhanakan akar besar, pecah dengan kuadrat sempurna (4, 9, 16, 25, 36, 49, 64, 81, 100): misal √72 = √(36 × 2) = 6√2. Notasi Ilmiah ditulis a × 10ⁿ dengan syarat wajib 1 ≤ a < 10. Geser koma ke kiri → pangkat positif; geser ke kanan → pangkat negatif. Menyederhanakan Akar √72 = √(36 × 2) = 6√2 Tambah/kurang akar hanya bisa jika isi akarnya SAMA! Geser Koma Notasi Ilmiah 45.000 = 4,5 × 10⁴ ← geser kiri 4 langkah (+4) 0,0032 = 3,2 × 10⁻³ geser kanan 3 langkah (−3) →",
        "pondasi": "Pondasi · Operasi Bentuk Akar Kali/Bagi: √a × √b = √(ab) dan √a × √a = a. Tambah/Kurang: p√c + q√c = (p + q)√c (ibarat 3x + 2x = 5x). Rasionalkan: a / √b = (a√b) / b (kalikan √b / √b).",
        "jebakanTka": "√9 + √16 ≠ √25! Hitung masing-masing dulu: 3 + 4 = 7 (bukan 5). Juga 45 × 10³ bukan notasi ilmiah baku karena 45 ≥ 10—harus ditulis 4,5 × 10⁴!",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 1.4",
          "soal": "Yuk Bahas · Operasi Akar & Jarak Planet (PG) Soal 1: Hasil dari √50 + √32 − √18 adalah … Pecah semua ke √2! √50 = 5√2, √32 = 4√2, √18 = 3√2. Tinggal operasikan depannya: (5 + 4 − 3)√2 = 6√2! Soal 2: Jarak Bumi–Matahari sekitar 150.000.000 km. Bentuk notasi ilmiahnya adalah … Geser koma dari paling kanan ke belakang angka 1 → pindah 8 langkah ke kiri → 1,5 × 10⁸ km. Jawaban: 6√2 dan 1,5 × 10⁸ km",
          "opsiString": "",
          "jawaban": "",
          "solusi": "Yuk Bahas · Operasi Akar & Jarak Planet (PG) Soal 1: Hasil dari √50 + √32 − √18 adalah … Pecah semua ke √2! √50 = 5√2, √32 = 4√2, √18 = 3√2. Tinggal operasikan depannya: (5 + 4 − 3)√2 = 6√2! Soal 2: Jarak Bumi–Matahari sekitar 150.000.000 km. Bentuk notasi ilmiahnya adalah … Geser koma dari paling kanan ke belakang angka 1 → pindah 8 langkah ke kiri → 1,5 × 10⁸ km. Jawaban: 6√2 dan 1,5 × 10⁸ km"
        },
        "trikCepat": "Trik Cepat · Cek Angka Depan Notasi Ilmiah Begitu lihat soal notasi ilmiah, langsung coret opsi yang angka depannya ≥ 10 atau < 1 (seperti 15 × 10⁷ atau 0,15 × 10⁹)!",
        "pageNumber": 7,
        "illustrationImg": null,
        "illustrationCaption": "",
        "slideImg": "/modul-assets/pages/mtk_p7.png"
      },
      {
        "unitNumber": "1.5",
        "judul": "Estimasi & Perkiraan Perhitungan",
        "hook": "Tidak semua soal butuh hitungan eksak—pakai estimasi untuk mengunci",
        "teori": "rentang jawaban! Estimasi masuk sub-elemen wajib CP TKA SMP! Tujuannya mengukur kepekaan bilangan (number sense): apakah suatu harga belanja cukup dengan uang Rp250.000, atau berada di antara dua batas angka. Strategi Mengapit Nilai Asli: 19,6 × Rp12.750 Batas Bawah 19 × 12.000 = 228rb Estimasi Seimbang 20 × 12.500 = 250rb Batas Atas 20 × 13.000 = 260rb Nilai asli Rp249.900 tepat di tengah-tengah—ketemu tanpa kali bersusun!",
        "pondasi": "Pondasi · 3 Cara Estimasi Cerdas Taksiran Atas: bulatkan naik → berguna cek batas maksimum anggaran. Taksiran Bawah: bulatkan turun → berguna cek batas minimum. Taksiran Seimbang: satu naik, satu turun → paling dekat nilai asli!",
        "jebakanTka": "Kalau kedua angka sama-sama dibulatkan ke atas, hasil taksiranmu pasti lebih tinggi dari nilai asli. Jangan salah menyimpulkan “lebih besar dari 260.000”!",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 1.5",
          "soal": "Harga 1 kg beras Rp12.750. Jika membeli 19,6 kg beras, pilih semua perkiraan total harga yang benar! (1) Kurang dari Rp260.000. (2) Lebih besar dari Rp240.000. (3) Dapat diperkirakan dengan 20 × Rp12.500. (4) Mendekati Rp230.000. Batas atas: 20 × 13.000 = 260.000 → harga asli pasti < 260.000 (1 Benar). Cek 240rb: 20 × 12.000 = 240.000, sedangkan 19,6 sangat dekat 20 dan 12.750 jauh di atas 12.000 → pasti > 240.000 (2 Benar). Seimbang: 20 × 12.500 = 250.000 (3 Benar, 4 Salah). Jawaban: Pernyataan (1), (2), dan (3)",
          "opsiString": "",
          "jawaban": "",
          "solusi": "Yuk Bahas · Estimasi Harga Beras (PGK MCMA) Soal: Harga 1 kg beras Rp12.750. Jika membeli 19,6 kg beras, pilih semua perkiraan total harga yang benar! (1) Kurang dari Rp260.000. (2) Lebih besar dari Rp240.000. (3) Dapat diperkirakan dengan 20 × Rp12.500. (4) Mendekati Rp230.000. Batas atas: 20 × 13.000 = 260.000 → harga asli pasti < 260.000 (1 Benar). Cek 240rb: 20 × 12.000 = 240.000, sedangkan 19,6 sangat dekat 20 dan 12.750 jauh di atas 12.000 → pasti > 240.000 (2 Benar). Seimbang: 20 × 12.500 = 250.000 (3 Benar, 4 Salah). Jawaban: Pernyataan (1), (2), dan (3)"
        },
        "trikCepat": "Trik Cepat · Cek Uang Cukup/Tidak Untuk soal “apakah uang Rp100.000 cukup membeli 5 barang?”, bulatkan semua harga ke atas ke ribuan terdekat. Kalau taksiran atasnya ≤ Rp100.000, uangmu 100% pasti cukup!",
        "pageNumber": 8,
        "illustrationImg": null,
        "illustrationCaption": "",
        "slideImg": "/modul-assets/pages/mtk_p8.png"
      },
      {
        "unitNumber": "1.6",
        "judul": "Persen, Diskon & Promo Belanja",
        "hook": "Jangan tertipu angka diskon besar—selalu hitung harga yang benar-benar",
        "teori": "kamu bayar! Soal belanja, diskon tunggal, diskon ganda (50% + 20%), dan promo beli gratis (seperti “Beli 4 gratis 1 termurah”) adalah menu wajib TKA SMP! Jika barang didiskon d%, kita hanya membayar (100% − d%) dari harga awal. Diskon Belanja: Potongan harga dihitung dari harga awal sebelum diskon (Bayar = (100% − %Diskon) × Harga Awal)",
        "pondasi": "Pondasi · Mencari Harga Sebelum Diskon Jika setelah diskon 20% kamu membayar Rp160.000, artinya Rp160.000 itu adalah 80%. Maka harga awal = (100/80) × 160.000 = Rp200.000 (bukan 120% × 160.000!).",
        "jebakanTka": "Diskon 50% + 20% bukan berarti diskon 70%! Harga bayarnya 0,5 × 0,8 = 0,40 (40%), jadi diskon totalnya 60%. Selalu cek apakah harga awal di dua toko sama atau beda!",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 1.6",
          "soal": "Toko A menjual buku Rp24.000 diskon 25%. Toko B menjual buku sama Rp20.000 diskon 10%. Tentukan Benar atau Salah! A. Potongan harga di Toko A adalah Rp6.000. B. Harga bayar di Toko A lebih murah daripada Toko B. C. Diskon beruntun 20% + 10% sama dengan diskon tunggal 30%. Toko A: potongan ¼ × 24.000 = Rp6.000 (A Benar), bayar Rp18.000. Toko B: bayar 90% × 20.000 = Rp18.000—ternyata sama murah (B Salah)! Diskon 20%+10% = 28% (C Salah). Jawaban: A. Benar · B. Salah · C. Salah",
          "opsiString": "",
          "jawaban": "A",
          "solusi": "Yuk Bahas · Bandingkan Diskon 2 Toko (PGK Kategori) Soal: Toko A menjual buku Rp24.000 diskon 25%. Toko B menjual buku sama Rp20.000 diskon 10%. Tentukan Benar atau Salah! A. Potongan harga di Toko A adalah Rp6.000. B. Harga bayar di Toko A lebih murah daripada Toko B. C. Diskon beruntun 20% + 10% sama dengan diskon tunggal 30%. Toko A: potongan ¼ × 24.000 = Rp6.000 (A Benar), bayar Rp18.000. Toko B: bayar 90% × 20.000 = Rp18.000—ternyata sama murah (B Salah)! Diskon 20%+10% = 28% (C Salah). Jawaban: A. Benar · B. Salah · C. Salah"
        },
        "trikCepat": "Trik Cepat · Rumus Diskon Ganda Untuk diskon a% + b%, diskon tunggalnya = a + b − (a × b / 100). Contoh: 20% + 10% = 30 − 2 = 28%!",
        "pageNumber": 9,
        "illustrationImg": "/modul-assets/illustrations/mtk_p9.jpeg",
        "illustrationCaption": "Toko A: potongan ¼ × 24.000 = Rp6.000 (A Benar), bayar Rp18.000. Toko B: bayar 90% × 20.000 = Rp18.000—ternyata sama murah (B Salah)! Diskon 20%+10% = 28% (C Salah).",
        "slideImg": "/modul-assets/pages/mtk_p9.png"
      },
      {
        "unitNumber": "1.7",
        "judul": "Aritmetika Sosial (Untung, Rugi, Pajak & Bunga)",
        "hook": "Persen untung/rugi selalu dibandingkan ke Harga Beli (Modal), bukan harga",
        "teori": "jual! Dalam Aritmetika Sosial, pahami 3 keluarga transaksi sehari-hari: (1) Jual–Beli (Untung = Jual − Beli), (2) Berat Kemasan (Bruto = Neto + Tara), dan (3) Perbankan & Pajak (Bunga Tunggal & PPN). Alur Harga Beli → Jual Modal 100%→Jual (100+U)% %U = (Untung ÷ Modal) × 100% Kalau rugi R%: Jual = (100 − R)% Bruto = Neto + Tara Neto (Isi Bersih) Tara Bruto = Berat Kotor Total Tara = Berat Kemasan/Karung",
        "pondasi": "Pondasi · Rumus Bunga Tunggal (Bank) Jika menabung Modal (M) selama n bulan dengan bunga p% per tahun: Bunga = (n / 12) × (p / 100) × M  |  Tabungan Akhir = M + Bunga.",
        "jebakanTka": "Pajak (PPN) itu menambah harga bayar (100% + pajak), sedangkan Diskon mengurangi harga bayar (100% − diskon). Jangan ketukar!",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 1.7",
          "soal": "Yuk Bahas · Tabungan & Pedagang Buah (Aplikasi) Soal 1: Rina menabung Rp2.000.000 di bank dengan bunga tunggal 6% per tahun. Berapa total tabungan Rina setelah 8 bulan? Hitung bunganya dulu: (8/12) × (6/100) × 2.000.000. Coret 6 dengan 12 (sisa 2 di bawah), lalu 8 ÷ 2 = 4 → 4% × 2.000.000 = Rp80.000. Total tabungan = Rp2.080.000! Soal 2: Pedagang menjual sepatu Rp240.000 dan mendapat untung 20%. Berapa harga belinya? Jual = 120% → Harga Beli = (100/120) × 240.000 = Rp200.000! Jawaban: Rp2.080.000 dan Rp200.000",
          "opsiString": "",
          "jawaban": "",
          "solusi": "Yuk Bahas · Tabungan & Pedagang Buah (Aplikasi) Soal 1: Rina menabung Rp2.000.000 di bank dengan bunga tunggal 6% per tahun. Berapa total tabungan Rina setelah 8 bulan? Hitung bunganya dulu: (8/12) × (6/100) × 2.000.000. Coret 6 dengan 12 (sisa 2 di bawah), lalu 8 ÷ 2 = 4 → 4% × 2.000.000 = Rp80.000. Total tabungan = Rp2.080.000! Soal 2: Pedagang menjual sepatu Rp240.000 dan mendapat untung 20%. Berapa harga belinya? Jual = 120% → Harga Beli = (100/120) × 240.000 = Rp200.000! Jawaban: Rp2.080.000 dan Rp200.000"
        },
        "trikCepat": "Trik Cepat · Bunga per Bulan Bunga 6% per tahun artinya 0,5% per bulan (6 ÷ 12). Untuk 8 bulan tinggal kalikan: 8 × 0,5% = 4%!",
        "pageNumber": 10,
        "illustrationImg": null,
        "illustrationCaption": "",
        "slideImg": "/modul-assets/pages/mtk_p10.png"
      },
      {
        "unitNumber": "1.8",
        "judul": "Faktorisasi Prima, FPB & KPK",
        "hook": "FPB untuk membagi paket sama banyak; KPK untuk jadwal bertemu",
        "teori": "bersamaan lagi! Faktorisasi Prima memecah bilangan asli menjadi perkalian bilangan prima (2, 3, 5, 7, 11, ...). Di TKA SMP, soal faktorisasi prima sering muncul dalam bentuk PGK MCMA mencari faktor persekutuan dari bilangan berpangkat! Pohon Faktor 36 36 4 9 2 2 3 3 36 = 2² × 3² Beda FPB vs KPK FPB: Faktor SAMA, pangkat KECIL Kata kunci: dibagi sama banyak, paket KPK: SEMUA faktor, pangkat BESAR Kata kunci: bersamaan lagi, berkedip",
        "pondasi": "Pondasi · Ciri Habis Dibagi Cepat Habis dibagi 2: genap · Habis dibagi 3: jumlah digit kelipatan 3 · Habis dibagi 5: ekor 0 atau 5 · Habis dibagi 9: jumlah digit kelipatan 9.",
        "jebakanTka": "Faktor persekutuan bukan cuma FPB-nya saja, melainkan semua pembagi dari FPB! Jadi kalau FPB = 2² × 3² × 5, maka 2 × 3² × 5 juga faktor persekutuan!",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 1.8",
          "soal": "Tiga bilangan dinyatakan sebagai (33² − 3²), (8² + 296), dan (36 × 35). Pilih semua faktor persekutuan ketiga bilangan itu! (1) 2³ × 3³ × 7    (2) 2² × 3² × 7 (3) 2² × 3² × 5    (4) 2 × 3² × 5 Hitung dulu ketiganya! Bilangan 1: (33+3)(33−3) = 36 × 30 = 1.080 = 2³ × 3³ × 5. Bilangan 2: 64 + 296 = 360 = 2³ × 3² × 5. Bilangan 3: 36 × 35 = (2²×3²)(5×7) = 2² × 3² × 5 × 7. Maka FPB = 2² × 3² × 5 (tidak ada faktor 7!). Jadi yang membagi FPB adalah (3) dan (4). Jawaban: Pernyataan (3) dan (4)",
          "opsiString": "",
          "jawaban": "",
          "solusi": "Yuk Bahas · Faktor Persekutuan (PGK MCMA Resmi) Soal: Tiga bilangan dinyatakan sebagai (33² − 3²), (8² + 296), dan (36 × 35). Pilih semua faktor persekutuan ketiga bilangan itu! (1) 2³ × 3³ × 7    (2) 2² × 3² × 7 (3) 2² × 3² × 5    (4) 2 × 3² × 5 Hitung dulu ketiganya! Bilangan 1: (33+3)(33−3) = 36 × 30 = 1.080 = 2³ × 3³ × 5. Bilangan 2: 64 + 296 = 360 = 2³ × 3² × 5. Bilangan 3: 36 × 35 = (2²×3²)(5×7) = 2² × 3² × 5 × 7. Maka FPB = 2² × 3² × 5 (tidak ada faktor 7!). Jadi yang membagi FPB adalah (3) dan (4). Jawaban: Pernyataan (3) dan (4)"
        },
        "trikCepat": "Trik Cepat · Selisih Kuadrat di Faktorisasi Ketemu 33² − 3²? Jangan dikuadratkan! Pakai (33+3)(33−3) = 36 × 30, langsung gampang difaktorkan!",
        "pageNumber": 11,
        "illustrationImg": null,
        "illustrationCaption": "",
        "slideImg": "/modul-assets/pages/mtk_p11.png"
      },
      {
        "unitNumber": "1.9",
        "judul": "Rasio, Skala & Laju Perubahan",
        "hook": "Bayangkan rasio sebagai potongan kotak sama besar, dan laju sebagai",
        "teori": "kecepatan tiap tahap! Pada Rasio & Proporsi (misal cairan A : B = 3 : 5), bayangkan 3 kotak A dan 5 kotak B—total ada 8 kotak sama besar. Sementara Skala Peta (1 : 200.000) artinya 1 cm di peta = 200.000 cm = 2 km di dunia nyata! Skala Peta: Perbandingan jarak pada peta (cm) terhadap jarak sebenarnya di lapangan (cm/km)",
        "pondasi": "Pondasi · Laju Perubahan di Soal TKA Laju perubahan bukan cuma kecepatan (km/jam) dan debit (L/menit), tapi juga durasi antrean (misal alur pelayanan donor darah PMI) atau tarif per satuan waktu!",
        "jebakanTka": "Saat mengubah cm ke km pada skala peta, ingat 1 km = 100.000 cm (coret 5 nol, bukan 3 nol!). Untuk waktu 1 jam 30 menit = 1,5 jam, bukan 1,3 jam!",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 1.9",
          "soal": "Untuk membuat larutan desinfektan dibutuhkan cairan A dan B dengan rasio A : B = 3 : 5. Jika tersedia 2,5 liter cairan B, berapa volume maksimum larutan yang dapat dibuat?",
          "opsiString": "A. 3,6 liter · B. 4,0 liter · C. 4,8 liter · D. 6,4 liter Cairan B punya 5 bagian = 2,5 liter, jadi 1 bagian = 2,5 ÷ 5 = 0,5 liter. Karena ditanya total larutan (3 + 5 = 8 bagian), langsung",
          "jawaban": "B",
          "solusi": "Yuk Bahas · Larutan Desinfektan (PG Resmi) Soal: Untuk membuat larutan desinfektan dibutuhkan cairan A dan B dengan rasio A : B = 3 : 5. Jika tersedia 2,5 liter cairan B, berapa volume maksimum larutan yang dapat dibuat? Opsi: A. 3,6 liter · B. 4,0 liter · C. 4,8 liter · D. 6,4 liter Cairan B punya 5 bagian = 2,5 liter, jadi 1 bagian = 2,5 ÷ 5 = 0,5 liter. Karena ditanya total larutan (3 + 5 = 8 bagian), langsung kalikan: 8 × 0,5 = 4,0 liter! Jawaban: B. 4,0 liter"
        },
        "trikCepat": "Trik Cepat · Rumus Rasio Anti-Ketukar Ditanya = (Rasio Ditanya ÷ Rasio Diketahui) × Nilai Diketahui = (8 ÷ 5) × 2,5 = 4,0 liter!",
        "pageNumber": 12,
        "illustrationImg": "/modul-assets/illustrations/mtk_p12.jpeg",
        "illustrationCaption": "Pada Rasio & Proporsi (misal cairan A : B = 3 : 5), bayangkan 3 kotak A dan 5 kotak B—total ada 8 kotak sama besar. Sementara Skala Peta (1 : 200.000) artinya 1 cm di peta = 200.000 cm = 2 km di dunia nyata!",
        "slideImg": "/modul-assets/pages/mtk_p12.png"
      },
      {
        "unitNumber": "1.10",
        "judul": "Perbandingan Senilai & Berbalik Nilai",
        "hook": "Cek arah panahnya dulu: kalau kiri naik, kanan ikut naik atau malah turun?",
        "teori": "Soal proyek renovasi dan persediaan pakan adalah langganan tetap TKA SMP! Jika jumlah pekerja ditambah maka waktu selesai makin cepat, itu pasti berbalik nilai (kalikan lurus: a₁ × b₁ = a₂ × b₂). Perbandingan Senilai Barang ↑ maka Harga ↑ a₁ / b₁ = a₂ / b₂ Kali silang · bensin–jarak Berbalik Nilai Pekerja ↑ maka Hari ↓ a₁ × b₁ = a₂ × b₂ Kali lurus · proyek, pakan",
        "pondasi": "Pondasi · Beban Kerja Hari-Orang (HO) Beban Total = Pekerja × Target Hari. Sisa Beban = Total − Sudah dikerjakan. Pekerja Sisa = Sisa Beban ÷ Sisa Hari Efektif.",
        "jebakanTka": "Hati-hati kata akhir soal: apakah ditanya total pekerja (30 orang) atau tambahan pekerja (30 − 20 = 10 orang)? Jangan sampai salah klik!",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 1.10",
          "soal": "Renovasi sekolah ditarget 60 hari oleh 20 pekerja. Setelah jalan 24 hari, berhenti total 12 hari. Pilih pernyataan benar! Timeline 60 Hari: Jalan 24h Stop 12 Sisa 24h Total = 20 × 60 = 1.200 HO Sisa = 1.200 − 480 = 720 HO (1) Sisa waktu = 24 hari. (2) Sisa beban = 1.200 HO. (3) Butuh total 30 pekerja. (4) Cukup tambah 5 pekerja. Sisa waktu = 60 − 24 − 12 = 24 hari (1 Benar). Beban sisa = 720 HO (2 Salah). Pekerja = 720 ÷ 24 = 30 orang (3 Benar), artinya tambah 10 orang (4 Salah). Jawaban: Pernyataan (1) dan (3)",
          "opsiString": "",
          "jawaban": "",
          "solusi": "Yuk Bahas · Proyek Renovasi (PGK MCMA) Soal: Renovasi sekolah ditarget 60 hari oleh 20 pekerja. Setelah jalan 24 hari, berhenti total 12 hari. Pilih pernyataan benar! Timeline 60 Hari: Jalan 24h Stop 12 Sisa 24h Total = 20 × 60 = 1.200 HO Sisa = 1.200 − 480 = 720 HO (1) Sisa waktu = 24 hari. (2) Sisa beban = 1.200 HO. (3) Butuh total 30 pekerja. (4) Cukup tambah 5 pekerja. Sisa waktu = 60 − 24 − 12 = 24 hari (1 Benar). Beban sisa = 720 HO (2 Salah). Pekerja = 720 ÷ 24 = 30 orang (3 Benar), artinya tambah 10 orang (4 Salah). Jawaban: Pernyataan (1) dan (3)"
        },
        "trikCepat": "Trik Cepat · Tambahan Pekerja Tambahan = (Pekerja awal × Hari libur) ÷ Sisa hari = (20 × 12) ÷ 24 = 10 orang!",
        "pageNumber": 13,
        "illustrationImg": null,
        "illustrationCaption": "",
        "slideImg": "/modul-assets/pages/mtk_p13.png"
      }
    ],
    "cheatSheet": "",
    "cheatSheetImg": null,
    "miniTryout": "",
    "tryoutImg": null,
    "petaBelajarImg": null,
    "konsepTeori": [
      {
        "subjudul": "Unit 1.1: Bilangan Bulat & Operasi Campuran",
        "isi": "Bilangan Bulat terdiri dari bilangan negatif (..., −3, −2, −1), nol (0), dan bilangan positif (1, 2, 3, ...). Bayangkan seperti termometer suhu atau lantai gedung bertingkat: naik = tambah (+), turun = kurang (−). Termometer Suhu: Contoh nyata bilangan bulat positif (+), nol (0), dan negatif (−) dalam kehidupan sehari-hari Aturan tanda perkalian & pembagian gampang banget: tanda sama → positif (+), sedangkan tanda beda → negatif (−).",
        "poinPenting": [
          "Makin ke kanan di garis bilangan makin besar; makin ke kiri makin kecil!",
          "Pondasi · Urutan KaBaTaKu & Tanda Prioritas: (1) Dalam Kurung → (2) Pangkat/Akar → (3) Kali/Bagi (kiri ke kanan) → (4) Tambah/Kurang. Tanda bertemu: a − (−b) = a + b (minus ketemu minus jadi plus!)."
        ]
      },
      {
        "subjudul": "Unit 1.2: Pecahan, Desimal & Persen",
        "isi": "Bilangan Rasional adalah bilangan yang bisa ditulis dalam bentuk pecahan a/b (dengan b ≠ 0). Di TKA SMP, kemampuan mengubah pecahan ke desimal/persen secara refleks bikin hitungan 3 kali lebih cepat! Konsep Pecahan: 1 loyang pizza dibagi 8 potong sama besar — tiap potong bernilai 1/8 (12,5%) Untuk tambah/kurang pecahan, samakan penyebutnya (pakai KPK atau cara kupu-kupu). Untuk bagi pecahan, cukup ubah jadi kali lalu balik pecahan belakang (a/b ÷ c/d = a/b × d/c).",
        "poinPenting": [
          "Tiga baju berbeda untuk nilai yang sama persis: ½ = 0,5 = 50%!",
          "Pondasi · Pecahan Istimewa Wajib Hafal ½ = 0,5 · ¼ = 0,25 · ¾ = 0,75 · ⅕ = 0,2 · ⅖ = 0,4 · ⅛ = 0,125 · ⅓ ≈ 0,333 · ⅔ ≈ 0,667."
        ]
      },
      {
        "subjudul": "Unit 1.3: Bilangan Berpangkat Bulat",
        "isi": "pangkatnya tinggal dioperasikan! Jika basisnya sama (a), kita tidak perlu menghitung hasil pangkat yang nilainya jutaan! Cukup pakai 5 aturan emas eksponen di bawah ini—kalau basisnya beda (misal 4 dan 8), ubah dulu keduanya ke basis prima sama (2² dan 2³). 5 Aturan Emas Bilangan Berpangkat Bulat 1. aᵐ × aⁿ = aᵐ⁺ⁿ Kali basis sama → pangkat ditambah 2. aᵐ ÷ aⁿ = aᵐ⁻ⁿ Bagi basis sama → pangkat dikurang 3. (aᵐ)ⁿ = aᵐˣⁿ Pangkat dipangkatkan → dikali 4. a⁰ = 1 (a ≠ 0) Semua bilangan ≠ 0 pangkat nol = 1 5. a⁻ⁿ = 1 / aⁿ Pangkat negatif = pecahan terbalik",
        "poinPenting": [
          "Pangkat itu singkatan perkalian berulang—asalkan basisnya sama,",
          "Pondasi · Ubah ke Basis Prima Terkecil Hafalkan pangkat kecil: 4 = 2², 8 = 2³, 16 = 2⁴, 32 = 2⁵ · 9 = 3², 27 = 3³, 81 = 3⁴ · 25 = 5², 125 = 5³."
        ]
      },
      {
        "subjudul": "Unit 1.4: Bentuk Akar & Notasi Ilmiah",
        "isi": "10ⁿ! Bentuk Akar seperti √2, √3, √5 adalah bilangan irasional. Untuk menyederhanakan akar besar, pecah dengan kuadrat sempurna (4, 9, 16, 25, 36, 49, 64, 81, 100): misal √72 = √(36 × 2) = 6√2. Notasi Ilmiah ditulis a × 10ⁿ dengan syarat wajib 1 ≤ a < 10. Geser koma ke kiri → pangkat positif; geser ke kanan → pangkat negatif. Menyederhanakan Akar √72 = √(36 × 2) = 6√2 Tambah/kurang akar hanya bisa jika isi akarnya SAMA! Geser Koma Notasi Ilmiah 45.000 = 4,5 × 10⁴ ← geser kiri 4 langkah (+4) 0,0032 = 3,2 × 10⁻³ geser kanan 3 langkah (−3) →",
        "poinPenting": [
          "Pecah akar pakai bilangan kuadrat; tulis angka raksasa/super kecil pakai ×",
          "Pondasi · Operasi Bentuk Akar Kali/Bagi: √a × √b = √(ab) dan √a × √a = a. Tambah/Kurang: p√c + q√c = (p + q)√c (ibarat 3x + 2x = 5x). Rasionalkan: a / √b = (a√b) / b (kalikan √b / √b)."
        ]
      },
      {
        "subjudul": "Unit 1.5: Estimasi & Perkiraan Perhitungan",
        "isi": "rentang jawaban! Estimasi masuk sub-elemen wajib CP TKA SMP! Tujuannya mengukur kepekaan bilangan (number sense): apakah suatu harga belanja cukup dengan uang Rp250.000, atau berada di antara dua batas angka. Strategi Mengapit Nilai Asli: 19,6 × Rp12.750 Batas Bawah 19 × 12.000 = 228rb Estimasi Seimbang 20 × 12.500 = 250rb Batas Atas 20 × 13.000 = 260rb Nilai asli Rp249.900 tepat di tengah-tengah—ketemu tanpa kali bersusun!",
        "poinPenting": [
          "Tidak semua soal butuh hitungan eksak—pakai estimasi untuk mengunci",
          "Pondasi · 3 Cara Estimasi Cerdas Taksiran Atas: bulatkan naik → berguna cek batas maksimum anggaran. Taksiran Bawah: bulatkan turun → berguna cek batas minimum. Taksiran Seimbang: satu naik, satu turun → paling dekat nilai asli!"
        ]
      },
      {
        "subjudul": "Unit 1.6: Persen, Diskon & Promo Belanja",
        "isi": "kamu bayar! Soal belanja, diskon tunggal, diskon ganda (50% + 20%), dan promo beli gratis (seperti “Beli 4 gratis 1 termurah”) adalah menu wajib TKA SMP! Jika barang didiskon d%, kita hanya membayar (100% − d%) dari harga awal. Diskon Belanja: Potongan harga dihitung dari harga awal sebelum diskon (Bayar = (100% − %Diskon) × Harga Awal)",
        "poinPenting": [
          "Jangan tertipu angka diskon besar—selalu hitung harga yang benar-benar",
          "Pondasi · Mencari Harga Sebelum Diskon Jika setelah diskon 20% kamu membayar Rp160.000, artinya Rp160.000 itu adalah 80%. Maka harga awal = (100/80) × 160.000 = Rp200.000 (bukan 120% × 160.000!)."
        ]
      },
      {
        "subjudul": "Unit 1.7: Aritmetika Sosial (Untung, Rugi, Pajak & Bunga)",
        "isi": "jual! Dalam Aritmetika Sosial, pahami 3 keluarga transaksi sehari-hari: (1) Jual–Beli (Untung = Jual − Beli), (2) Berat Kemasan (Bruto = Neto + Tara), dan (3) Perbankan & Pajak (Bunga Tunggal & PPN). Alur Harga Beli → Jual Modal 100%→Jual (100+U)% %U = (Untung ÷ Modal) × 100% Kalau rugi R%: Jual = (100 − R)% Bruto = Neto + Tara Neto (Isi Bersih) Tara Bruto = Berat Kotor Total Tara = Berat Kemasan/Karung",
        "poinPenting": [
          "Persen untung/rugi selalu dibandingkan ke Harga Beli (Modal), bukan harga",
          "Pondasi · Rumus Bunga Tunggal (Bank) Jika menabung Modal (M) selama n bulan dengan bunga p% per tahun: Bunga = (n / 12) × (p / 100) × M  |  Tabungan Akhir = M + Bunga."
        ]
      },
      {
        "subjudul": "Unit 1.8: Faktorisasi Prima, FPB & KPK",
        "isi": "bersamaan lagi! Faktorisasi Prima memecah bilangan asli menjadi perkalian bilangan prima (2, 3, 5, 7, 11, ...). Di TKA SMP, soal faktorisasi prima sering muncul dalam bentuk PGK MCMA mencari faktor persekutuan dari bilangan berpangkat! Pohon Faktor 36 36 4 9 2 2 3 3 36 = 2² × 3² Beda FPB vs KPK FPB: Faktor SAMA, pangkat KECIL Kata kunci: dibagi sama banyak, paket KPK: SEMUA faktor, pangkat BESAR Kata kunci: bersamaan lagi, berkedip",
        "poinPenting": [
          "FPB untuk membagi paket sama banyak; KPK untuk jadwal bertemu",
          "Pondasi · Ciri Habis Dibagi Cepat Habis dibagi 2: genap · Habis dibagi 3: jumlah digit kelipatan 3 · Habis dibagi 5: ekor 0 atau 5 · Habis dibagi 9: jumlah digit kelipatan 9."
        ]
      },
      {
        "subjudul": "Unit 1.9: Rasio, Skala & Laju Perubahan",
        "isi": "kecepatan tiap tahap! Pada Rasio & Proporsi (misal cairan A : B = 3 : 5), bayangkan 3 kotak A dan 5 kotak B—total ada 8 kotak sama besar. Sementara Skala Peta (1 : 200.000) artinya 1 cm di peta = 200.000 cm = 2 km di dunia nyata! Skala Peta: Perbandingan jarak pada peta (cm) terhadap jarak sebenarnya di lapangan (cm/km)",
        "poinPenting": [
          "Bayangkan rasio sebagai potongan kotak sama besar, dan laju sebagai",
          "Pondasi · Laju Perubahan di Soal TKA Laju perubahan bukan cuma kecepatan (km/jam) dan debit (L/menit), tapi juga durasi antrean (misal alur pelayanan donor darah PMI) atau tarif per satuan waktu!"
        ]
      },
      {
        "subjudul": "Unit 1.10: Perbandingan Senilai & Berbalik Nilai",
        "isi": "Soal proyek renovasi dan persediaan pakan adalah langganan tetap TKA SMP! Jika jumlah pekerja ditambah maka waktu selesai makin cepat, itu pasti berbalik nilai (kalikan lurus: a₁ × b₁ = a₂ × b₂). Perbandingan Senilai Barang ↑ maka Harga ↑ a₁ / b₁ = a₂ / b₂ Kali silang · bensin–jarak Berbalik Nilai Pekerja ↑ maka Hari ↓ a₁ × b₁ = a₂ × b₂ Kali lurus · proyek, pakan",
        "poinPenting": [
          "Cek arah panahnya dulu: kalau kiri naik, kanan ikut naik atau malah turun?",
          "Pondasi · Beban Kerja Hari-Orang (HO) Beban Total = Pekerja × Target Hari. Sisa Beban = Total − Sudah dikerjakan. Pekerja Sisa = Sisa Beban ÷ Sisa Hari Efektif."
        ]
      }
    ],
    "trikCepat": "Trik Cepat · Skor Ujian Benar–Salah Untuk soal skor olimpiade (Benar +4, Salah −2, Kosong −1): selalu hitung jumlah soal kosong dulu (Total − Dijawab), baru kalikan tiap kategori!",
    "jebakanUmum": "Banyak siswa menghitung 12 − 2 × 5 dari kiri ke kanan jadi 10 × 5 = 50. Salah! Kali/bagi harus didahulukan: 12 − 10 = 2.",
    "contohSoal": [
      {
        "soal": "Suhu daging di dalam freezer mula-mula −6°C. Saat dikeluarkan dan dimasak, suhunya naik 4°C setiap 3 menit. Berapa suhu daging setelah 15 menit?",
        "opsi": {
          "A": "Opsi A",
          "B": "Opsi B",
          "C": "Opsi C",
          "D": "Opsi D"
        },
        "kunci": "B",
        "pembahasanLangkah": [
          "Yuk Bahas · Suhu Ruang Pendingin (PG Aplikasi) Soal: Suhu daging di dalam freezer mula-mula −6°C. Saat dikeluarkan dan dimasak, suhunya naik 4°C setiap 3 menit. Berapa suhu daging setelah 15 menit? Opsi: A. 10°C · B. 14°C · C. 20°C · D. 26°C Hitung dulu berapa kali suhunya naik: dalam 15 menit ada 15 ÷ 3 = 5 kali kenaikan. Total kenaikan suhu = 5 × 4°C = +20°C. Nah, tambahkan ke suhu awal: −6 + 20 = 14°C! (Hati-hati: opsi C adalah jebakan kalau lupa suhu awal −6.) Jawaban: B. 14°C"
        ]
      },
      {
        "soal": "Pak Budi punya lahan 600 m². Sebanyak ⅓ bagian ditanami jagung, 25% bagian ditanami cabai, dan sisanya dibuat kolam ikan. Berapa luas kolam ikan Pak Budi?",
        "opsi": {
          "A": "Opsi A",
          "B": "Opsi B",
          "C": "Opsi C",
          "D": "Opsi D"
        },
        "kunci": "B",
        "pembahasanLangkah": [
          "Yuk Bahas · Sisa Lahan Kebun (PG Aplikasi) Soal: Pak Budi punya lahan 600 m². Sebanyak ⅓ bagian ditanami jagung, 25% bagian ditanami cabai, dan sisanya dibuat kolam ikan. Berapa luas kolam ikan Pak Budi? Opsi: A. 200 m² · B. 250 m² · C. 300 m² · D. 350 m² Hitung satu per satu atau gabung pecahannya! Jagung = ⅓ × 600 = 200 m². Cabai = 25% × 600 = ¼ × 600 = 150 m². Total yang sudah dipakai = 200 + 150 = 350 m². Maka sisa untuk kolam = 600 − 350 = 250 m²! Jawaban: B. 250 m²"
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "mtk_smp_b1_q1",
        "soal": "Soal 1 · Unit 1.6 (Promo Belanja) Ani membeli 2 pulpen (@Rp12.000) dan 2 pensil (@Rp8.000). Promo “Hemat Berempat”: setiap pembelian 4 barang (boleh campur) mendapat potongan harga sebesar 1 barang termurah. Total yang harus dibayar Ani adalah … A. Rp32.000  ·  B. Rp36.000  ·  C. Rp40.000  ·  D. Rp44.000",
        "opsi": {
          "A": "Rp32.000",
          "B": "Rp36.000",
          "C": "Rp40.000",
          "D": "Rp44.000"
        },
        "kunci": "A",
        "pembahasan": "2(12rb) + 2(8rb) − 8rb = 40rb − 8rb ="
      },
      {
        "id": "mtk_smp_b1_q2",
        "soal": "Soal 2 · Unit 1.3 (Bilangan Berpangkat) Nilai dari 2⁻³ + 2⁻² + 5⁰ adalah … A. 1⅛  ·  B. 1⅜  ·  C. 1½  ·  D. 2⅜ Latihan Bab 1 · Level 2 (PGK MCMA) Jawaban benar lebih dari satu—cek tiap pernyataan!",
        "opsi": {
          "A": "1⅛",
          "B": "1⅜",
          "C": "1½",
          "D": "Pernyataan / Opsi (4) Benar"
        },
        "kunci": "B",
        "pembahasan": "⅛ + ¼ + 1 = ⅛ + 2/8 + 1 = 1⅜."
      },
      {
        "id": "mtk_smp_b1_q3",
        "soal": "Soal 3 · Unit 1.8 (Faktorisasi Prima) Diketahui bilangan 36 dan 60. Pilih semua pernyataan yang merupakan faktor persekutuan keduanya! (1) 2² × 3     (2) 2 × 3 (3) 2² × 3²    (4) 2 × 5",
        "opsi": {
          "A": "Pernyataan / Opsi (1) Benar",
          "B": "Pernyataan / Opsi (2) Benar",
          "C": "Pernyataan / Opsi (3) Benar",
          "D": "Pernyataan / Opsi (4) Benar"
        },
        "kunci": "A",
        "pembahasan": "36 = 2²×3², 60 = 2²×3×5 → FPB = 2²×3 = 12."
      },
      {
        "id": "mtk_smp_b1_q4",
        "soal": "Soal 4 · Unit 1.7 (Aritmetika Sosial) Sebuah jaket berlabel Rp300.000 mendapat diskon 20%. Pilih semua pernyataan yang benar! (1) Besar potongan harga adalah Rp60.000. (2) Harga setelah diskon adalah Rp240.000. (3) Jika dikenakan PPN 10% dari harga diskon, total bayar menjadi Rp264.000. (4) Harga akhirnya sama dengan diskon tunggal 10%. Bab 1 · Bilangan — Latihan Soal TKA SMP 2027 Latihan Bab 1 · Level 3 & Kunci Pembahasan Latihan Bab 1 · Level 3 (Penalaran) Tentukan Benar atau Salah untuk setiap pernyataan!",
        "opsi": {
          "A": "Pernyataan / Opsi (1) Benar",
          "B": "Pernyataan / Opsi (2) Benar",
          "C": "Pernyataan / Opsi (3) Benar",
          "D": "Pernyataan / Opsi (4) Benar"
        },
        "kunci": "A",
        "pembahasan": "Diskon = 60rb → bayar 240rb. Plus PPN 10% ="
      },
      {
        "id": "mtk_smp_b1_q5",
        "soal": "Soal 5 · Unit 1.10 (PGK Kategori — Proyek) Renovasi ruang kelas direncanakan selesai 12 hari oleh 6 pekerja. Tentukan Benar/Salah: A. Total beban pekerjaan setara 72 hari-orang. B. Agar selesai dalam 8 hari, dibutuhkan total 9 pekerja. C. Jika pekerja dikurangi jadi 4 orang, proyek selesai dalam 8 hari.",
        "opsi": {
          "A": "Total beban pekerjaan setara 72 hari-orang.",
          "C": "Jika pekerja dikurangi jadi 4 orang, proyek selesai dalam 8 hari.",
          "B": "Pernyataan / Opsi (2) Benar",
          "D": "Pernyataan / Opsi (4) Benar"
        },
        "kunci": "A",
        "pembahasan": "Total = 6×12 = 72 HO. 8 hari →"
      },
      {
        "id": "mtk_smp_b1_q6",
        "soal": "Soal 6 · Unit 1.4 (PGK Kategori — Akar & Notasi) Tentukan Benar atau Salah untuk perhitungan berikut: A. √75 − √27 = 2√3. B. Bentuk notasi ilmiah dari 0,00048 adalah 4,8 × 10⁻⁴. C. Nilai √9 + √16 sama dengan √25.",
        "opsi": {
          "A": "√75 − √27 = 2√3.",
          "C": "Nilai √9 + √16 sama dengan √25.",
          "B": "Pernyataan / Opsi (2) Benar",
          "D": "Pernyataan / Opsi (4) Benar"
        },
        "kunci": "A",
        "pembahasan": "5√3 − 3√3 = 2√3. Sedangkan 3"
      }
    ]
  },
  {
    "id": "mtk_smp_bab_2",
    "subtestKode": "MTK_SMP",
    "subtestNama": "Matematika (Numerasi TKA)",
    "subtestSingkatan": "MTK",
    "subtestEmoji": "📐",
    "subtestWarna": "#ea580c",
    "subtestBgLight": "#fff7ed",
    "babNumber": 2,
    "slug": "aljabar-spldv-kuadrat-fungsi-pola",
    "judul": "Bab 2 · Aljabar (SPLDV, Persamaan Kuadrat, Fungsi & Pola Bilangan)",
    "durasiBacaMenit": 15,
    "ringkasanSingkat": "Sederhanakan bentuk aljabar, pemfaktoran kuadrat, sistem persamaan linear dua variabel (SPLDV), pemetaan relasi fungsi, dan barisan deret.",
    "learningObjectives": [
      "Memfaktorkan persamaan kuadrat dan menyelesaikan SPLDV dengan eliminasi-substitusi kilat.",
      "Menentukan daerah hasil (range) fungsi linear dan menyusun model matematika masalah nyata.",
      "Menemukan rumus suku ke-$n$ ($U_n$) dan jumlah $n$ suku pertama ($S_n$) barisan aritmetika/geometri."
    ],
    "pdfUrl": "/modul-pdf/Modul_Master_TKA_SMP_Matematika_2027.pdf",
    "pdfFilename": "Modul_Master_TKA_SMP_Matematika_2027.pdf",
    "pdfTotalHalaman": 52,
    "isUtama": true,
    "units": [
      {
        "unitNumber": "2.1",
        "judul": "Bentuk Aljabar & Suku Sejenis",
        "hook": "Apel hanya bisa ditambah apel, jeruk dengan jeruk—begitu juga suku aljabar!",
        "teori": "Dalam bentuk aljabar seperti 4x − 7y + 9, kenali 3 tokohnya: angka di depan huruf disebut koefisien (4 dan −7), hurufnya disebut variabel (x, y), dan angka tanpa huruf disebut konstanta (9). Kelompokkan Suku Sejenis (Huruf & Pangkat Sama) 5x² −3x +2x² +8x −4 Hasil: 7x² + 5x − 4 Ingat: x² dan x BUKAN suku sejenis karena pangkatnya berbeda!",
        "pondasi": "Pondasi · Menerjemahkan Cerita ke Aljabar Misalkan x = harga 1 buku dan y = harga 1 pulpen. Maka “3 buku dan 2 pulpen dikurangi potongan Rp5.000” ditulis: 3x + 2y − 5.000.",
        "jebakanTka": "Banyak siswa menjumlahkan 3x + 2 = 5x. Salah! 3x punya variabel, sedangkan 2 adalah konstanta—tidak boleh digabung!",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 2.1",
          "soal": "Sebuah kebun persegi panjang memiliki panjang (3x + 4) m dan lebar (2x − 1) m. Nyatakan keliling kebun dalam bentuk aljabar paling sederhana!",
          "opsiString": "A. 5x + 3 · B. 10x + 6 · C. 10x + 3 · D. 6x + 6 Keliling persegi panjang = 2 × (p + l). Jumlahkan dulu p +",
          "jawaban": "B",
          "solusi": "Yuk Bahas · Keliling Kebun Aljabar (PG) Soal: Sebuah kebun persegi panjang memiliki panjang (3x + 4) m dan lebar (2x − 1) m. Nyatakan keliling kebun dalam bentuk aljabar paling sederhana! Opsi: A. 5x + 3 · B. 10x + 6 · C. 10x + 3 · D. 6x + 6 Keliling persegi panjang = 2 × (p + l). Jumlahkan dulu p + l: (3x + 2x) + (4 − 1) = 5x + 3. Jangan lupa dikali 2! Hasilnya 2(5x + 3) = 10x + 6 meter. Jawaban: B. 10x + 6"
        },
        "trikCepat": "Trik Cepat · Tanda Selalu Ikut Angka di Belakangnya Saat memindahkan suku 6x − 12y − 2x + 10y, bawa selalu tanda di depannya: −12y dan −2x!",
        "pageNumber": 16,
        "illustrationImg": null,
        "illustrationCaption": "",
        "slideImg": "/modul-assets/pages/mtk_p16.png"
      },
      {
        "unitNumber": "2.2",
        "judul": "Sifat Operasi Aljabar",
        "hook": "Tiga sifat resmi CP untuk membuka kurung dan menyederhanakan ekspresi",
        "teori": "aljabar! Tiga sifat operasi aljabar wajib di CP Pusmendik: Komutatif (tukar urutan: a+b = b+a), Asosiatif (pindah kurung: (a+b)+c = a+(b+c)), dan Distributif (sebar kali ke dalam kurung: a(b+c) = ab+ac). Distributif 1 Suku a ( b + c ) = ab + ac −2(x − 5y) = −2x + 10y (−) × (−) berubah jadi (+) Perkalian Dua Kurung (Pelangi) (x + 3)(x − 2) = x² − 2x + 3x − 6 = x² + x − 6 Depan–Luar–Dalam–Belakang!",
        "pondasi": "Pondasi · Hati-Hati Kata “Kurangkan A dari B” Bahasa Indonesia di soal aljabar sering menjebak: “Kurangkan A dari B” artinya B − A (yang belakang ditulis di depan!). Contoh: kurangkan 2x dari 5x = 5x − 2x = 3x.",
        "jebakanTka": "Tanda minus di depan kurung mengubah SEMUA tanda di dalamnya! −(3x − 5) = −3x + 5, bukan −3x − 5.",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 2.2",
          "soal": "Bentuk paling sederhana dari 3(2x − 4y) − 2(x − 5y) adalah …",
          "opsiString": "A. 4x − 2y · B. 4x − 22y · C. 8x − 2y · D. 4x + 2y Buka kurung",
          "jawaban": "A",
          "solusi": "Yuk Bahas · Sederhanakan Aljabar (PG Resmi) Soal: Bentuk paling sederhana dari 3(2x − 4y) − 2(x − 5y) adalah … Opsi: A. 4x − 2y · B. 4x − 22y · C. 8x − 2y · D. 4x + 2y Buka kurung pertama: 6x − 12y. Buka kurung kedua (awas minus ketemu minus!): −2x + 10y. Gabungkan suku sejenis: (6x − 2x) + (−12y + 10y) = 4x − 2y! Jawaban: A. 4x − 2y"
        },
        "trikCepat": "Trik Cepat · Cek Pakai x = 1, y = 1 Masukkan x=1, y=1 ke soal: 3(2−4) − 2(1−5) = −6 + 8 = 2. Cek opsi A: 4(1) − 2(1) = 2. Pasti benar!",
        "pageNumber": 17,
        "illustrationImg": null,
        "illustrationCaption": "",
        "slideImg": "/modul-assets/pages/mtk_p17.png"
      },
      {
        "unitNumber": "2.3",
        "judul": "Identitas Kuadrat & Pemfaktoran",
        "hook": "Pemfaktoran itu kebalikan dari membuka kurung—sangat ampuh untuk",
        "teori": "menyederhanakan pecahan! Lihat gambar persegi bersisi (a + b) di bawah! Luas totalnya terdiri dari 4 potong: a², b², dan dua persegi panjang ab. Itulah kenapa (a + b)² selalu punya suku tengah +2ab! Visual Luas (a + b)² a² ab ab b² a²+2ab +b² 3 Rumus Emas Pemfaktoran 1. ab + ac = a(b + c) 2. a² − b² = (a + b)(a − b) 3. x²+(p+q)x+pq = (x+p)(x+q) Cari 2 angka: dikali = c, ditambah = b!",
        "pondasi": "Pondasi · Kapan Pakai Selisih Kuadrat? Setiap melihat dua bilangan kuadrat dikurangkan (x² − 25 atau 99² − 1²), langsung pecah jadi (tambah)(kurang): (x + 5)(x − 5)!",
        "jebakanTka": "(x + 3)² ≠ x² + 9! Jangan pernah melupakan suku tengah 2ab: hasil yang benar adalah x² + 6x + 9!",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 2.3",
          "soal": "Bentuk sederhana dari (x² − 9) / (x² + 5x + 6) adalah …",
          "opsiString": "A. (x−3)/(x+2) · B. (x+3)/(x+2) · C. (x−3)/(x−2) · D. (x−9)/(x+6) Faktorkan atas dan bawah! Atas pakai selisih",
          "jawaban": "A",
          "solusi": "Yuk Bahas · Pecahan Aljabar (PG Aplikasi) Soal: Bentuk sederhana dari (x² − 9) / (x² + 5x + 6) adalah … Opsi: A. (x−3)/(x+2) · B. (x+3)/(x+2) · C. (x−3)/(x−2) · D. (x−9)/(x+6) Faktorkan atas dan bawah! Atas pakai selisih kuadrat: x² − 9 = (x + 3)(x − 3). Bawah cari 2 angka dikali 6 ditambah 5 → 3 dan 2, jadi (x + 3)(x + 2). Coret (x + 3) atas dan bawah → sisa (x − 3) / (x + 2)! Jawaban: A. (x − 3) / (x + 2)"
        },
        "trikCepat": "Trik Cepat · Jangan Coret Bagian Tambah! Pada (x + 3)/(x + 2), huruf x tidak boleh dicoret karena masih terikat tanda tambah. Hanya faktor perkalian utuh yang boleh dicoret!",
        "pageNumber": 18,
        "illustrationImg": null,
        "illustrationCaption": "",
        "slideImg": "/modul-assets/pages/mtk_p18.png"
      },
      {
        "unitNumber": "2.4",
        "judul": "Persamaan Linear Satu Variabel (PLSV)",
        "hook": "Apa pun yang dilakukan di ruas kiri, wajib dilakukan juga di ruas kanan!",
        "teori": "Bayangkan PLSV (ax + b = c) seperti timbangan pasar yang sejajar. Tujuannya membuat kotak x berdiri sendirian di satu sisi agar kita tahu berat aslinya. Analogi PLSV: Ruas kiri dan ruas kanan selalu seimbang seperti neraca — tambah/kurangi angka yang sama di kedua sisi",
        "pondasi": "Pondasi · 3 Langkah Pindah Ruas  Buka semua kurung (kalau ada) dan hilangkan pecahan dengan kali KPK.  Kumpulkan suku ber-x di kiri, angka biasa di kanan (pindah ruas = balik tanda).  Bagi angka kanan dengan koefisien x.",
        "jebakanTka": "Jika ada pecahan seperti ½x + ⅓ = 2, jangan pusing samakan penyebut satu-satu—langsung kalikan seluruh persamaan dengan KPK penyebut (6) agar pecahannya langsung hilang!",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 2.4",
          "soal": "Umur Kakak 4 tahun lebih tua dari umur Adik. Jika jumlah umur mereka berdua adalah 28 tahun, berapakah umur Kakak?",
          "opsiString": "A. 12 tahun · B. 14 tahun · C. 16 tahun · D. 18 tahun Misalkan umur Adik = x, maka umur Kakak = x + 4. Tulis",
          "jawaban": "C",
          "solusi": "Yuk Bahas · Soal Cerita Umur (PG Aplikasi) Soal: Umur Kakak 4 tahun lebih tua dari umur Adik. Jika jumlah umur mereka berdua adalah 28 tahun, berapakah umur Kakak? Opsi: A. 12 tahun · B. 14 tahun · C. 16 tahun · D. 18 tahun Misalkan umur Adik = x, maka umur Kakak = x + 4. Tulis persamaannya: x + (x + 4) = 28 → 2x + 4 = 28 → 2x = 24 → x = 12 (umur Adik). Awas, yang ditanya umur Kakak: 12 + 4 = 16 tahun! Jawaban: C. 16 tahun"
        },
        "trikCepat": "Trik Cepat · Jumlah & Selisih 2 Bilangan Diketahui jumlah = 28, selisih = 4. Yang besar = (28 + 4) ÷ 2 = 16; yang kecil = (28 − 4) ÷ 2 = 12!",
        "pageNumber": 19,
        "illustrationImg": "/modul-assets/illustrations/mtk_p19.jpeg",
        "illustrationCaption": "Analogi PLSV: Ruas kiri dan ruas kanan selalu seimbang seperti neraca —",
        "slideImg": "/modul-assets/pages/mtk_p19.png"
      },
      {
        "unitNumber": "2.5",
        "judul": "Pertidaksamaan Linear (PtLSV)",
        "hook": "Sama persis seperti PLSV, bedanya cuma di tanda ≤, ≥, <, > dan aturan",
        "teori": "minus! Di TKA SMP, PtLSV hampir selalu muncul sebagai soal cerita batas anggaran, kapasitas lift, atau nilai minimum lulus. Kunci utamanya: hafal kamus kata pembatas dan pahami titik penuh vs titik kosong di garis bilangan. Kamus Tanda PtLSV ≤maksimal, tidak lebih dari ≥minimal, paling sedikit <kurang dari, di bawah >lebih dari, melampaui Garis Bilangan PtLSV 7 x ≤ 7 (bulat penuh) x < 7 (kosong, 7 tdk ikut)",
        "pondasi": "Pondasi · Model Biaya Linear Pola soal kurir/ojek/paket: Biaya Tetap + (Tarif/km × Jarak) ≤ Anggaran. Tulis dulu apa itu x sebelum menghitung!",
        "jebakanTka": "Kalau kedua ruas dikali/dibagi bilangan negatif, tanda pertidaksamaan wajib dibalik! Contoh: −3x ≤ 12 → x ≥ −4.",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 2.5",
          "soal": "Jasa kurir memasang biaya tetap Rp12.000 plus Rp4.000/km. Pelanggan punya anggaran tidak lebih dari Rp40.000. Pilih semua pernyataan benar! (1) Jika jarak = x km, modelnya 4.000x + 12.000 ≤ 40.000. (2) Jarak pengantaran maksimum adalah 7 km. (3) Jika jarak 8 km, total biaya melebihi anggaran. (4) Tambah 1 km menambah biaya Rp16.000. Model (1) Benar. Kurangi 12.000: 4.000x ≤ 28.000 → x ≤ 7 km (2 Benar). Kalau 8 km: 32.000 + 12.000 = 44.000 > 40.000 (3 Benar). Tambah 1 km cuma tambah Rp4.000 (4 Salah). Jawaban: Pernyataan (1), (2), dan (3)",
          "opsiString": "",
          "jawaban": "",
          "solusi": "Yuk Bahas · Jasa Pengantaran (PGK MCMA Resmi) Soal: Jasa kurir memasang biaya tetap Rp12.000 plus Rp4.000/km. Pelanggan punya anggaran tidak lebih dari Rp40.000. Pilih semua pernyataan benar! (1) Jika jarak = x km, modelnya 4.000x + 12.000 ≤ 40.000. (2) Jarak pengantaran maksimum adalah 7 km. (3) Jika jarak 8 km, total biaya melebihi anggaran. (4) Tambah 1 km menambah biaya Rp16.000. Model (1) Benar. Kurangi 12.000: 4.000x ≤ 28.000 → x ≤ 7 km (2 Benar). Kalau 8 km: 32.000 + 12.000 = 44.000 > 40.000 (3 Benar). Tambah 1 km cuma tambah Rp4.000 (4 Salah). Jawaban: Pernyataan (1), (2), dan (3)"
        },
        "trikCepat": "Trik Cepat · Jarak Maksimum Jarak Maks = (Anggaran − Biaya Tetap) ÷ Tarif/km = (40.000 − 12.000) ÷ 4.000 = 7 km!",
        "pageNumber": 20,
        "illustrationImg": null,
        "illustrationCaption": "",
        "slideImg": "/modul-assets/pages/mtk_p20.png"
      },
      {
        "unitNumber": "2.6",
        "judul": "SPLDV (Eliminasi & Substitusi)",
        "hook": "Samakan satu paket, kurangkan, langsung ketemu harga satuannya!",
        "teori": "SPLDV muncul saat ada dua variabel (x, y) dan dua persamaan. Metode paling cepat adalah Gabungan: samakan koefisien variabel yang ingin dibuang (Eliminasi), lalu masukkan hasilnya (Substitusi). Visual Eliminasi Struk Tiket Museum 2 D + 4 Anak = Rp110.000 (Struk 2 × 2) 2 D +3 Anak = Rp95.000 (Struk 1) − 2D habis! Sisa: 1 Anak = Rp110.000 − Rp95.000 = Rp15.000",
        "pondasi": "Pondasi · 3 Langkah Anti-Salah SPLDV  Beri nama variabel jelas (d = dewasa, a = anak).  Eliminasi variabel yang tidak ditanyakan agar 1 langkah langsung dapat jawaban.  Substitusi ke persamaan berangka paling kecil jika ditanya keduanya.",
        "jebakanTka": "Kalau tanda koefisien yang disamakan sama (+ dan +), pakai kurang (−). Kalau tandanya beda (+ dan −), pakai tambah (+) supaya nol!",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 2.6",
          "soal": "Tiket museum untuk 2 dewasa & 3 anak = Rp95.000. Tiket untuk 1 dewasa & 2 anak = Rp55.000. Berapa harga tiket 1 anak?",
          "opsiString": "A. Rp10.000 · B. Rp15.000 · C. Rp20.000 · D. Rp25.000 Hilangkan dewasa (d)! Kalikan persamaan kedua dengan 2 → 2d + 4a = 110.000. Kurangkan dengan 2d + 3a = 95.000 → langsung dapat a = Rp15.000! (Opsi D adalah jebakan harga tiket dewasa.)",
          "jawaban": "B",
          "solusi": "Yuk Bahas · Tiket Museum (PG Aplikasi) Soal: Tiket museum untuk 2 dewasa & 3 anak = Rp95.000. Tiket untuk 1 dewasa & 2 anak = Rp55.000. Berapa harga tiket 1 anak? Opsi: A. Rp10.000 · B. Rp15.000 · C. Rp20.000 · D. Rp25.000 Hilangkan dewasa (d)! Kalikan persamaan kedua dengan 2 → 2d + 4a = 110.000. Kurangkan dengan 2d + 3a = 95.000 → langsung dapat a = Rp15.000! (Opsi D adalah jebakan harga tiket dewasa.) Jawaban: B. Rp15.000"
        },
        "trikCepat": "Trik Cepat · Cek Sekaligus! Kalau ditanya nilai x + y dari 3x + 2y = 14 dan 2x + 3y = 11, langsung jumlahkan keduanya: 5x + 5y = 25 → x + y = 5!",
        "pageNumber": 21,
        "illustrationImg": null,
        "illustrationCaption": "",
        "slideImg": "/modul-assets/pages/mtk_p21.png"
      },
      {
        "unitNumber": "2.7",
        "judul": "SPLDV Soal Penalaran TKA",
        "hook": "Di level penalaran TKA, solusinya sudah dikasih—kamu diminta mencari nilai",
        "teori": "a dan b! Tipe soal resmi Pusmendik yang sering bikin siswa kaget: diketahui sistem persamaan punya solusi (x, y) = (5, −2), lalu kita diminta mengecek sifat koefisien a dan b (prima/ganjil/persamaan lain). Alur Soal Parameter SPLDV (Tipe Pusmendik) 1. Substitusi x = 5, y = −2 → 2. Dapat SPL baru dalam a dan b → 3. Uji Pernyataan Benar / Salah Jangan bingung melihat 4 huruf—begitu x dan y masuk, tinggal 2 huruf!",
        "pondasi": "Pondasi · Soal Parkir Mobil & Motor Di tempat parkir ada 40 kendaraan (mobil = 4 roda, motor = 2 roda) dengan total 110 roda → modelnya: m + t = 40 dan 4m + 2t = 110.",
        "jebakanTka": "Saat memasukkan y = −2 ke persamaan, selalu pakai tanda kurung! Misal −3y = −3(−2) = +6, bukan −6.",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 2.7",
          "soal": "Sistem persamaan ax + by = 13 dan ax − by = 17 mempunyai solusi (x, y) = (5, −2). Tentukan Benar/Salah! A. a merupakan bilangan prima. B. b merupakan bilangan ganjil. C. Nilai 10a + b = 35. Masukkan x=5, y=−2: 5a − 2b = 13 dan 5a + 2b = 17. Jumlahkan langsung: 10a = 30 → a = 3 (prima → A Benar!). Masukkan a=3: 15 + 2b = 17 → b = 1 (ganjil → B Benar!). Cek C: 10(3) + 1 = 31 ≠ 35 (C Salah). Jawaban: A. Benar · B. Benar · C. Salah",
          "opsiString": "",
          "jawaban": "A",
          "solusi": "Yuk Bahas · Parameter SPLDV (PGK Kategori) Soal: Sistem persamaan ax + by = 13 dan ax − by = 17 mempunyai solusi (x, y) = (5, −2). Tentukan Benar/Salah! A. a merupakan bilangan prima. B. b merupakan bilangan ganjil. C. Nilai 10a + b = 35. Masukkan x=5, y=−2: 5a − 2b = 13 dan 5a + 2b = 17. Jumlahkan langsung: 10a = 30 → a = 3 (prima → A Benar!). Masukkan a=3: 15 + 2b = 17 → b = 1 (ganjil → B Benar!). Cek C: 10(3) + 1 = 31 ≠ 35 (C Salah). Jawaban: A. Benar · B. Benar · C. Salah"
        },
        "trikCepat": "Trik Cepat · Soal Parkir 3 Detik Jumlah Mobil = (Total Roda − 2 × Total Kendaraan) ÷ 2 = (110 − 80) ÷ 2 = 15 mobil!",
        "pageNumber": 22,
        "illustrationImg": null,
        "illustrationCaption": "",
        "slideImg": "/modul-assets/pages/mtk_p22.png"
      },
      {
        "unitNumber": "2.8",
        "judul": "Relasi & Fungsi (Domain, Kodomain, Range)",
        "hook": "Syarat fungsi cuma lihat lingkaran kiri: tidak boleh kosong, tidak boleh",
        "teori": "bercabang! Semua Fungsi adalah Relasi, tetapi tidak semua relasi adalah fungsi. Di diagram panah, lingkaran kiri = Domain (asal), lingkaran kanan = Kodomain (kawan), dan anggota kanan yang terkena panah = Range (hasil). Fungsi f(x) = 3x + 5 1 2 3 4 8 10 11 14 · 17 Domain Kodomain (10 ≠ Range) 3 Cara Penyajian Fungsi 1. Diagram Panah 2. Pasangan Berurutan {(1,8), (2,11), (3,14)} 3. Rumus & Grafik f(x) = 3x + 5",
        "pondasi": "Pondasi · Banyak Pemetaan Jika banyak anggota A adalah n(A) dan B adalah n(B), maka banyak fungsi yang mungkin dari A ke B adalah n(B) pangkat n(A)!",
        "jebakanTka": "Di pasangan berurutan {(1,3), (2,5), (1,7)}, itu BUKAN fungsi karena angka depan (Domain) 1 muncul dua kali!",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 2.8",
          "soal": "Fungsi f(x) = 3x + 5 memiliki Domain {1, 2, 3, 4} dan Kodomain {6, 8, 10, 11, 14, 17, 20}. Pilih semua pernyataan benar! (1) Nilai f(3) = 14. (2) Daerah hasil (Range) adalah {8, 11, 14, 17}. (3) Jika f(a) = 26, maka nilai a = 7. (4) Angka 10 termasuk anggota Range. Hitung bayangan: f(1)=8, f(2)=11, f(3)=14, f(4)=17 → (1) & (2) Benar! Cek (3): 3a + 5 = 26 → a = 7 (Benar). Angka 10 tidak kena panah (4 Salah). Jawaban: Pernyataan (1), (2), dan (3)",
          "opsiString": "",
          "jawaban": "",
          "solusi": "Yuk Bahas · Domain & Range (PGK MCMA) Soal: Fungsi f(x) = 3x + 5 memiliki Domain {1, 2, 3, 4} dan Kodomain {6, 8, 10, 11, 14, 17, 20}. Pilih semua pernyataan benar! (1) Nilai f(3) = 14. (2) Daerah hasil (Range) adalah {8, 11, 14, 17}. (3) Jika f(a) = 26, maka nilai a = 7. (4) Angka 10 termasuk anggota Range. Hitung bayangan: f(1)=8, f(2)=11, f(3)=14, f(4)=17 → (1) & (2) Benar! Cek (3): 3a + 5 = 26 → a = 7 (Benar). Angka 10 tidak kena panah (4 Salah). Jawaban: Pernyataan (1), (2), dan (3)"
        },
        "trikCepat": "Trik Cepat · Uji Garis Vertikal Tarik garis lurus vertikal di grafik: jika hanya memotong kurva di 1 titik, berarti itu Fungsi!",
        "pageNumber": 23,
        "illustrationImg": null,
        "illustrationCaption": "",
        "slideImg": "/modul-assets/pages/mtk_p23.png"
      },
      {
        "unitNumber": "2.9",
        "judul": "Nilai & Rumus Fungsi Linear",
        "hook": "Bayangkan f(x) seperti mesin pabrik: masukkan bahan x, keluar produk f(x)!",
        "teori": "Fungsi linear selalu berbentuk f(x) = ax + b (grafiknya berupa garis lurus). Angka a adalah gradien / laju kenaikan per 1 satuan, sedangkan b adalah nilai awal saat x = 0. Visual Mesin Fungsi Pabrik Logam: f(x) = 6x + 3 Input (x) 7 batang → Mesin f(x) 6(7) + 3 = 45 → Output f(7) 45 kg Jika diketahui 2 nilai fungsi f(p) dan f(q), langsung cari gradien a = (f(q)−f(p)) ÷ (q−p)!",
        "pondasi": "Pondasi · Mencari Rumus f(x) = ax + b Jika diketahui f(2) = 11 dan f(5) = 23: 1) Cari a = (23 − 11) ÷ (5 − 2) = 12 ÷ 3 = 4. 2) Masukkan ke f(2) = 11: 4(2) + b = 11 → b = 3. Jadi f(x) = 4x + 3!",
        "jebakanTka": "Jangan tertukar mencari f(5) (masukkan 5 ke x) dengan mencari x jika f(x) = 5 (buat persamaan ax + b = 5)!",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 2.9",
          "soal": "Tarif parkir mengikuti rumus linear f(t) = at + b (t = jam). Parkir 2 jam bayar Rp9.000, sedangkan 5 jam bayar Rp18.000. Berapa tarif parkir selama 8 jam?",
          "opsiString": "A. Rp24.000 · B. Rp27.000 · C. Rp30.000 · D. Rp33.000 Cari kenaikan per jam (a): dari 2 ke 5 jam naik 3 jam, biaya naik Rp9.000 → a = Rp3.000/jam! Dari 5 jam ke 8 jam juga naik 3 jam, jadi langsung tambah Rp9.000 → 18.000 + 9.000 = Rp27.000!",
          "jawaban": "B",
          "solusi": "Yuk Bahas · Tarif Parkir Linear (PG Aplikasi) Soal: Tarif parkir mengikuti rumus linear f(t) = at + b (t = jam). Parkir 2 jam bayar Rp9.000, sedangkan 5 jam bayar Rp18.000. Berapa tarif parkir selama 8 jam? Opsi: A. Rp24.000 · B. Rp27.000 · C. Rp30.000 · D. Rp33.000 Cari kenaikan per jam (a): dari 2 ke 5 jam naik 3 jam, biaya naik Rp9.000 → a = Rp3.000/jam! Dari 5 jam ke 8 jam juga naik 3 jam, jadi langsung tambah Rp9.000 → 18.000 + 9.000 = Rp27.000! Jawaban: B. Rp27.000"
        },
        "trikCepat": "Trik Cepat · Loncatan Linear Karena fungsinya linear, loncatan input sama → loncatan output sama! 2 → 5 → 8 (sama-sama +3), maka 9rb → 18rb → 27rb!",
        "pageNumber": 24,
        "illustrationImg": null,
        "illustrationCaption": "",
        "slideImg": "/modul-assets/pages/mtk_p24.png"
      },
      {
        "unitNumber": "2.10",
        "judul": "Barisan & Deret Berhingga",
        "hook": "Amati pola loncatannya: ditambah tetap (aritmetika), dikali tetap (geometri),",
        "teori": "atau pola titik! Barisan adalah daftar angka berurutan (U₁, U₂, U₃, ...), sedangkan Deret adalah jumlah total seluruh sukunya (Sₙ). Di TKA SMP, kenali pola aritmetika naik/turun, geometri dasar, dan pola gambar titik segitiga! Barisan Aritmetika: Jumlah kursi di tiap baris gedung pertunjukan bertambah tetap (beda b) dari depan ke belakang",
        "pondasi": "Pondasi · Rumus Barisan & Deret Aritmetika: Uₙ = a + (n − 1)b  |  Sₙ = (n/2)(a + Uₙ) Geometri (rasio r): Uₙ = a × rⁿ⁻¹ (misal membelah diri ×2 tiap jam).",
        "jebakanTka": "Pada barisan menurun (makin pendek 12 cm), beda bernilai negatif (b = −12). Dan untuk U₅ pengalinya 4 (5−1), bukan 5!",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 2.10",
          "soal": "Tukang memotong 9 papan kayu. Potongan pertama 240 cm, tiap potongan berikutnya lebih pendek 12 cm. Tentukan Benar/Salah! A. Panjang potongan ke-5 adalah 190 cm. B. Panjang potongan terakhir (ke-9) adalah 144 cm. C. Selisih potongan ke-2 dan ke-8 adalah 72 cm. a = 240, b = −12. Cek A: U₅ = 240 + 4(−12) = 192 cm (Salah). Cek B: U₉ = 240 + 8(−12) = 144 cm (Benar). Cek C: (8 − 2) × 12 = 72 cm (Benar). Jawaban: A. Salah · B. Benar · C. Benar",
          "opsiString": "",
          "jawaban": "A",
          "solusi": "Yuk Bahas · Potongan Kayu (PGK Kategori Resmi) Soal: Tukang memotong 9 papan kayu. Potongan pertama 240 cm, tiap potongan berikutnya lebih pendek 12 cm. Tentukan Benar/Salah! A. Panjang potongan ke-5 adalah 190 cm. B. Panjang potongan terakhir (ke-9) adalah 144 cm. C. Selisih potongan ke-2 dan ke-8 adalah 72 cm. a = 240, b = −12. Cek A: U₅ = 240 + 4(−12) = 192 cm (Salah). Cek B: U₉ = 240 + 8(−12) = 144 cm (Benar). Cek C: (8 − 2) × 12 = 72 cm (Benar). Jawaban: A. Salah · B. Benar · C. Benar"
        },
        "trikCepat": "Trik Cepat · Selisih Dua Suku Langsung pakai |Uₘ − Uₙ| = |m − n| × |b|. Selisih ke-2 dan ke-8 = 6 × 12 = 72 cm!",
        "pageNumber": 25,
        "illustrationImg": "/modul-assets/illustrations/mtk_p25.jpeg",
        "illustrationCaption": "",
        "slideImg": "/modul-assets/pages/mtk_p25.png"
      }
    ],
    "cheatSheet": "",
    "cheatSheetImg": null,
    "miniTryout": "",
    "tryoutImg": null,
    "petaBelajarImg": null,
    "konsepTeori": [
      {
        "subjudul": "Unit 2.1: Bentuk Aljabar & Suku Sejenis",
        "isi": "Dalam bentuk aljabar seperti 4x − 7y + 9, kenali 3 tokohnya: angka di depan huruf disebut koefisien (4 dan −7), hurufnya disebut variabel (x, y), dan angka tanpa huruf disebut konstanta (9). Kelompokkan Suku Sejenis (Huruf & Pangkat Sama) 5x² −3x +2x² +8x −4 Hasil: 7x² + 5x − 4 Ingat: x² dan x BUKAN suku sejenis karena pangkatnya berbeda!",
        "poinPenting": [
          "Apel hanya bisa ditambah apel, jeruk dengan jeruk—begitu juga suku aljabar!",
          "Pondasi · Menerjemahkan Cerita ke Aljabar Misalkan x = harga 1 buku dan y = harga 1 pulpen. Maka “3 buku dan 2 pulpen dikurangi potongan Rp5.000” ditulis: 3x + 2y − 5.000."
        ]
      },
      {
        "subjudul": "Unit 2.2: Sifat Operasi Aljabar",
        "isi": "aljabar! Tiga sifat operasi aljabar wajib di CP Pusmendik: Komutatif (tukar urutan: a+b = b+a), Asosiatif (pindah kurung: (a+b)+c = a+(b+c)), dan Distributif (sebar kali ke dalam kurung: a(b+c) = ab+ac). Distributif 1 Suku a ( b + c ) = ab + ac −2(x − 5y) = −2x + 10y (−) × (−) berubah jadi (+) Perkalian Dua Kurung (Pelangi) (x + 3)(x − 2) = x² − 2x + 3x − 6 = x² + x − 6 Depan–Luar–Dalam–Belakang!",
        "poinPenting": [
          "Tiga sifat resmi CP untuk membuka kurung dan menyederhanakan ekspresi",
          "Pondasi · Hati-Hati Kata “Kurangkan A dari B” Bahasa Indonesia di soal aljabar sering menjebak: “Kurangkan A dari B” artinya B − A (yang belakang ditulis di depan!). Contoh: kurangkan 2x dari 5x = 5x − 2x = 3x."
        ]
      },
      {
        "subjudul": "Unit 2.3: Identitas Kuadrat & Pemfaktoran",
        "isi": "menyederhanakan pecahan! Lihat gambar persegi bersisi (a + b) di bawah! Luas totalnya terdiri dari 4 potong: a², b², dan dua persegi panjang ab. Itulah kenapa (a + b)² selalu punya suku tengah +2ab! Visual Luas (a + b)² a² ab ab b² a²+2ab +b² 3 Rumus Emas Pemfaktoran 1. ab + ac = a(b + c) 2. a² − b² = (a + b)(a − b) 3. x²+(p+q)x+pq = (x+p)(x+q) Cari 2 angka: dikali = c, ditambah = b!",
        "poinPenting": [
          "Pemfaktoran itu kebalikan dari membuka kurung—sangat ampuh untuk",
          "Pondasi · Kapan Pakai Selisih Kuadrat? Setiap melihat dua bilangan kuadrat dikurangkan (x² − 25 atau 99² − 1²), langsung pecah jadi (tambah)(kurang): (x + 5)(x − 5)!"
        ]
      },
      {
        "subjudul": "Unit 2.4: Persamaan Linear Satu Variabel (PLSV)",
        "isi": "Bayangkan PLSV (ax + b = c) seperti timbangan pasar yang sejajar. Tujuannya membuat kotak x berdiri sendirian di satu sisi agar kita tahu berat aslinya. Analogi PLSV: Ruas kiri dan ruas kanan selalu seimbang seperti neraca — tambah/kurangi angka yang sama di kedua sisi",
        "poinPenting": [
          "Apa pun yang dilakukan di ruas kiri, wajib dilakukan juga di ruas kanan!",
          "Pondasi · 3 Langkah Pindah Ruas  Buka semua kurung (kalau ada) dan hilangkan pecahan dengan kali KPK.  Kumpulkan suku ber-x di kiri, angka biasa di kanan (pindah ruas = balik tanda).  Bagi angka kanan dengan koefisien x."
        ]
      },
      {
        "subjudul": "Unit 2.5: Pertidaksamaan Linear (PtLSV)",
        "isi": "minus! Di TKA SMP, PtLSV hampir selalu muncul sebagai soal cerita batas anggaran, kapasitas lift, atau nilai minimum lulus. Kunci utamanya: hafal kamus kata pembatas dan pahami titik penuh vs titik kosong di garis bilangan. Kamus Tanda PtLSV ≤maksimal, tidak lebih dari ≥minimal, paling sedikit <kurang dari, di bawah >lebih dari, melampaui Garis Bilangan PtLSV 7 x ≤ 7 (bulat penuh) x < 7 (kosong, 7 tdk ikut)",
        "poinPenting": [
          "Sama persis seperti PLSV, bedanya cuma di tanda ≤, ≥, <, > dan aturan",
          "Pondasi · Model Biaya Linear Pola soal kurir/ojek/paket: Biaya Tetap + (Tarif/km × Jarak) ≤ Anggaran. Tulis dulu apa itu x sebelum menghitung!"
        ]
      },
      {
        "subjudul": "Unit 2.6: SPLDV (Eliminasi & Substitusi)",
        "isi": "SPLDV muncul saat ada dua variabel (x, y) dan dua persamaan. Metode paling cepat adalah Gabungan: samakan koefisien variabel yang ingin dibuang (Eliminasi), lalu masukkan hasilnya (Substitusi). Visual Eliminasi Struk Tiket Museum 2 D + 4 Anak = Rp110.000 (Struk 2 × 2) 2 D +3 Anak = Rp95.000 (Struk 1) − 2D habis! Sisa: 1 Anak = Rp110.000 − Rp95.000 = Rp15.000",
        "poinPenting": [
          "Samakan satu paket, kurangkan, langsung ketemu harga satuannya!",
          "Pondasi · 3 Langkah Anti-Salah SPLDV  Beri nama variabel jelas (d = dewasa, a = anak).  Eliminasi variabel yang tidak ditanyakan agar 1 langkah langsung dapat jawaban.  Substitusi ke persamaan berangka paling kecil jika ditanya keduanya."
        ]
      },
      {
        "subjudul": "Unit 2.7: SPLDV Soal Penalaran TKA",
        "isi": "a dan b! Tipe soal resmi Pusmendik yang sering bikin siswa kaget: diketahui sistem persamaan punya solusi (x, y) = (5, −2), lalu kita diminta mengecek sifat koefisien a dan b (prima/ganjil/persamaan lain). Alur Soal Parameter SPLDV (Tipe Pusmendik) 1. Substitusi x = 5, y = −2 → 2. Dapat SPL baru dalam a dan b → 3. Uji Pernyataan Benar / Salah Jangan bingung melihat 4 huruf—begitu x dan y masuk, tinggal 2 huruf!",
        "poinPenting": [
          "Di level penalaran TKA, solusinya sudah dikasih—kamu diminta mencari nilai",
          "Pondasi · Soal Parkir Mobil & Motor Di tempat parkir ada 40 kendaraan (mobil = 4 roda, motor = 2 roda) dengan total 110 roda → modelnya: m + t = 40 dan 4m + 2t = 110."
        ]
      },
      {
        "subjudul": "Unit 2.8: Relasi & Fungsi (Domain, Kodomain, Range)",
        "isi": "bercabang! Semua Fungsi adalah Relasi, tetapi tidak semua relasi adalah fungsi. Di diagram panah, lingkaran kiri = Domain (asal), lingkaran kanan = Kodomain (kawan), dan anggota kanan yang terkena panah = Range (hasil). Fungsi f(x) = 3x + 5 1 2 3 4 8 10 11 14 · 17 Domain Kodomain (10 ≠ Range) 3 Cara Penyajian Fungsi 1. Diagram Panah 2. Pasangan Berurutan {(1,8), (2,11), (3,14)} 3. Rumus & Grafik f(x) = 3x + 5",
        "poinPenting": [
          "Syarat fungsi cuma lihat lingkaran kiri: tidak boleh kosong, tidak boleh",
          "Pondasi · Banyak Pemetaan Jika banyak anggota A adalah n(A) dan B adalah n(B), maka banyak fungsi yang mungkin dari A ke B adalah n(B) pangkat n(A)!"
        ]
      },
      {
        "subjudul": "Unit 2.9: Nilai & Rumus Fungsi Linear",
        "isi": "Fungsi linear selalu berbentuk f(x) = ax + b (grafiknya berupa garis lurus). Angka a adalah gradien / laju kenaikan per 1 satuan, sedangkan b adalah nilai awal saat x = 0. Visual Mesin Fungsi Pabrik Logam: f(x) = 6x + 3 Input (x) 7 batang → Mesin f(x) 6(7) + 3 = 45 → Output f(7) 45 kg Jika diketahui 2 nilai fungsi f(p) dan f(q), langsung cari gradien a = (f(q)−f(p)) ÷ (q−p)!",
        "poinPenting": [
          "Bayangkan f(x) seperti mesin pabrik: masukkan bahan x, keluar produk f(x)!",
          "Pondasi · Mencari Rumus f(x) = ax + b Jika diketahui f(2) = 11 dan f(5) = 23: 1) Cari a = (23 − 11) ÷ (5 − 2) = 12 ÷ 3 = 4. 2) Masukkan ke f(2) = 11: 4(2) + b = 11 → b = 3. Jadi f(x) = 4x + 3!"
        ]
      },
      {
        "subjudul": "Unit 2.10: Barisan & Deret Berhingga",
        "isi": "atau pola titik! Barisan adalah daftar angka berurutan (U₁, U₂, U₃, ...), sedangkan Deret adalah jumlah total seluruh sukunya (Sₙ). Di TKA SMP, kenali pola aritmetika naik/turun, geometri dasar, dan pola gambar titik segitiga! Barisan Aritmetika: Jumlah kursi di tiap baris gedung pertunjukan bertambah tetap (beda b) dari depan ke belakang",
        "poinPenting": [
          "Amati pola loncatannya: ditambah tetap (aritmetika), dikali tetap (geometri),",
          "Pondasi · Rumus Barisan & Deret Aritmetika: Uₙ = a + (n − 1)b  |  Sₙ = (n/2)(a + Uₙ) Geometri (rasio r): Uₙ = a × rⁿ⁻¹ (misal membelah diri ×2 tiap jam)."
        ]
      }
    ],
    "trikCepat": "Trik Cepat · Tanda Selalu Ikut Angka di Belakangnya Saat memindahkan suku 6x − 12y − 2x + 10y, bawa selalu tanda di depannya: −12y dan −2x!",
    "jebakanUmum": "Banyak siswa menjumlahkan 3x + 2 = 5x. Salah! 3x punya variabel, sedangkan 2 adalah konstanta—tidak boleh digabung!",
    "contohSoal": [
      {
        "soal": "Sebuah kebun persegi panjang memiliki panjang (3x + 4) m dan lebar (2x − 1) m. Nyatakan keliling kebun dalam bentuk aljabar paling sederhana!",
        "opsi": {
          "A": "Opsi A",
          "B": "Opsi B",
          "C": "Opsi C",
          "D": "Opsi D"
        },
        "kunci": "B",
        "pembahasanLangkah": [
          "Yuk Bahas · Keliling Kebun Aljabar (PG) Soal: Sebuah kebun persegi panjang memiliki panjang (3x + 4) m dan lebar (2x − 1) m. Nyatakan keliling kebun dalam bentuk aljabar paling sederhana! Opsi: A. 5x + 3 · B. 10x + 6 · C. 10x + 3 · D. 6x + 6 Keliling persegi panjang = 2 × (p + l). Jumlahkan dulu p + l: (3x + 2x) + (4 − 1) = 5x + 3. Jangan lupa dikali 2! Hasilnya 2(5x + 3) = 10x + 6 meter. Jawaban: B. 10x + 6"
        ]
      },
      {
        "soal": "Bentuk paling sederhana dari 3(2x − 4y) − 2(x − 5y) adalah …",
        "opsi": {
          "A": "Opsi A",
          "B": "Opsi B",
          "C": "Opsi C",
          "D": "Opsi D"
        },
        "kunci": "A",
        "pembahasanLangkah": [
          "Yuk Bahas · Sederhanakan Aljabar (PG Resmi) Soal: Bentuk paling sederhana dari 3(2x − 4y) − 2(x − 5y) adalah … Opsi: A. 4x − 2y · B. 4x − 22y · C. 8x − 2y · D. 4x + 2y Buka kurung pertama: 6x − 12y. Buka kurung kedua (awas minus ketemu minus!): −2x + 10y. Gabungkan suku sejenis: (6x − 2x) + (−12y + 10y) = 4x − 2y! Jawaban: A. 4x − 2y"
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "mtk_smp_b2_q1",
        "soal": "Soal 1 · Unit 2.2 (Sifat Distributif) Hasil pengurangan 2(3x − 4) dari 5(2x + 1) adalah … A. 4x + 13  ·  B. 4x − 3  ·  C. 16x − 3  ·  D. 4x + 5",
        "opsi": {
          "A": "4x + 13",
          "B": "4x − 3",
          "C": "16x − 3",
          "D": "4x + 5"
        },
        "kunci": "A",
        "pembahasan": "“dari” artinya (10x+5) − (6x−8) = 4x + 13."
      },
      {
        "id": "mtk_smp_b2_q2",
        "soal": "Soal 2 · Unit 2.9 (Fungsi Linear) Diketahui fungsi f(x) = 4x − 7. Jika f(k) = 13, maka nilai k adalah … A. 3  ·  B. 4  ·  C. 5  ·  D. 6 Latihan Bab 2 · Level 2 (PGK MCMA) Pilih semua pernyataan yang benar!",
        "opsi": {
          "A": "3",
          "B": "4",
          "C": "5",
          "D": "Pernyataan / Opsi (4) Benar"
        },
        "kunci": "C",
        "pembahasan": "4k − 7 = 13 → 4k = 20 → k = 5."
      },
      {
        "id": "mtk_smp_b2_q3",
        "soal": "Soal 3 · Unit 2.5 (PtLSV) Penyelesaian pertidaksamaan 2(x − 3) ≤ 4x + 2 adalah … Pilih pernyataan benar! (1) Hasil sederhananya adalah −2x ≤ 8. (2) Nilai x ≥ −4. (3) Bilangan bulat terkecil yang memenuhi adalah −4. (4) Nilai x = −5 memenuhi pertidaksamaan.",
        "opsi": {
          "A": "Pernyataan / Opsi (1) Benar",
          "B": "Pernyataan / Opsi (2) Benar",
          "C": "Pernyataan / Opsi (3) Benar",
          "D": "Pernyataan / Opsi (4) Benar"
        },
        "kunci": "A",
        "pembahasan": "2x−6 ≤ 4x+2 → −2x ≤ 8 → x ≥ −4 (balik"
      },
      {
        "id": "mtk_smp_b2_q4",
        "soal": "Soal 4 · Unit 2.10 (Barisan & Deret) Barisan aritmetika: 5, 9, 13, 17, … Pilih pernyataan benar! (1) Bedanya b = 4.    (2) Suku ke-10 adalah 41. (3) Jumlah 5 suku pertama = 65.    (4) Suku ke-6 adalah 24. Bab 2 · Aljabar — Latihan Soal TKA SMP 2027 Latihan Bab 2 · Level 3 & Kunci Pembahasan Latihan Bab 2 · Level 3 (Penalaran) Tentukan Benar atau Salah untuk setiap pernyataan!",
        "opsi": {
          "A": "Pernyataan / Opsi (1) Benar",
          "B": "Pernyataan / Opsi (2) Benar",
          "C": "Pernyataan / Opsi (3) Benar",
          "D": "Pernyataan / Opsi (4) Benar"
        },
        "kunci": "A",
        "pembahasan": "U₁₀ = 5 + 9(4) = 41. S₅ ="
      },
      {
        "id": "mtk_smp_b2_q5",
        "soal": "Soal 5 · Unit 2.6 (PGK Kategori — SPLDV Parkir) Di tempat parkir ada 30 kendaraan (mobil 4 roda & motor 2 roda) dengan total 84 roda. Tarif mobil Rp5.000, motor Rp2.000. Tentukan Benar/Salah: A. Banyak mobil di tempat parkir adalah 12 unit. B. Banyak motor adalah 18 unit. C. Total pendapatan parkir adalah Rp100.000.",
        "opsi": {
          "A": "Pernyataan / Opsi (1) Benar",
          "B": "Pernyataan / Opsi (2) Benar",
          "C": "Pernyataan / Opsi (3) Benar",
          "D": "Pernyataan / Opsi (4) Benar"
        },
        "kunci": "A",
        "pembahasan": "Mobil = (84−60)÷2 = 12, Motor"
      },
      {
        "id": "mtk_smp_b2_q6",
        "soal": "Soal 6 · Unit 2.10 (PGK Kategori — Pola Kursi) Gedung pertunjukan punya 8 baris kursi: baris ke-1 berisi 20 kursi, baris berikutnya selalu bertambah 4 kursi. Tentukan Benar/Salah: A. Baris ke-8 berisi 48 kursi. B. Total seluruh kursi di gedung adalah 272 kursi. C. Selisih baris ke-3 dan ke-7 adalah 20 kursi.",
        "opsi": {
          "B": "Total seluruh kursi di gedung adalah 272 kursi.",
          "C": "Selisih baris ke-3 dan ke-7 adalah 20 kursi.",
          "A": "Pernyataan / Opsi (1) Benar",
          "D": "Pernyataan / Opsi (4) Benar"
        },
        "kunci": "A",
        "pembahasan": "U₈ = 20+7(4) = 48. S₈ = (8/2)"
      }
    ]
  },
  {
    "id": "mtk_smp_bab_3",
    "subtestKode": "MTK_SMP",
    "subtestNama": "Matematika (Numerasi TKA)",
    "subtestSingkatan": "MTK",
    "subtestEmoji": "📐",
    "subtestWarna": "#ea580c",
    "subtestBgLight": "#fff7ed",
    "babNumber": 3,
    "slug": "geometri-pengukuran-pythagoras-ruang-transformasi",
    "judul": "Bab 3 · Geometri & Pengukuran (Sudut, Pythagoras, Ruang & Transformasi)",
    "durasiBacaMenit": 18,
    "ringkasanSingkat": "Kuasai hubungan sudut, Teorema Pythagoras, keliling/luas bangun datar, volume bangun ruang (prisma, limas, bola), dan 4 transformasi geometri.",
    "learningObjectives": [
      "Menghitung besar sudut jarum jam dan sudut pada dua garis sejajar yang dipotong transversal.",
      "Menerapkan triple Pythagoras dan kesebangunan dua segitiga pada soal cerita kontekstual.",
      "Menentukan bayangan titik pada translasi, refleksi, rotasi $90^\\circ/180^\\circ$, dan dilatasi skala $k$."
    ],
    "pdfUrl": "/modul-pdf/Modul_Master_TKA_SMP_Matematika_2027.pdf",
    "pdfFilename": "Modul_Master_TKA_SMP_Matematika_2027.pdf",
    "pdfTotalHalaman": 52,
    "isUtama": true,
    "units": [
      {
        "unitNumber": "3.1",
        "judul": "Mengenal Sudut & Sudut Jarum Jam",
        "hook": "Sudut = seberapa lebar “bukaan” dua garis.",
        "teori": "Bayangkan kalian membuka pintu. Makin lebar pintunya terbuka, makin besar sudutnya. Sudut diukur dengan derajat (°). Satu putaran penuh itu 360°, setengah putaran (garis lurus) 180°, dan seperempat putaran (pojok kotak) 90°. Sudut Jarum Jam (02.30): Jarum jam di tengah angka 2 & 3, jarum menit di angka 6 → selisih 3,5 angka × 30° = 105° Sudut yang lebih dari 180° tapi kurang dari 360° disebut sudut refleks, misalnya sudut di luar bukaan sudut lancip.",
        "pondasi": "Pondasi · Sudut Jarum Jam Jam itu lingkaran 360° dibagi 12 angka. Jadi jarak 1 angka = 30°. Jarum menit bergerak 6° tiap menit, dan jarum jam juga ikut bergeser sedikit: 0,5° tiap menit!",
        "jebakanTka": "Sudut 90° itu siku-siku, bukan lancip dan bukan tumpul. Lancip harus kurang dari 90°, tumpul harus lebih dari 90°.",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 3.1",
          "soal": "Berapa sudut terkecil antara jarum jam dan jarum menit pada pukul 02.30? 12 3 6 9 Pukul 02.30: 1 angka = 30°. Menit di angka 6. Jam di tengah 2 & 3 (2,5). Jarak = 3,5 × 30° = 105° Banyak yang menjawab jarum jam di angka 2. Salah! Pukul 02.30 itu sudah setengah jalan ke jam 3 (di 2,5). Jarak dari 2,5 ke 6 = 3,5 angka → 3,5 × 30° = 105°! Jawaban: 105°",
          "opsiString": "",
          "jawaban": "",
          "solusi": "Yuk Bahas · Sudut Jarum Jam Soal: Berapa sudut terkecil antara jarum jam dan jarum menit pada pukul 02.30? 12 3 6 9 Pukul 02.30: 1 angka = 30°. Menit di angka 6. Jam di tengah 2 & 3 (2,5). Jarak = 3,5 × 30° = 105° Banyak yang menjawab jarum jam di angka 2. Salah! Pukul 02.30 itu sudah setengah jalan ke jam 3 (di 2,5). Jarak dari 2,5 ke 6 = 3,5 angka → 3,5 × 30° = 105°! Jawaban: 105°"
        },
        "trikCepat": "Trik Cepat · Rumus Sudut Jam |30 × jam − 5,5 × menit|. Pukul 02.30: |30(2) − 5,5(30)| = |60 − 165| = 105°. Jika > 180°, kurangkan dari 360°!",
        "pageNumber": 28,
        "illustrationImg": "/modul-assets/illustrations/mtk_p28.jpeg",
        "illustrationCaption": "Sudut Jarum Jam (02.30): Jarum jam di tengah angka 2 & 3, jarum menit di",
        "slideImg": "/modul-assets/pages/mtk_p28.png"
      },
      {
        "unitNumber": "3.2",
        "judul": "Berpenyiku, Berpelurus & Bertolak Belakang",
        "hook": "Dua garis berpotongan membentuk huruf X: yang saling berhadapan selalu",
        "teori": "sama besar! Hafal 3 pasangan dasar ini sebelum masuk garis sejajar: (1) Berpenyiku (komplemen) membentuk pojok 90°, (2) Berpelurus (suplemen) membentuk garis lurus 180°, dan (3) Bertolak belakang posisinya saling membelakangi dan sama besar. Berpenyiku = 90° a b a + b = 90° Berpelurus = 180° x y x + y = 180° Bertolak Belakang p p Atas = Bawah",
        "pondasi": "Pondasi · Pelurus vs Penyiku Suatu Sudut Jika sudutnya A, maka Penyiku A = 90° − A dan Pelurus A = 180° − A. Selisih pelurus dan penyiku suatu sudut selalu 90°!",
        "jebakanTka": "Di soal sudut memakai huruf x, setelah ketemu x jangan langsung berhenti —masukkan lagi x ke sudut yang ditanyakan!",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 3.2",
          "soal": "Dua sudut saling berpelurus dengan besar (3x + 15)° dan (2x + 10) °. Berapa besar sudut yang lebih kecil?",
          "opsiString": "A. 31° · B. 72° · C. 108° · D. 118° Karena berpelurus, jumlahnya 180°!",
          "jawaban": "B",
          "solusi": "Yuk Bahas · Sudut Berpelurus Pakai x (PG) Soal: Dua sudut saling berpelurus dengan besar (3x + 15)° dan (2x + 10) °. Berapa besar sudut yang lebih kecil? Opsi: A. 31° · B. 72° · C. 108° · D. 118° Karena berpelurus, jumlahnya 180°! Tulis: (3x + 15) + (2x + 10) = 180 → 5x + 25 = 180 → 5x = 155 → x = 31°. Awas! Opsi A (31°) itu baru nilai x! Sudut yang kecil = 2(31) + 10 = 72°! Jawaban: B. 72°"
        },
        "trikCepat": "Trik Cepat · Rasio Pelurus / Penyiku Dua sudut berpelurus berbanding 2 : 3 → total 5 bagian = 180° → 1 bagian = 36°. Jadi sudutnya 72° dan 108°!",
        "pageNumber": 29,
        "illustrationImg": null,
        "illustrationCaption": "",
        "slideImg": "/modul-assets/pages/mtk_p29.png"
      },
      {
        "unitNumber": "3.3",
        "judul": "Garis Sejajar Transversal & Segitiga",
        "hook": "Tidak usah hafal 8 istilah panjang—pakai kode huruf F, Z, dan U!",
        "teori": "Jika dua garis sejajar (L₁ // L₂) dipotong satu garis miring (transversal), sebenarnya cuma muncul 2 besar sudut: sudut lancip dan pelurusnya (180° − lancip). Jumlah 3 sudut dalam segitiga juga selalu 180°! Rahasia Huruf F, Z, U Huruf F (Sehadap) → Sama Besar Huruf Z (Berseberangan) → Sama Besar Huruf U (Dalam Sepihak) → Jumlah 180° Sudut Luar Segitiga a b a+b Luar = jumlah 2 jauh!",
        "pondasi": "Pondasi · Segitiga Sama Kaki & Sama Sisi Segitiga Sama Kaki: dua sudut kakinya sama besar. Segitiga Sama Sisi: ketiga sudutnya masing-masing tepat 60°.",
        "jebakanTka": "Sudut dalam sepihak (huruf U) itu bukan sama besar, melainkan jumlahnya 180°! Kecuali kalau garis pemotongnya tegak lurus 90°.",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 3.3",
          "soal": "Rangka jembatan membentuk L₁ // L₂ dipotong transversal. Diketahui sudut lancip A = 50°. Tentukan Benar/Salah! L₁ L₂ A=50°B C DE A. Sudut D = 50°. B. Sudut C berpelurus dgn A jadi C = 50°. C. B dan E sama besar = 130°. D sehadap A → 50° (A Benar). C berpelurus A → 180°−50° = 130° (B Salah). B & E tumpul → 130° (C Benar). Jawaban: A. Benar · B. Salah · C. Benar",
          "opsiString": "",
          "jawaban": "A",
          "solusi": "Yuk Bahas · Rangka Jembatan (PGK Kategori Resmi) Soal: Rangka jembatan membentuk L₁ // L₂ dipotong transversal. Diketahui sudut lancip A = 50°. Tentukan Benar/Salah! L₁ L₂ A=50°B C DE A. Sudut D = 50°. B. Sudut C berpelurus dgn A jadi C = 50°. C. B dan E sama besar = 130°. D sehadap A → 50° (A Benar). C berpelurus A → 180°−50° = 130° (B Salah). B & E tumpul → 130° (C Benar). Jawaban: A. Benar · B. Salah · C. Benar"
        },
        "trikCepat": "Trik Cepat · Garis Bantu di Sudut Patah (Zig-Zag) Ketemu garis sejajar lalu di tengah ada sudut patah? Tarik 1 garis bantu sejajar tepat di titik patahnya, langsung terbentuk dua huruf Z!",
        "pageNumber": 30,
        "illustrationImg": null,
        "illustrationCaption": "",
        "slideImg": "/modul-assets/pages/mtk_p30.png"
      },
      {
        "unitNumber": "3.4",
        "judul": "Teorema Pythagoras & Triple",
        "hook": "Khusus segitiga siku-siku: kuadrat sisi miring = jumlah kuadrat dua sisi",
        "teori": "tegaknya! Sisi miring (hipotenusa, c) selalu berada di depan sudut 90° dan merupakan sisi terpanjang. Rumus intinya: c² = a² + b². Teorema Pythagoras: Tangga bersandar di tembok membentuk segitiga siku-siku (a² + b² = c², sisi miring = panjang tangga)",
        "pondasi": "Pondasi · Segitiga Istimewa 45° & 30°–60° 45°–45°–90°: perbandingan sisi = 1 : 1 : √2 (diagonal persegi = s√2). 30°–60°–90°: perbandingan sisi = 1 : √3 : 2 (depan 30° = setengah sisi miring!).",
        "jebakanTka": "Kalau yang dicari sisi tegak (a atau b), rumusnya DIKURANG (a = √(c² − b²)), bukan ditambah!",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 3.4",
          "soal": "Sebuah kapal berlayar dari pelabuhan ke arah Utara sejauh 16 km, lalu berbelok ke arah Timur sejauh 30 km. Berapa jarak terpendek kapal dari pelabuhan asal?",
          "opsiString": "A. 32 km · B. 34 km · C. 36 km · D. 46 km Utara dan Timur tegak lurus (90°)! Lihat",
          "jawaban": "B",
          "solusi": "Yuk Bahas · Kapal Berlayar (PG Aplikasi) Soal: Sebuah kapal berlayar dari pelabuhan ke arah Utara sejauh 16 km, lalu berbelok ke arah Timur sejauh 30 km. Berapa jarak terpendek kapal dari pelabuhan asal? Opsi: A. 32 km · B. 34 km · C. 36 km · D. 46 km Utara dan Timur tegak lurus (90°)! Lihat angkanya: 16 dan 30. Bagi 2 dulu jadi 8 dan 15—langsung ketemu Triple (8, 15, 17)! Kalikan kembali dengan 2 → 17 × 2 = 34 km! Tanpa hitung kuadrat ratusan! Jawaban: B. 34 km"
        },
        "trikCepat": "Trik Cepat · Jarak 2 Titik di Kartesius Jarak A(x₁, y₁) ke B(x₂, y₂) = √((Δx)² + (Δy)²). Sama persis dengan Pythagoras!",
        "pageNumber": 31,
        "illustrationImg": "/modul-assets/illustrations/mtk_p31.jpeg",
        "illustrationCaption": "Teorema Pythagoras: Tangga bersandar di tembok membentuk segitiga",
        "slideImg": "/modul-assets/pages/mtk_p31.png"
      },
      {
        "unitNumber": "3.5",
        "judul": "Kekongruenan & Kesebangunan",
        "hook": "Kongruen = kembar identik; Sebangun = foto yang di-zoom tanpa gepeng!",
        "teori": "Dua bangun disebut Sebangun (~) jika sudut bersesuaian sama besar dan rasio sisi bersesuaian sama. Jika bentuk dan ukurannya 100% sama, namanya Kongruen ( ≅ ). Kesebangunan Segitiga: Perbandingan tinggi tiang bendera dan bayangannya sama dengan tinggi siswa dan bayangannya",
        "pondasi": "Pondasi · Rumus Air Mancur (Sering Keluar!) Pada segitiga siku-siku ABC (siku-siku di A) dengan garis tinggi AD ke sisi miring BC: AD² = BD × CD · AB² = BD × BC · AC² = CD × BC.",
        "jebakanTka": "Pada segitiga bertumpuk sejajar, perbandingan sisi alas harus pakai sisi kecil ÷ sisi BESAR UTUH (bukan dibagi potongan bawahnya saja!).",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 3.5",
          "soal": "Pada segitiga siku-siku ABC (gambar kiri), diketahui BD = 4 cm dan CD = 9 cm. Tentukan Benar atau Salah! A. Segitiga ABD dan segitiga CAD saling sebangun. B. Panjang garis tinggi AD adalah 6 cm. C. Panjang sisi AB adalah 10 cm. Cek A: ketiga sudut segitiga ABD dan CAD sama besar → sebangun (Benar). Cek B: AD² = 4 × 9 = 36 → AD = 6 cm (Benar). Cek C: BC = 4 + 9 = 13, maka AB² = 4 × 13 = 52 → AB = √52 ≠ 10 (Salah). Jawaban: A. Benar · B. Benar · C. Salah",
          "opsiString": "",
          "jawaban": "A",
          "solusi": "Yuk Bahas · Segitiga Siku-Siku Sebangun (PGK) Soal: Pada segitiga siku-siku ABC (gambar kiri), diketahui BD = 4 cm dan CD = 9 cm. Tentukan Benar atau Salah! A. Segitiga ABD dan segitiga CAD saling sebangun. B. Panjang garis tinggi AD adalah 6 cm. C. Panjang sisi AB adalah 10 cm. Cek A: ketiga sudut segitiga ABD dan CAD sama besar → sebangun (Benar). Cek B: AD² = 4 × 9 = 36 → AD = 6 cm (Benar). Cek C: BC = 4 + 9 = 13, maka AB² = 4 × 13 = 52 → AB = √52 ≠ 10 (Salah). Jawaban: A. Benar · B. Benar · C. Salah"
        },
        "trikCepat": "Trik Cepat · Soal Bayangan Pohon Tinggi Pohon / Bayangan Pohon = Tinggi Tongkat / Bayangan Tongkat. Langsung kali silang!",
        "pageNumber": 32,
        "illustrationImg": "/modul-assets/illustrations/mtk_p32.jpeg",
        "illustrationCaption": "",
        "slideImg": "/modul-assets/pages/mtk_p32.png"
      },
      {
        "unitNumber": "3.6",
        "judul": "Keliling & Luas Segi Banyak",
        "hook": "Keliling = jalan mengitari pagar luar; Luas = seluruh ubin yang menutupi",
        "teori": "lantai! Pada bangun datar gabungan (seperti dinding samping rumah berbentuk persegi panjang + segitiga atap), pecah dulu jadi bangun dasar yang mudah dihitung luasnya. Ingat: untuk Keliling, hanya jumlahkan sisi tepi paling luar! Segitiga L = ½ × a × t Jajargenjang L = a × t Trapesium L = ½(a + b) × t Belah Ketupat & Layang-Layang L = ½ × d₁ × d₂ Persegi & Persegi Panjang L = s² & L = p × l",
        "pondasi": "Pondasi · Strategi Soal Cat Dinding / Keramik Hitung Luas Total Dinding dulu → bagi dengan daya sebar 1 kg cat (dibulatkan ke atas karena toko tidak jual cat eceran koma!) → pilih kombinasi kemasan agar sisa cat paling sedikit.",
        "jebakanTka": "Tinggi (t) pada segitiga, jajargenjang, dan trapesium wajib tegak lurus (90°) dengan alasnya—bukan sisi miringnya!",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 3.6",
          "soal": "Dinding samping rumah terdiri dari persegi panjang 8 m × 4 m dan atap segitiga alas 8 m tinggi 3 m. Jika 1 kg cat dapat mengecat 10 m², berapa minimal kg cat yang dibutuhkan?",
          "opsiString": "A. 4 kg · B. 5 kg · C. 6 kg · D. 7 kg Pecah jadi 2",
          "jawaban": "B",
          "solusi": "Yuk Bahas · Dinding Samping Rumah (PG Aplikasi) Soal: Dinding samping rumah terdiri dari persegi panjang 8 m × 4 m dan atap segitiga alas 8 m tinggi 3 m. Jika 1 kg cat dapat mengecat 10 m², berapa minimal kg cat yang dibutuhkan? Opsi: A. 4 kg · B. 5 kg · C. 6 kg · D. 7 kg Pecah jadi 2 bagian: Luas dinding bawah = 8 × 4 = 32 m². Luas atap segitiga = ½ × 8 × 3 = 12 m². Total luas = 32 + 12 = 44 m². Kebutuhan cat = 44 ÷ 10 = 4,4 kg → wajib dibulatkan ke atas jadi 5 kg! Jawaban: B. 5 kg"
        },
        "trikCepat": "Trik Cepat · Keliling Bangun Tangga Pada bangun datar berbentuk tangga/L siku-siku, dorong semua sisi cekung ke luar—kelilingnya persis sama dengan keliling persegi panjang utuh!",
        "pageNumber": 33,
        "illustrationImg": null,
        "illustrationCaption": "",
        "slideImg": "/modul-assets/pages/mtk_p33.png"
      },
      {
        "unitNumber": "3.7",
        "judul": "Lingkaran: Unsur, Keliling & Luas",
        "hook": "Kenali 6 unsur lingkaran dari gambarnya, lalu kuasai K = πd dan L = πr²!",
        "teori": "Lingkaran adalah kumpulan titik yang berjarak sama (jari-jari r) dari titik pusat O. Panjang diameter (d) = 2 × r. Nilai π = 22/7 (jika r/d kelipatan 7) atau 3,14 (selain kelipatan 7). Unsur Lingkaran pada Bianglala: Poros = titik pusat, jeruji = jari-jari (r), garis tengah = diameter (d = 2r), tepi = keliling",
        "pondasi": "Pondasi · Roda Berputar & Lintasan Sekali roda berputar penuh, jarak yang ditempuh = 1 Keliling Lingkaran. Jadi: Jarak Tempuh = Keliling × Banyak Putaran!",
        "jebakanTka": "Jangan pernah memasukkan diameter langsung ke rumus πr²! Bagi dua dulu jadi jari-jari (r = d/2)!",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 3.7",
          "soal": "Roda sepeda berjari-jari 35 cm berputar sebanyak 200 kali di jalan lurus. Berapa meter jarak yang ditempuh sepeda tersebut? (π = 22/7)",
          "opsiString": "A. 220 m · B. 440 m · C. 660 m · D. 880 m Cari keliling 1",
          "jawaban": "B",
          "solusi": "Yuk Bahas · Roda Sepeda & Pagar Taman (PG) Soal: Roda sepeda berjari-jari 35 cm berputar sebanyak 200 kali di jalan lurus. Berapa meter jarak yang ditempuh sepeda tersebut? (π = 22/7) Opsi: A. 220 m · B. 440 m · C. 660 m · D. 880 m Cari keliling 1 putaran: d = 2 × 35 = 70 cm, maka K = (22/7) × 70 = 220 cm. Untuk 200 putaran: 220 × 200 = 44.000 cm. Awas satuan! Ubah cm ke meter (bagi 100) → 440 meter! Jawaban: B. 440 m"
        },
        "trikCepat": "Trik Cepat · Lingkaran Kelipatan 7 Wajib Hafal r = 7 → K = 44, L = 154 · r = 14 → K = 88, L = 616 · r = 3,5 → K = 22, L = 38,5!",
        "pageNumber": 34,
        "illustrationImg": "/modul-assets/illustrations/mtk_p34.jpeg",
        "illustrationCaption": "",
        "slideImg": "/modul-assets/pages/mtk_p34.png"
      },
      {
        "unitNumber": "3.8",
        "judul": "Lingkaran: Busur, Juring & Gabungan",
        "hook": "Panjang busur dan luas juring itu cuma “sebagian potong” dari 360° lingkaran",
        "teori": "utuh! Untuk menghitung Panjang Busur atau Luas Juring bersudut pusat α°, tinggal kalikan pecahannya (α° / 360°) dengan Keliling atau Luas lingkaran penuh! Contoh: sudut 90° = ¼ lingkaran, sudut 60° = ⅙  lingkaran. Busur & Juring (α / 360°) 60° Busur = (α/360) × K Juring = (α/360) × L Luas Gabungan Taman & Kolam d=7m 20 m × 16 m (Rumput = Taman − Kolam)",
        "pondasi": "Pondasi · Sudut Pusat vs Sudut Keliling Jika menghadap busur yang sama: Sudut Pusat = 2 × Sudut Keliling. Khusus sudut keliling yang menghadap diameter, besarnya selalu 90° (siku- siku)!",
        "jebakanTka": "Saat menghitung keliling setengah lingkaran tertutup (seperti busur penggaris), jangan lupa tambahkan diameternya (½πd + d)!",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 3.8",
          "soal": "Taman persegi panjang 20 m × 16 m memiliki kolam lingkaran diameter 7 m di tengahnya. Sisa taman ditanami rumput (π = 22/7). Tentukan Benar/Salah! A. Luas area rumput lebih dari 280 m². B. Jika diameter kolam jadi 14 m, luas kolam jadi 4 kali lipat. C. Keliling kolam awal adalah 44 m. Luas taman = 320 m². Jari-jari r = 3,5 m → Luas kolam = 38,5 m². Rumput = 320 − 38,5 = 281,5 m² (A Benar). Diameter 2× → luas 2² = 4× (B Benar). Keliling = πd = 22 m (C Salah). Jawaban: A. Benar · B. Benar · C. Salah",
          "opsiString": "",
          "jawaban": "A",
          "solusi": "Yuk Bahas · Taman Kota & Kolam (PGK Kategori Resmi) Soal: Taman persegi panjang 20 m × 16 m memiliki kolam lingkaran diameter 7 m di tengahnya. Sisa taman ditanami rumput (π = 22/7). Tentukan Benar/Salah! A. Luas area rumput lebih dari 280 m². B. Jika diameter kolam jadi 14 m, luas kolam jadi 4 kali lipat. C. Keliling kolam awal adalah 44 m. Luas taman = 320 m². Jari-jari r = 3,5 m → Luas kolam = 38,5 m². Rumput = 320 − 38,5 = 281,5 m² (A Benar). Diameter 2× → luas 2² = 4× (B Benar). Keliling = πd = 22 m (C Salah). Jawaban: A. Benar · B. Benar · C. Salah"
        },
        "trikCepat": "Trik Cepat · Luas Cincin / Jalan Melingkar Untuk jalan setapak melingkari kolam: L = π(R² − r²) = π(R + r)(R − r)! Jauh lebih cepat!",
        "pageNumber": 35,
        "illustrationImg": null,
        "illustrationCaption": "",
        "slideImg": "/modul-assets/pages/mtk_p35.png"
      },
      {
        "unitNumber": "3.9",
        "judul": "Jaring-Jaring Bangun Ruang",
        "hook": "Bayangkan kardus kemasan dibuka rata—tutup & alas tidak boleh bertumpuk",
        "teori": "saat dilipat! CP resmi TKA SMP secara khusus menguji jaring-jaring 4 bangun ruang: Prisma, Tabung, Limas, dan Kerucut. Soal TKA sering memadukannya dengan tata letak pemotongan kertas karton! 1. Prisma Segitiga 2. Tabung (Selimut + 2 Lingkaran) 3. Limas Segiempat (Bintang) 4. Kerucut (Juring + 1 Lingkaran)",
        "pondasi": "Pondasi · Ciri Jaring-Jaring Valid Prisma segi-n: punya 2 alas sama (berseberangan sisi) + n persegi panjang tegak. Limas segi-n: punya 1 alas + n segitiga yang menempel di setiap sisi alas.",
        "jebakanTka": "Pada jaring-jaring Tabung, panjang selimut persegi panjang wajib sama dengan keliling lingkaran alas (2πr) agar pas menutup rapat!",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 3.9",
          "soal": "Usaha rumahan membuat kemasan prisma segitiga dari karton 50 cm × 100 cm. Setiap 1 jaring-jaring utuh membutuhkan bidang persegi panjang ukuran 25 cm × 25 cm tanpa disambung. Berapa kemasan maksimum yang bisa dibuat?",
          "opsiString": "A. 4 kemasan · B. 8 kemasan · C. 9 kemasan · D. 14 kemasan Cek tata letaknya di karton 50 × 100 cm! Sisi lebar 50 ÷ 25 = 2 baris. Sisi panjang 100 ÷ 25 = 4 kolom. Kalikan",
          "jawaban": "B",
          "solusi": "Yuk Bahas · Kemasan Karton Prisma (PG Resmi) Soal: Usaha rumahan membuat kemasan prisma segitiga dari karton 50 cm × 100 cm. Setiap 1 jaring-jaring utuh membutuhkan bidang persegi panjang ukuran 25 cm × 25 cm tanpa disambung. Berapa kemasan maksimum yang bisa dibuat? Opsi: A. 4 kemasan · B. 8 kemasan · C. 9 kemasan · D. 14 kemasan Cek tata letaknya di karton 50 × 100 cm! Sisi lebar 50 ÷ 25 = 2 baris. Sisi panjang 100 ÷ 25 = 4 kolom. Kalikan langsung: 2 × 4 = 8 kemasan utuh tanpa sisa potongan! Jawaban: B. 8 kemasan"
        },
        "trikCepat": "Trik Cepat · Soal Potong Karton Jangan hanya membagi Luas Karton ÷ Luas Jaring! Selalu cek pembagian panjang ÷ p dan lebar ÷ l karena potongan tidak boleh disambung- sambung!",
        "pageNumber": 36,
        "illustrationImg": null,
        "illustrationCaption": "",
        "slideImg": "/modul-assets/pages/mtk_p36.png"
      },
      {
        "unitNumber": "3.10",
        "judul": "Bangun Ruang: Kubus, Balok & Prisma",
        "hook": "Keluarga Prisma itu alas & tutupnya kembar: Volume selalu Luas Alas ×",
        "teori": "Tinggi! Kubus, balok, dan prisma segitiga/segienam semuanya masuk keluarga Prisma (punya alas dan tutup sejajar & kongruen). Jadi cukup hafal 1 rumus sakti: Volume = Luas Alas × Tinggi! Bangun Ruang Balok (Akuarium): Volume air = p × l × t; luas kaca tanpa tutup = pl + 2pt + 2lt",
        "pondasi": "Pondasi · Luas Permukaan Tanpa Tutup Di soal kolam renang atau akuarium tanpa tutup, jangan pakai 2(pl + pt + lt)—cukup pl + 2pt + 2lt (alasnya cuma dihitung 1 kali!).",
        "jebakanTka": "Hati-hati konversi satuan volume! 1 liter = 1 dm³ = 1.000 cm³, dan 1 m³ = 1.000 liter!",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 3.10",
          "soal": "Kontraktor membangun monumen berbentuk balok ukuran 180 cm × 60 cm × 50 cm dari bata ringan berukuran 60 cm × 20 cm × 10 cm tersusun rapat tanpa celah. Berapa minimal bata yang diperlukan?",
          "opsiString": "A. 35 bata · B. 45 bata · C. 55 bata · D. 60 bata Jangan dikalikan sampai ratusan ribu dulu! Langsung bagi tiap",
          "jawaban": "B",
          "solusi": "Yuk Bahas · Monumen Bata Ringan (PG Resmi) Soal: Kontraktor membangun monumen berbentuk balok ukuran 180 cm × 60 cm × 50 cm dari bata ringan berukuran 60 cm × 20 cm × 10 cm tersusun rapat tanpa celah. Berapa minimal bata yang diperlukan? Opsi: A. 35 bata · B. 45 bata · C. 55 bata · D. 60 bata Jangan dikalikan sampai ratusan ribu dulu! Langsung bagi tiap dimensinya: (180 ÷ 60) × (60 ÷ 20) × (50 ÷ 10) = 3 × 3 × 5 = 45 bata! Jauh lebih cepat dan anti-salah hitung nol! Jawaban: B. 45 bata"
        },
        "trikCepat": "Trik Cepat · Coret Sebelum Kali! Untuk soal Banyak Barang = Volume Besar ÷ Volume Kecil, tulis dalam bentuk pecahan lalu coret atas–bawah sebelum mengalikan!",
        "pageNumber": 37,
        "illustrationImg": "/modul-assets/illustrations/mtk_p37.jpeg",
        "illustrationCaption": "",
        "slideImg": "/modul-assets/pages/mtk_p37.png"
      },
      {
        "unitNumber": "3.11",
        "judul": "Bangun Ruang: Limas & Bola",
        "hook": "Puncak lancip selalu pakai ⅓; bola selalu pakai ⁴⁄₃ πr³!",
        "teori": "Sesuai matriks resmi Pusmendik TKA SMP 2027, tiga volume bangun ruang yang diujikan adalah Prisma, Limas, dan Bola (catatan: volume tabung & kerucut tidak tercantum di matriks volume resmi, hanya jaring-jaringnya). Limas (Puncak Lancip) t V = ⅓ × L.alas × t Bola (Jari-Jari r) r V = ⁴⁄₃ πr³ · Lp = 4πr²",
        "pondasi": "Pondasi · Setengah Bola & Kubah Volume ½ Bola = ⅔ πr³. Untuk Luas Permukaan ½ Bola Padat (Pejal) = 3πr² (2πr² lengkung + 1πr² alas lingkaran); kalau berongga/kubah cukup 2πr²!",
        "jebakanTka": "Di soal Limas, jangan tertukar antara tinggi limas (t, tegak di dalam) untuk Volume, dengan tinggi segitiga sisi miring untuk Luas Permukaan! Keduanya dihubungkan oleh Pythagoras!",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 3.11",
          "soal": "Yuk Bahas · Limas Persegi & Bola (Aplikasi) Soal 1: Limas persegi alas 10 cm × 10 cm memiliki tinggi 12 cm. Berapa volumenya? Langsung masukkan rumus: V = ⅓ × (10 × 10) × 12. Coret 12 ÷ 3 = 4 → 100 × 4 = 400 cm³! Soal 2: Jika jari-jari sebuah bola diperbesar 2 kali lipat, menjadi berapa kali lipat volumenya? Karena volume bola bergantung pada r³, maka 2³ = 8 kali lipat! Jawaban: 400 cm³ dan 8 kali lipat",
          "opsiString": "",
          "jawaban": "",
          "solusi": "Yuk Bahas · Limas Persegi & Bola (Aplikasi) Soal 1: Limas persegi alas 10 cm × 10 cm memiliki tinggi 12 cm. Berapa volumenya? Langsung masukkan rumus: V = ⅓ × (10 × 10) × 12. Coret 12 ÷ 3 = 4 → 100 × 4 = 400 cm³! Soal 2: Jika jari-jari sebuah bola diperbesar 2 kali lipat, menjadi berapa kali lipat volumenya? Karena volume bola bergantung pada r³, maka 2³ = 8 kali lipat! Jawaban: 400 cm³ dan 8 kali lipat"
        },
        "trikCepat": "Trik Cepat · Skala Panjang–Luas–Volume Jika ukuran diperbesar k kali: Panjang × k · Luas × k² · Volume × k³!",
        "pageNumber": 38,
        "illustrationImg": null,
        "illustrationCaption": "",
        "slideImg": "/modul-assets/pages/mtk_p38.png"
      },
      {
        "unitNumber": "3.12",
        "judul": "Transformasi: Translasi & Refleksi",
        "hook": "Translasi itu menggeser lurus; Refleksi itu bercermin dengan jarak sama!",
        "teori": "Translasi T(a, b) menggeser titik: a positif ke kanan (negatif ke kiri), b positif ke atas (negatif ke bawah). Refleksi membalik posisi benda terhadap garis cermin tanpa mengubah ukuran! 1. Translasi T(4, −2) P(−1, 4) P'(3, 2) (x, y) → (x + a, y + b) 2. Refleksi Sumbu-Y Sb-Y: x berubah tanda → (−x, y)",
        "pondasi": "Pondasi · 5 Rumus Cermin Wajib Tahu Sumbu-X: (x, −y)  |  Sumbu-Y: (−x, y) Garis y = x: (y, x)  |  Garis y = −x: (−y, −x) Garis x = h: (2h − x, y)  |  Garis y = k: (x, 2k − y)",
        "jebakanTka": "Hafal kebalikannya: cermin terhadap Sumbu-X yang berubah tanda adalah y (x, −y); cermin terhadap Sumbu-Y yang berubah tanda adalah x (−x, y)!",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 3.12",
          "soal": "Robot pembersih berada di posisi P(−1, 4) lalu bergerak mengikuti translasi T(4, −2). Di koordinat mana posisi akhirnya? Lalu jika titik R(3, −5) dicerminkan terhadap Sumbu-X, jadi apa? Robot: tinggal jumlahkan koordinatnya! x' = −1 + 4 = 3, y' = 4 + (−2) = 2 → P'(3, 2). Cermin Sumbu-X: x tetap, y dibalik tandanya → R'(3, 5)! Jawaban: P'(3, 2) dan R'(3, 5)",
          "opsiString": "",
          "jawaban": "",
          "solusi": "Yuk Bahas · Robot Pembersih (PG Resmi) Soal: Robot pembersih berada di posisi P(−1, 4) lalu bergerak mengikuti translasi T(4, −2). Di koordinat mana posisi akhirnya? Lalu jika titik R(3, −5) dicerminkan terhadap Sumbu-X, jadi apa? Robot: tinggal jumlahkan koordinatnya! x' = −1 + 4 = 3, y' = 4 + (−2) = 2 → P'(3, 2). Cermin Sumbu-X: x tetap, y dibalik tandanya → R'(3, 5)! Jawaban: P'(3, 2) dan R'(3, 5)"
        },
        "trikCepat": "Trik Cepat · Cek Cermin x = h Bayangkan jarak titik ke cermin! Titik x = 2 dicerminkan ke x = 5 → jaraknya 3 ke kanan, lompat 3 lagi ke kanan → x' = 8!",
        "pageNumber": 39,
        "illustrationImg": null,
        "illustrationCaption": "",
        "slideImg": "/modul-assets/pages/mtk_p39.png"
      },
      {
        "unitNumber": "3.13",
        "judul": "Transformasi: Rotasi & Dilatasi",
        "hook": "Rotasi itu memutar terhadap titik pusat O; Dilatasi itu zoom in / zoom out",
        "teori": "skala k! Pada Rotasi, sudut positif (+) berarti berputar berlawanan arah jarum jam (CCW), sedangkan negatif (−) searah jarum jam (CW). Pada Dilatasi pusat O skala k, cukup kalikan kedua koordinat dengan k! 3. Rotasi +90° (Berlawanan Jam) (x, y) (−y, x) +90° CCW = −270° CW 4. Dilatasi Skala k (Zoom) ×k → (x, y) → (kx, ky) · Luas jadi k²×",
        "pondasi": "Pondasi · Tabel Rotasi & Dilatasi Pusat O(0, 0) Rotasi +90° (berlawanan jam): (x, y) → (−y, x) Rotasi −90° (searah jam): (x, y) → (y, −x) Rotasi 180°: (x, y) → (−x, −y) · Dilatasi k: (kx, ky)",
        "jebakanTka": "Rotasi 180° (baik searah maupun berlawanan jarum jam) hasilnya sama persis: (x, y) → (−x, −y) (tinggal balik tanda keduanya, tidak perlu ditukar posisinya!).",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 3.13",
          "soal": "Titik sudut segitiga A(2, 1), B(5, 1), C(2, 4) berubah menjadi A'(−1, 2), B'(−1, 5), C'(−4, 2). Transformasi tunggal apa yang terjadi?",
          "opsiString": "A. Translasi (−3, 1) · B. Refleksi Sb-Y · C. Rotasi +90° pusat O · D. Dilatasi k = −1 Cukup uji 1 titik saja! Ambil B(5, 1) → B'(−1, 5). Lihat",
          "jawaban": "C",
          "solusi": "Yuk Bahas · Rotasi Segitiga ABC (PG Resmi) Soal: Titik sudut segitiga A(2, 1), B(5, 1), C(2, 4) berubah menjadi A'(−1, 2), B'(−1, 5), C'(−4, 2). Transformasi tunggal apa yang terjadi? Opsi: A. Translasi (−3, 1) · B. Refleksi Sb-Y · C. Rotasi +90° pusat O · D. Dilatasi k = −1 Cukup uji 1 titik saja! Ambil B(5, 1) → B'(−1, 5). Lihat polanya: (x, y) berubah menjadi (−y, x)! Itu persis rumus Rotasi +90° berlawanan arah jarum jam pusat O! Jawaban: C. Rotasi +90° berlawanan arah jarum jam pusat O"
        },
        "trikCepat": "Trik Cepat · Luas Setelah Dilatasi Segitiga luasnya 12 cm² didilatasi faktor skala k = 3 → luas bayangan = 3² × 12 = 9 × 12 = 108 cm²!",
        "pageNumber": 40,
        "illustrationImg": null,
        "illustrationCaption": "",
        "slideImg": "/modul-assets/pages/mtk_p40.png"
      }
    ],
    "cheatSheet": "Bab 3 · Geometri & Pengukuran — Cheat Sheet 1 Halaman\nRangkuman Rumus Geometri & Pengukuran\nCheat Sheet · Geometri Datar & Lingkaran\nSemua rumus inti Bab 3 dirangkum dalam satu pandangan!\nTopik Rumus & Kunci Cepat\nSudut & Jam Penyiku = 90°, Pelurus = 180°, Segitiga = 180°. Jam:\n|30j − 5,5m|. Garis sejajar: F = sama, Z = sama, U\n= 180°.\nPythagoras c² = a² + b². Triple: (3,4,5) · (5,12,13) · (7,24,25) ·\n(8,15,17).\nKesebangunan Rasio sisi bersesuaian sama. Siku-siku berhimpit:\nAD² = BD×CD.\nSegi Banyak Segitiga ½at · Trapesium ½(a+b)t · Layang/Belah\nketupat ½d₁d₂.\nLingkaran K = πd = 2πr · L = πr² · Busur = (α/360)K ·\nJuring = (α/360)L.\nCheat Sheet · Bangun Ruang & Transformasi\nHafal keluarga rumusnya—tidak usah menghafal terpisah!\nTopik Rumus & Kunci Cepat\nPrisma (Kubus/Balok) V = L.alas × t · Lp = 2L.alas + K.alas × t.\nLimas (Lancip) V = ⅓ × L.alas × t · Lp = L.alas + Σ\nL.segitiga tegak.\nBola V = ⁴⁄₃ πr³ · Lp = 4πr² · ½ Bola Pejal: 3πr².\nTranslasi & Refleksi T(a,b): (x+a, y+b) · Sb-X: (x, −y) · Sb-Y: (−x,\ny).\nRotasi & Dilatasi +90°: (−y, x) · −90°: (y, −x) · 180°: (−x, −y)\n· k: (kx, ky).\nIngat Skala\nSisi dikali k → Keliling × k, Luas × k², Volume × k³. Konversi: 1 L = 1 dm³\n= 1.000 cm³.",
    "cheatSheetImg": "/modul-assets/cheatsheet/cheatsheet_mtk.png",
    "miniTryout": "",
    "tryoutImg": null,
    "petaBelajarImg": null,
    "konsepTeori": [
      {
        "subjudul": "Unit 3.1: Mengenal Sudut & Sudut Jarum Jam",
        "isi": "Bayangkan kalian membuka pintu. Makin lebar pintunya terbuka, makin besar sudutnya. Sudut diukur dengan derajat (°). Satu putaran penuh itu 360°, setengah putaran (garis lurus) 180°, dan seperempat putaran (pojok kotak) 90°. Sudut Jarum Jam (02.30): Jarum jam di tengah angka 2 & 3, jarum menit di angka 6 → selisih 3,5 angka × 30° = 105° Sudut yang lebih dari 180° tapi kurang dari 360° disebut sudut refleks, misalnya sudut di luar bukaan sudut lancip.",
        "poinPenting": [
          "Sudut = seberapa lebar “bukaan” dua garis.",
          "Pondasi · Sudut Jarum Jam Jam itu lingkaran 360° dibagi 12 angka. Jadi jarak 1 angka = 30°. Jarum menit bergerak 6° tiap menit, dan jarum jam juga ikut bergeser sedikit: 0,5° tiap menit!"
        ]
      },
      {
        "subjudul": "Unit 3.2: Berpenyiku, Berpelurus & Bertolak Belakang",
        "isi": "sama besar! Hafal 3 pasangan dasar ini sebelum masuk garis sejajar: (1) Berpenyiku (komplemen) membentuk pojok 90°, (2) Berpelurus (suplemen) membentuk garis lurus 180°, dan (3) Bertolak belakang posisinya saling membelakangi dan sama besar. Berpenyiku = 90° a b a + b = 90° Berpelurus = 180° x y x + y = 180° Bertolak Belakang p p Atas = Bawah",
        "poinPenting": [
          "Dua garis berpotongan membentuk huruf X: yang saling berhadapan selalu",
          "Pondasi · Pelurus vs Penyiku Suatu Sudut Jika sudutnya A, maka Penyiku A = 90° − A dan Pelurus A = 180° − A. Selisih pelurus dan penyiku suatu sudut selalu 90°!"
        ]
      },
      {
        "subjudul": "Unit 3.3: Garis Sejajar Transversal & Segitiga",
        "isi": "Jika dua garis sejajar (L₁ // L₂) dipotong satu garis miring (transversal), sebenarnya cuma muncul 2 besar sudut: sudut lancip dan pelurusnya (180° − lancip). Jumlah 3 sudut dalam segitiga juga selalu 180°! Rahasia Huruf F, Z, U Huruf F (Sehadap) → Sama Besar Huruf Z (Berseberangan) → Sama Besar Huruf U (Dalam Sepihak) → Jumlah 180° Sudut Luar Segitiga a b a+b Luar = jumlah 2 jauh!",
        "poinPenting": [
          "Tidak usah hafal 8 istilah panjang—pakai kode huruf F, Z, dan U!",
          "Pondasi · Segitiga Sama Kaki & Sama Sisi Segitiga Sama Kaki: dua sudut kakinya sama besar. Segitiga Sama Sisi: ketiga sudutnya masing-masing tepat 60°."
        ]
      },
      {
        "subjudul": "Unit 3.4: Teorema Pythagoras & Triple",
        "isi": "tegaknya! Sisi miring (hipotenusa, c) selalu berada di depan sudut 90° dan merupakan sisi terpanjang. Rumus intinya: c² = a² + b². Teorema Pythagoras: Tangga bersandar di tembok membentuk segitiga siku-siku (a² + b² = c², sisi miring = panjang tangga)",
        "poinPenting": [
          "Khusus segitiga siku-siku: kuadrat sisi miring = jumlah kuadrat dua sisi",
          "Pondasi · Segitiga Istimewa 45° & 30°–60° 45°–45°–90°: perbandingan sisi = 1 : 1 : √2 (diagonal persegi = s√2). 30°–60°–90°: perbandingan sisi = 1 : √3 : 2 (depan 30° = setengah sisi miring!)."
        ]
      },
      {
        "subjudul": "Unit 3.5: Kekongruenan & Kesebangunan",
        "isi": "Dua bangun disebut Sebangun (~) jika sudut bersesuaian sama besar dan rasio sisi bersesuaian sama. Jika bentuk dan ukurannya 100% sama, namanya Kongruen ( ≅ ). Kesebangunan Segitiga: Perbandingan tinggi tiang bendera dan bayangannya sama dengan tinggi siswa dan bayangannya",
        "poinPenting": [
          "Kongruen = kembar identik; Sebangun = foto yang di-zoom tanpa gepeng!",
          "Pondasi · Rumus Air Mancur (Sering Keluar!) Pada segitiga siku-siku ABC (siku-siku di A) dengan garis tinggi AD ke sisi miring BC: AD² = BD × CD · AB² = BD × BC · AC² = CD × BC."
        ]
      },
      {
        "subjudul": "Unit 3.6: Keliling & Luas Segi Banyak",
        "isi": "lantai! Pada bangun datar gabungan (seperti dinding samping rumah berbentuk persegi panjang + segitiga atap), pecah dulu jadi bangun dasar yang mudah dihitung luasnya. Ingat: untuk Keliling, hanya jumlahkan sisi tepi paling luar! Segitiga L = ½ × a × t Jajargenjang L = a × t Trapesium L = ½(a + b) × t Belah Ketupat & Layang-Layang L = ½ × d₁ × d₂ Persegi & Persegi Panjang L = s² & L = p × l",
        "poinPenting": [
          "Keliling = jalan mengitari pagar luar; Luas = seluruh ubin yang menutupi",
          "Pondasi · Strategi Soal Cat Dinding / Keramik Hitung Luas Total Dinding dulu → bagi dengan daya sebar 1 kg cat (dibulatkan ke atas karena toko tidak jual cat eceran koma!) → pilih kombinasi kemasan agar sisa cat paling sedikit."
        ]
      },
      {
        "subjudul": "Unit 3.7: Lingkaran: Unsur, Keliling & Luas",
        "isi": "Lingkaran adalah kumpulan titik yang berjarak sama (jari-jari r) dari titik pusat O. Panjang diameter (d) = 2 × r. Nilai π = 22/7 (jika r/d kelipatan 7) atau 3,14 (selain kelipatan 7). Unsur Lingkaran pada Bianglala: Poros = titik pusat, jeruji = jari-jari (r), garis tengah = diameter (d = 2r), tepi = keliling",
        "poinPenting": [
          "Kenali 6 unsur lingkaran dari gambarnya, lalu kuasai K = πd dan L = πr²!",
          "Pondasi · Roda Berputar & Lintasan Sekali roda berputar penuh, jarak yang ditempuh = 1 Keliling Lingkaran. Jadi: Jarak Tempuh = Keliling × Banyak Putaran!"
        ]
      },
      {
        "subjudul": "Unit 3.8: Lingkaran: Busur, Juring & Gabungan",
        "isi": "utuh! Untuk menghitung Panjang Busur atau Luas Juring bersudut pusat α°, tinggal kalikan pecahannya (α° / 360°) dengan Keliling atau Luas lingkaran penuh! Contoh: sudut 90° = ¼ lingkaran, sudut 60° = ⅙  lingkaran. Busur & Juring (α / 360°) 60° Busur = (α/360) × K Juring = (α/360) × L Luas Gabungan Taman & Kolam d=7m 20 m × 16 m (Rumput = Taman − Kolam)",
        "poinPenting": [
          "Panjang busur dan luas juring itu cuma “sebagian potong” dari 360° lingkaran",
          "Pondasi · Sudut Pusat vs Sudut Keliling Jika menghadap busur yang sama: Sudut Pusat = 2 × Sudut Keliling. Khusus sudut keliling yang menghadap diameter, besarnya selalu 90° (siku- siku)!"
        ]
      },
      {
        "subjudul": "Unit 3.9: Jaring-Jaring Bangun Ruang",
        "isi": "saat dilipat! CP resmi TKA SMP secara khusus menguji jaring-jaring 4 bangun ruang: Prisma, Tabung, Limas, dan Kerucut. Soal TKA sering memadukannya dengan tata letak pemotongan kertas karton! 1. Prisma Segitiga 2. Tabung (Selimut + 2 Lingkaran) 3. Limas Segiempat (Bintang) 4. Kerucut (Juring + 1 Lingkaran)",
        "poinPenting": [
          "Bayangkan kardus kemasan dibuka rata—tutup & alas tidak boleh bertumpuk",
          "Pondasi · Ciri Jaring-Jaring Valid Prisma segi-n: punya 2 alas sama (berseberangan sisi) + n persegi panjang tegak. Limas segi-n: punya 1 alas + n segitiga yang menempel di setiap sisi alas."
        ]
      },
      {
        "subjudul": "Unit 3.10: Bangun Ruang: Kubus, Balok & Prisma",
        "isi": "Tinggi! Kubus, balok, dan prisma segitiga/segienam semuanya masuk keluarga Prisma (punya alas dan tutup sejajar & kongruen). Jadi cukup hafal 1 rumus sakti: Volume = Luas Alas × Tinggi! Bangun Ruang Balok (Akuarium): Volume air = p × l × t; luas kaca tanpa tutup = pl + 2pt + 2lt",
        "poinPenting": [
          "Keluarga Prisma itu alas & tutupnya kembar: Volume selalu Luas Alas ×",
          "Pondasi · Luas Permukaan Tanpa Tutup Di soal kolam renang atau akuarium tanpa tutup, jangan pakai 2(pl + pt + lt)—cukup pl + 2pt + 2lt (alasnya cuma dihitung 1 kali!)."
        ]
      },
      {
        "subjudul": "Unit 3.11: Bangun Ruang: Limas & Bola",
        "isi": "Sesuai matriks resmi Pusmendik TKA SMP 2027, tiga volume bangun ruang yang diujikan adalah Prisma, Limas, dan Bola (catatan: volume tabung & kerucut tidak tercantum di matriks volume resmi, hanya jaring-jaringnya). Limas (Puncak Lancip) t V = ⅓ × L.alas × t Bola (Jari-Jari r) r V = ⁴⁄₃ πr³ · Lp = 4πr²",
        "poinPenting": [
          "Puncak lancip selalu pakai ⅓; bola selalu pakai ⁴⁄₃ πr³!",
          "Pondasi · Setengah Bola & Kubah Volume ½ Bola = ⅔ πr³. Untuk Luas Permukaan ½ Bola Padat (Pejal) = 3πr² (2πr² lengkung + 1πr² alas lingkaran); kalau berongga/kubah cukup 2πr²!"
        ]
      },
      {
        "subjudul": "Unit 3.12: Transformasi: Translasi & Refleksi",
        "isi": "Translasi T(a, b) menggeser titik: a positif ke kanan (negatif ke kiri), b positif ke atas (negatif ke bawah). Refleksi membalik posisi benda terhadap garis cermin tanpa mengubah ukuran! 1. Translasi T(4, −2) P(−1, 4) P'(3, 2) (x, y) → (x + a, y + b) 2. Refleksi Sumbu-Y Sb-Y: x berubah tanda → (−x, y)",
        "poinPenting": [
          "Translasi itu menggeser lurus; Refleksi itu bercermin dengan jarak sama!",
          "Pondasi · 5 Rumus Cermin Wajib Tahu Sumbu-X: (x, −y)  |  Sumbu-Y: (−x, y) Garis y = x: (y, x)  |  Garis y = −x: (−y, −x) Garis x = h: (2h − x, y)  |  Garis y = k: (x, 2k − y)"
        ]
      },
      {
        "subjudul": "Unit 3.13: Transformasi: Rotasi & Dilatasi",
        "isi": "skala k! Pada Rotasi, sudut positif (+) berarti berputar berlawanan arah jarum jam (CCW), sedangkan negatif (−) searah jarum jam (CW). Pada Dilatasi pusat O skala k, cukup kalikan kedua koordinat dengan k! 3. Rotasi +90° (Berlawanan Jam) (x, y) (−y, x) +90° CCW = −270° CW 4. Dilatasi Skala k (Zoom) ×k → (x, y) → (kx, ky) · Luas jadi k²×",
        "poinPenting": [
          "Rotasi itu memutar terhadap titik pusat O; Dilatasi itu zoom in / zoom out",
          "Pondasi · Tabel Rotasi & Dilatasi Pusat O(0, 0) Rotasi +90° (berlawanan jam): (x, y) → (−y, x) Rotasi −90° (searah jam): (x, y) → (y, −x) Rotasi 180°: (x, y) → (−x, −y) · Dilatasi k: (kx, ky)"
        ]
      }
    ],
    "trikCepat": "Trik Cepat · Rumus Sudut Jam |30 × jam − 5,5 × menit|. Pukul 02.30: |30(2) − 5,5(30)| = |60 − 165| = 105°. Jika > 180°, kurangkan dari 360°!",
    "jebakanUmum": "Sudut 90° itu siku-siku, bukan lancip dan bukan tumpul. Lancip harus kurang dari 90°, tumpul harus lebih dari 90°.",
    "contohSoal": [
      {
        "soal": "Berapa sudut terkecil antara jarum jam dan jarum menit pada pukul 02.30? 12 3 6 9 Pukul 02.30: 1 angka = 30°. Menit di angka 6. Jam di tengah 2 & 3 (2,5). Jarak = 3,5 × 30° = 105° Banyak yang menjawab jarum jam di angka 2. Salah! Pukul 02.30 itu sudah setengah jalan ke jam 3 (di 2,5). Jarak dari 2,5 ke 6 = 3,5 angka → 3,5 × 30° = 105°! Jawaban: 105°",
        "opsi": {
          "A": "Opsi A",
          "B": "Opsi B",
          "C": "Opsi C",
          "D": "Opsi D"
        },
        "kunci": "C",
        "pembahasanLangkah": [
          "Yuk Bahas · Sudut Jarum Jam Soal: Berapa sudut terkecil antara jarum jam dan jarum menit pada pukul 02.30? 12 3 6 9 Pukul 02.30: 1 angka = 30°. Menit di angka 6. Jam di tengah 2 & 3 (2,5). Jarak = 3,5 × 30° = 105° Banyak yang menjawab jarum jam di angka 2. Salah! Pukul 02.30 itu sudah setengah jalan ke jam 3 (di 2,5). Jarak dari 2,5 ke 6 = 3,5 angka → 3,5 × 30° = 105°! Jawaban: 105°"
        ]
      },
      {
        "soal": "Dua sudut saling berpelurus dengan besar (3x + 15)° dan (2x + 10) °. Berapa besar sudut yang lebih kecil?",
        "opsi": {
          "A": "Opsi A",
          "B": "Opsi B",
          "C": "Opsi C",
          "D": "Opsi D"
        },
        "kunci": "B",
        "pembahasanLangkah": [
          "Yuk Bahas · Sudut Berpelurus Pakai x (PG) Soal: Dua sudut saling berpelurus dengan besar (3x + 15)° dan (2x + 10) °. Berapa besar sudut yang lebih kecil? Opsi: A. 31° · B. 72° · C. 108° · D. 118° Karena berpelurus, jumlahnya 180°! Tulis: (3x + 15) + (2x + 10) = 180 → 5x + 25 = 180 → 5x = 155 → x = 31°. Awas! Opsi A (31°) itu baru nilai x! Sudut yang kecil = 2(31) + 10 = 72°! Jawaban: B. 72°"
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "mtk_smp_b3_q1",
        "soal": "Soal 1 · Unit 3.1 (Sudut Jarum Jam) Besar sudut terkecil yang dibentuk jarum jam dan jarum menit pada pukul 04.30 adalah … A. 30°  ·  B. 45°  ·  C. 60°  ·  D. 75°",
        "opsi": {
          "A": "30°",
          "B": "45°",
          "C": "60°",
          "D": "75°"
        },
        "kunci": "B",
        "pembahasan": "|30(4) − 5,5(30)| = |120 − 165| = 45°."
      },
      {
        "id": "mtk_smp_b3_q2",
        "soal": "Soal 2 · Unit 3.7 (Lingkaran) Sebuah taman berbentuk lingkaran berjari-jari 14 m. Di sekeliling taman dipasang tiang lampu tiap jarak 4 m. Banyak tiang lampu yang diperlukan adalah … (π = 22/7) A. 18 tiang  ·  B. 20 tiang  ·  C. 22 tiang  ·  D. 24 tiang Latihan Bab 3 · Level 2 (PGK MCMA) Pilih semua pernyataan yang benar!",
        "opsi": {
          "A": "18 tiang",
          "B": "20 tiang",
          "C": "22 tiang",
          "D": "Pernyataan / Opsi (4) Benar"
        },
        "kunci": "C",
        "pembahasan": "K = (22/7) × 28 = 88 m → 88 ÷ 4 = 22 tiang."
      },
      {
        "id": "mtk_smp_b3_q3",
        "soal": "Soal 3 · Unit 3.4 (Pythagoras) Tangga sepanjang 5 m disandarkan ke tembok tegak dengan kaki tangga berjarak 3 m dari tembok. Pilih semua pernyataan benar! (1) Ujung atas tangga berada 4 m dari tanah. (2) Jika kaki digeser jadi 4 m, ujung atas jadi 3 m dari tanah. (3) Semakin jauh kaki tangga dari tembok, ujung atas semakin tinggi.",
        "opsi": {
          "A": "Pernyataan / Opsi (1) Benar",
          "B": "Pernyataan / Opsi (2) Benar",
          "C": "Pernyataan / Opsi (3) Benar",
          "D": "Pernyataan / Opsi (4) Benar"
        },
        "kunci": "A",
        "pembahasan": "Triple 3–4–5. Makin jauh kaki, ujung atas justru"
      },
      {
        "id": "mtk_smp_b3_q4",
        "soal": "Soal 4 · Unit 3.12 & 3.13 (Transformasi) Diketahui titik M(4, −3). Pilih semua bayangan yang benar! (1) Translasi T(−2, 5) menghasilkan (2, 2). (2) Refleksi terhadap Sumbu-X menghasilkan (4, 3). (3) Rotasi 180° pusat O menghasilkan (−4, 3). (4) Dilatasi pusat O skala 2 menghasilkan (8, 6). Bab 3 · Geometri & Pengukuran — Latihan Soal TKA SMP 2027 Latihan Bab 3 · Level 3 & Kunci Pembahasan Latihan Bab 3 · Level 3 (Penalaran) Tentukan Benar atau Salah untuk setiap pernyataan!",
        "opsi": {
          "A": "Pernyataan / Opsi (1) Benar",
          "B": "Pernyataan / Opsi (2) Benar",
          "C": "Pernyataan / Opsi (3) Benar",
          "D": "Pernyataan / Opsi (4) Benar"
        },
        "kunci": "A",
        "pembahasan": "Dilatasi skala 2 dari (4, −3) adalah (8, −6),"
      },
      {
        "id": "mtk_smp_b3_q5",
        "soal": "Soal 5 · Unit 3.10 (PGK Kategori — Bangun Ruang) Kontraktor menyusun monumen balok 120 cm × 60 cm × 40 cm dari bata ringan 60 cm × 20 cm × 10 cm tanpa celah. Tentukan Benar/Salah: A. Volume 1 bata ringan adalah 12.000 cm³. B. Dibutuhkan minimal 24 bata ringan. C. Jika tinggi monumen digandakan, jumlah bata tetap 24 buah.",
        "opsi": {
          "A": "Volume 1 bata ringan adalah 12.000 cm³.",
          "C": "Jika tinggi monumen digandakan, jumlah bata tetap 24 buah.",
          "B": "Pernyataan / Opsi (2) Benar",
          "D": "Pernyataan / Opsi (4) Benar"
        },
        "kunci": "A",
        "pembahasan": "Banyak bata ="
      },
      {
        "id": "mtk_smp_b3_q6",
        "soal": "Soal 6 · Unit 3.8 (PGK Kategori — Juring Lingkaran) Sebuah pizza bundar berjari-jari 14 cm dipotong menjadi 8 juring sama besar (π = 22/7). Tentukan Benar/Salah: A. Sudut pusat tiap potongan pizza adalah 45°. B. Luas 1 potongan pizza adalah 77 cm². C. Panjang busur pinggiran 1 potongan pizza adalah 22 cm.",
        "opsi": {
          "A": "Sudut pusat tiap potongan pizza adalah 45°.",
          "B": "Luas 1 potongan pizza adalah 77 cm².",
          "C": "Panjang busur pinggiran 1 potongan pizza adalah 22 cm.",
          "D": "Pernyataan / Opsi (4) Benar"
        },
        "kunci": "A",
        "pembahasan": "360°÷8 = 45°. L = 616÷8 ="
      }
    ]
  },
  {
    "id": "mtk_smp_bab_4",
    "subtestKode": "MTK_SMP",
    "subtestNama": "Matematika (Numerasi TKA)",
    "subtestSingkatan": "MTK",
    "subtestEmoji": "📐",
    "subtestWarna": "#ea580c",
    "subtestBgLight": "#fff7ed",
    "babNumber": 4,
    "slug": "data-peluang-statistika-diagram-peluang",
    "judul": "Bab 4 · Data & Peluang (Statistika, Diagram & Peluang Teoretik)",
    "durasiBacaMenit": 14,
    "ringkasanSingkat": "Penyajian data tabel & diagram batang/lingkaran, ukuran pemusatan (mean, median, modus), jangkauan, dan kalkulasi peluang frekuensi harapan.",
    "learningObjectives": [
      "Membaca dan menafsirkan diagram lingkaran bersudut maupun berpersen secara akurat.",
      "Menghitung mean gabungan, median data ganjil/genap, dan modus data kelompok.",
      "Menghitung peluang kejadian tunggal dan frekuensi harapan dalam sejumlah percobaan acak."
    ],
    "pdfUrl": "/modul-pdf/Modul_Master_TKA_SMP_Matematika_2027.pdf",
    "pdfFilename": "Modul_Master_TKA_SMP_Matematika_2027.pdf",
    "pdfTotalHalaman": 52,
    "isUtama": true,
    "units": [
      {
        "unitNumber": "4.1",
        "judul": "Penyajian Data (Tabel, Batang & Garis)",
        "hook": "Baca judul dan satuan sumbu Y dulu sebelum melihat angka grafiknya!",
        "teori": "Langkah pertama statistika adalah merumuskan pertanyaan untuk mengumpulkan data, lalu menyajikannya agar mudah dibaca: Diagram Batang cocok membandingkan antar kategori, sedangkan Diagram Garis cocok melihat tren naik–turun dari waktu ke waktu. Diagram Garis Penjualan Buku (Unit) — Jan s.d. Mei 20 Jan 28 Feb 50 Mar 40 Apr 56 Mei",
        "pondasi": "Pondasi · Membaca Persen Kenaikan % Kenaikan = (Nilai Baru − Nilai Lama) ÷ Nilai Lama × 100%. Selalu bagi dengan nilai awal (lama)!",
        "jebakanTka": "Bedakan “penjualan tertinggi” (Mei = 56) dengan “kenaikan tertinggi” (Feb→Mar naik +22, lebih curam daripada Apr→Mei yang naik +16)!",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 4.1",
          "soal": "Berdasarkan diagram garis di kiri, tentukan Benar atau Salah untuk setiap pernyataan berikut! A. Kenaikan penjualan terbesar terjadi pada Februari ke Maret. B. Penjualan bulan April mengalami penurunan sebesar 20% dari Maret. C. Rata-rata penjualan selama 5 bulan lebih dari 40 buku. Cek A: Feb→Mar naik 50 − 28 = +22 (terbesar → Benar). Cek B: turun 50 − 40 = 10 dari 50 → (10/50) × 100% = 20% (Benar). Cek C: total = 20+28+50+40+56 = 194 → rata-rata = 194 ÷ 5 = 38,8 (kurang dari 40 → Salah). Jawaban: A. Benar · B. Benar · C. Salah",
          "opsiString": "",
          "jawaban": "A",
          "solusi": "Yuk Bahas · Tren Penjualan Buku (PGK Kategori) Soal: Berdasarkan diagram garis di kiri, tentukan Benar atau Salah untuk setiap pernyataan berikut! A. Kenaikan penjualan terbesar terjadi pada Februari ke Maret. B. Penjualan bulan April mengalami penurunan sebesar 20% dari Maret. C. Rata-rata penjualan selama 5 bulan lebih dari 40 buku. Cek A: Feb→Mar naik 50 − 28 = +22 (terbesar → Benar). Cek B: turun 50 − 40 = 10 dari 50 → (10/50) × 100% = 20% (Benar). Cek C: total = 20+28+50+40+56 = 194 → rata-rata = 194 ÷ 5 = 38,8 (kurang dari 40 → Salah). Jawaban: A. Benar · B. Benar · C. Salah"
        },
        "trikCepat": "Trik Cepat · Cek Rata-Rata Tanpa Membagi Mau cek apakah rata-rata 5 bulan > 40? Langsung kalikan 5 × 40 = 200. Karena totalnya 194 < 200, rata-ratanya pasti < 40!",
        "pageNumber": 44,
        "illustrationImg": null,
        "illustrationCaption": "",
        "slideImg": "/modul-assets/pages/mtk_p44.png"
      },
      {
        "unitNumber": "4.2",
        "judul": "Diagram Lingkaran (Persen & Derajat)",
        "hook": "Satu lingkaran penuh selalu 100% atau 360°—tinggal pakai perbandingan",
        "teori": "bagian! Diagram Lingkaran menampilkan proporsi tiap kategori terhadap keseluruhan. Perhatikan tandanya: jika memakai persen (%) totalnya 100%; jika memakai derajat (°) totalnya 360°. Tanda kotak siku-siku selalu berarti 90° = 25% = ¼ bagian! 90° 120° 150° Ekskul 120 Siswa SMP (Derajat): • Biru (Futsal): 90° (siku-siku) = ¼ × 120 = 30 siswa • Ungu (Basket): 120° = ⅓ × 120 = 40 siswa • Pink (Musik): 360° − 210° = 150° = 50 siswa",
        "pondasi": "Pondasi · Rumus Universal Diagram Lingkaran Banyak Ditanya = (Sudut atau % Ditanya ÷ Sudut atau % Diketahui) × Jumlah Diketahui. Berlaku untuk mencari total, satu bagian, maupun selisih dua bagian!",
        "jebakanTka": "Kalau salah satu bagian tidak ditulis angkanya tapi ada tanda siku-siku, langsung tahu itu 90° (atau 25%)! Jangan dikira soalnya kurang data!",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 4.2",
          "soal": "Pada diagram lingkaran ekskul di kiri, diketahui siswa yang ikut Basket (120°) adalah 40 anak. Berapa selisih siswa Musik (150°) dan Futsal (90°)?",
          "opsiString": "A. 10 anak · B. 15 anak · C. 20 anak · D. 25 anak Tidak perlu hitung total seluruh siswa dulu! Langsung pakai selisih",
          "jawaban": "C",
          "solusi": "Yuk Bahas · Hobi Siswa (PG Aplikasi) Soal: Pada diagram lingkaran ekskul di kiri, diketahui siswa yang ikut Basket (120°) adalah 40 anak. Berapa selisih siswa Musik (150°) dan Futsal (90°)? Opsi: A. 10 anak · B. 15 anak · C. 20 anak · D. 25 anak Tidak perlu hitung total seluruh siswa dulu! Langsung pakai selisih sudutnya: Musik − Futsal = 150° − 90° = 60°. Bandingkan dengan Basket (120° = 40 anak): karena 60° itu tepat setengahnya 120°, maka selisihnya = ½ × 40 = 20 anak! Jawaban: C. 20 anak"
        },
        "trikCepat": "Trik Cepat · Konversi Derajat ↔ Persen Ingat: 36° = 10%, 72° = 20%, 90° = 25%, 108° = 30%, 180° = 50%!",
        "pageNumber": 45,
        "illustrationImg": null,
        "illustrationCaption": "",
        "slideImg": "/modul-assets/pages/mtk_p45.png"
      },
      {
        "unitNumber": "4.3",
        "judul": "Mean, Median & Modus",
        "hook": "Tiga pusat data: Mean (rata-rata), Median (nilai tengah terurut), Modus",
        "teori": "(paling sering)! Jika data berbentuk tabel frekuensi, hitung Mean dengan Σ(nilai × frekuensi) ÷ Σfrekuensi. Untuk Median, wajib urutkan data dari terkecil ke terbesar dulu—kalau banyak data ganjil ambil tepat di tengah; kalau genap rata-ratakan dua angka tengah! Contoh Data Terurut: 5, 6, 7, 7, 7, 8, 9 (n = 7) 5 6 7 7 7 8 9 Median = data ke-4 (7) · Modus = 7 (muncul 3×) Mean = (5+6+7+7+7+8+9) ÷ 7 = 49 ÷ 7 = 7",
        "pondasi": "Pondasi · Rata-Rata Gabungan (Siswa Susulan) Total Nilai = Mean × Banyak Siswa. Jika ada 1 siswa susulan masuk, cukup hitung: Nilai Susulan = Total Baru − Total Lama!",
        "jebakanTka": "Saat mencari Median dari tabel frekuensi, jangan ambil angka tengah kolom Nilai—hitung dulu total frekuensi (n) lalu cari posisi data ke-(n+1)/2 pakai frekuensi kumulatif!",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 4.3",
          "soal": "Rata-rata nilai matematika 19 siswa adalah 78. Setelah Budi ikut ulangan susulan, rata-rata kelas naik menjadi 79. Berapa nilai Budi?",
          "opsiString": "A. 88 · B. 92 · C. 98 · D. 99 Cara",
          "jawaban": "C",
          "solusi": "Yuk Bahas · Nilai Ulangan Susulan (PG Aplikasi) Soal: Rata-rata nilai matematika 19 siswa adalah 78. Setelah Budi ikut ulangan susulan, rata-rata kelas naik menjadi 79. Berapa nilai Budi? Opsi: A. 88 · B. 92 · C. 98 · D. 99 Cara konsep: Total lama = 19 × 78 = 1.482. Total baru (20 siswa) = 20 × 79 = 1.580. Nilai Budi = 1.580 − 1.482 = 98! Atau pakai Trik Cepat di bawah: cuma 3 detik! Jawaban: C. 98"
        },
        "trikCepat": "Trik Cepat · Nilai Susulan 3 Detik! Budi harus bawa nilai 79 (rata-rata baru) PLUS menyumbang +1 ke masing- masing 19 temannya → 79 + 19(1) = 98!",
        "pageNumber": 46,
        "illustrationImg": null,
        "illustrationCaption": "",
        "slideImg": "/modul-assets/pages/mtk_p46.png"
      },
      {
        "unitNumber": "4.4",
        "judul": "Jangkauan & Bandingkan 2 Kelompok Data",
        "hook": "Mean sama belum tentu kualitas kelas sama—cek Jangkauannya untuk",
        "teori": "melihat keragaman! Kompetensi wajib CP TKA SMP: membandingkan ukuran pemusatan (Mean/Median) dan penyebaran (Jangkauan) dari dua kelompok data! Jangkauan (Range) = Nilai Terbesar − Nilai Terkecil. Bandingkan Kelas A vs Kelas B (Mean Sama = 80) Kelas A 75–85 (Range = 10) Kelas B Range Kelas A kecil (10) → lebih MERATA & KONSISTEN daripada Kelas B (50)!",
        "pondasi": "Pondasi · Pengaruh Nilai Ekstrem (Pencilan) Jika ada 1 nilai sangat tinggi atau sangat rendah (misal 100 atau 20), Mean dan Jangkauan langsung terpengaruh, sedangkan Median tetap stabil!",
        "jebakanTka": "Jangkauan kecil itu hal positif jika kita mencari tim yang stabil/konsisten! Jangan mengira jangkauan besar selalu lebih bagus.",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 4.4",
          "soal": "Waktu lari 5 latihan (detik): Andi (12, 13, 13, 14, 13) dan Bima (10, 12, 13, 14, 16). Tentukan Benar atau Salah! A. Rata-rata waktu lari Andi dan Bima sama, yaitu 13 detik. B. Jangkauan waktu Andi adalah 2 detik, sedangkan Bima 6 detik. C. Catatan waktu lari Bima lebih konsisten daripada Andi. Cek A: total Andi = 65 → mean 13; total Bima = 65 → mean 13 (Benar). Cek B: Range Andi = 14−12 = 2, Bima = 16−10 = 6 (Benar). Cek C: karena Range Andi jauh lebih kecil, Andi lebih konsisten (Salah). Jawaban: A. Benar · B. Benar · C. Salah",
          "opsiString": "",
          "jawaban": "A",
          "solusi": "Yuk Bahas · Pilih Pelari Terstabil (PGK Kategori) Soal: Waktu lari 5 latihan (detik): Andi (12, 13, 13, 14, 13) dan Bima (10, 12, 13, 14, 16). Tentukan Benar atau Salah! A. Rata-rata waktu lari Andi dan Bima sama, yaitu 13 detik. B. Jangkauan waktu Andi adalah 2 detik, sedangkan Bima 6 detik. C. Catatan waktu lari Bima lebih konsisten daripada Andi. Cek A: total Andi = 65 → mean 13; total Bima = 65 → mean 13 (Benar). Cek B: Range Andi = 14−12 = 2, Bima = 16−10 = 6 (Benar). Cek C: karena Range Andi jauh lebih kecil, Andi lebih konsisten (Salah). Jawaban: A. Benar · B. Benar · C. Salah"
        },
        "trikCepat": "Trik Cepat · Cek Perubahan Data Jika semua data ditambah 5, maka Mean/Median/Modus ikut +5, tapi Jangkauan TETAP (tidak berubah)!",
        "pageNumber": 47,
        "illustrationImg": null,
        "illustrationCaption": "",
        "slideImg": "/modul-assets/pages/mtk_p47.png"
      },
      {
        "unitNumber": "4.5",
        "judul": "Peluang Kejadian Tunggal & Ruang Sampel",
        "hook": "Peluang = banyak hasil yang diharapkan dibagi total semua kemungkinan (0",
        "teori": "s.d. 1)! Rumus dasar Peluang Teoretis: P(A) = n(A) / n(S). Kenali ruang sampel standar: 1 koin (n(S) = 2), 1 dadu (n(S) = 6), 2 koin (n(S) = 4), dan kantong bola (total semua bola). Ruang Sampel Dadu: 1 dadu memiliki 6 kemungkinan mata dadu S = {1, 2, 3, 4, 5, 6}, sehingga n(S) = 6",
        "pondasi": "Pondasi · Peluang Komplemen (“Bukan A”) P(Bukan A) = 1 − P(A). Misalnya peluang hujan = 0,35, maka peluang tidak hujan = 1 − 0,35 = 0,65!",
        "jebakanTka": "Nilai peluang selalu antara 0 sampai 1 (0 ≤ P ≤ 1). Jika P = 0 mustahil terjadi, P = 1 pasti terjadi!",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 4.5",
          "soal": "Kantong berisi 4 merah, 3 biru, 5 kuning. Diambil 1 bola secara acak. Tentukan Benar/Salah! A. Peluang terambil bola merah adalah ⅓. B. Peluang terambil bola bukan biru adalah ¾. C. Peluang terambil bola hijau adalah 1/12. Total n(S) = 12. Cek A: 4/12 = ⅓ (Benar). Cek B: 1 − 3/12 = 9/12 = ¾ (Benar). Cek C: tidak ada bola hijau di kantong, jadi P(hijau) = 0 (Salah). Jawaban: A. Benar · B. Benar · C. Salah",
          "opsiString": "",
          "jawaban": "A",
          "solusi": "Yuk Bahas · Kantong Bola Warna (PGK Kategori) Soal: Kantong berisi 4 merah, 3 biru, 5 kuning. Diambil 1 bola secara acak. Tentukan Benar/Salah! A. Peluang terambil bola merah adalah ⅓. B. Peluang terambil bola bukan biru adalah ¾. C. Peluang terambil bola hijau adalah 1/12. Total n(S) = 12. Cek A: 4/12 = ⅓ (Benar). Cek B: 1 − 3/12 = 9/12 = ¾ (Benar). Cek C: tidak ada bola hijau di kantong, jadi P(hijau) = 0 (Salah). Jawaban: A. Benar · B. Benar · C. Salah"
        },
        "trikCepat": "Trik Cepat · Sederhanakan Pecahan! Di opsi PG, peluang selalu ditulis dalam bentuk pecahan paling sederhana (misal 4/12 → ⅓) atau desimal/persen!",
        "pageNumber": 48,
        "illustrationImg": "/modul-assets/illustrations/mtk_p48.jpeg",
        "illustrationCaption": "",
        "slideImg": "/modul-assets/pages/mtk_p48.png"
      },
      {
        "unitNumber": "4.6",
        "judul": "Frekuensi Relatif & Frekuensi Harapan",
        "hook": "Frekuensi relatif itu dari percobaan nyata; frekuensi harapan itu prediksi dari",
        "teori": "peluang! Frekuensi Relatif (Peluang Empiris) didapat dari hasil percobaan sesungguhnya: fᵣ = banyak muncul ÷ total percobaan. Sedangkan Frekuensi Harapan adalah perkiraan berapa kali kejadian muncul dalam N kali percobaan: Fₕ = P(A) × N. Frekuensi Relatif (Nyata) fᵣ = f(A) ÷ N Lempar koin 50×, angka muncul 27× fᵣ = 27/50 = 0,54 Frekuensi Harapan (Prediksi) Fₕ = P(A) × N Dadu dilempar 120×, muncul prima Fₕ = ½ × 120 = 60 kali",
        "pondasi": "Pondasi · Hukum Bilangan Besar Semakin banyak percobaan dilakukan (misal 1.000× lempar dadu dibanding 10×), nilai Frekuensi Relatif akan semakin mendekati Peluang Teoretis!",
        "jebakanTka": "Jangan tertukar Frekuensi Relatif (hasilnya pecahan/desimal 0–1) dengan Frekuensi Harapan (hasilnya jumlah kali muncul, misal 25 kali)!",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 4.6",
          "soal": "Sebuah roda putar memiliki 4 warna. Dalam 80 kali putaran, panah berhenti di Merah 24 kali, Biru 16 kali, Hijau 20 kali, dan Kuning 20 kali. Berapa frekuensi relatif munculnya warna Merah?",
          "opsiString": "A. 0,20 · B. 0,25 · C. 0,30 · D. 0,35 Langsung bagi munculnya Merah dengan total",
          "jawaban": "C",
          "solusi": "Yuk Bahas · Percobaan Roda Putar (PG Aplikasi) Soal: Sebuah roda putar memiliki 4 warna. Dalam 80 kali putaran, panah berhenti di Merah 24 kali, Biru 16 kali, Hijau 20 kali, dan Kuning 20 kali. Berapa frekuensi relatif munculnya warna Merah? Opsi: A. 0,20 · B. 0,25 · C. 0,30 · D. 0,35 Langsung bagi munculnya Merah dengan total putaran: fᵣ = 24 ÷ 80. Sederhanakan (bagi 8 atas & bawah) → 3/10 = 0,30! Jawaban: C. 0,30"
        },
        "trikCepat": "Trik Cepat · Cek Total Frekuensi Relatif Jumlah seluruh frekuensi relatif semua kejadian dalam satu percobaan selalu tepat = 1 (0,30 + 0,20 + 0,25 + 0,25 = 1,00)!",
        "pageNumber": 49,
        "illustrationImg": null,
        "illustrationCaption": "",
        "slideImg": "/modul-assets/pages/mtk_p49.png"
      }
    ],
    "cheatSheet": "",
    "cheatSheetImg": null,
    "miniTryout": "Simulasi Mini Tryout · Matematika TKA SMP 2027\nSimulasi Mini Tryout Campuran 4 Bab (15 Menit)\nSimulasi Mini Tryout · Nomor 1–3\nPasang timer 15 menit (2,5 menit/soal), kerjakan tanpa buka halaman 52!\nNomor 1 & 2 · Pilihan Ganda (PG)\n [Bab 1 · Diskon Ganda] Sepatu berlabel Rp400.000 mendapat diskon\n20% + 10%. Harga yang harus dibayar adalah … (A. Rp280.000 · B.\nRp288.000 · C. Rp300.000 · D. Rp320.000)\n [Bab 2 · SPLDV] Harga 3 buku & 2 pena Rp34.000. Harga 1 buku & 2 pena\nRp18.000. Harga 1 buku adalah … (A. Rp6.000 · B. Rp8.000 · C. Rp10.000 ·\nD. Rp12.000)\nNomor 3 · PGK MCMA (Lebih dari 1 Benar)\n [Bab 3 · Lingkaran] Kolam lingkaran berdiameter 14 m (π = 22/7). Pilih\nsemua pernyataan benar: (1) Jari-jarinya 7 m · (2) Kelilingnya 44 m · (3)\nLuasnya 154 m² · (4) Luasnya 616 m².\nSimulasi Mini Tryout · Nomor 4–6\nCampuran Bangun Ruang, Transformasi, dan Statistika–Peluang!\nNomor 4 · PGK MCMA (Lebih dari 1 Benar)\n [Bab 3 · Bangun Ruang] Limas persegi alas 6 cm × 6 cm dan tinggi 10\ncm. Pilih pernyataan benar: (1) Luas alas 36 cm² · (2) Volume = 120 cm³ ·\n(3) Volume = 360 cm³ · (4) Memiliki 5 titik sudut.\nNomor 5 & 6 · PGK Kategori (Benar/Salah)\n [Bab 3 · Transformasi] Titik K(2, −5): (A) Translasi T(3, 5) → (5, 0) · (B)\nRefleksi Sb-Y → (−2, −5) · (C) Rotasi 180° → (2, 5).\n [Bab 4 · Data & Peluang] Kantong berisi 3 merah & 7 putih (diambil 1\nbola): (A) P(merah) = 0,3 · (B) P(bukan merah) = 0,7 · (C) Dalam 50 kali\npengambilan (dikembalikan), Fₕ merah = 20 kali.\n\nMatematika TKA SMP 2027\nKunci Tryout & Peta Belajar 2027 — Bimbel Gemilang\nKunci Simulasi Mini Tryout (Hal 51)\nHitung skormu—kalau benar 5–6 nomor, kamu sudah siap tempur!\nKunci & Pembahasan Kilat\nNo 1 → B (Rp288.000): Bayar = 0,8 × 0,9 × 400.000 = 0,72 ×\n400.000 = Rp288.000.\nNo 2 → B (Rp8.000): Kurangkan langsung: 2 buku = 34rb − 18rb =\n16rb → 1 buku = Rp8.000.\nNo 3 → (1), (2), dan (3): r = 7 m → K = 44 m, L = 154 m² (616 itu\nkalau pakai d=14 sebagai r!).\nNo 4 → (1), (2), dan (4): V = ⅓ × 36 × 10 = 120 cm³. Limas\nsegiempat punya 5 titik sudut.\nNo 5 → A. Benar · B. Benar · C. Salah: Rotasi 180° dari (2, −5) adalah\n(−2, 5)!\nNo 6 → A. Benar · B. Benar · C. Salah: Fₕ = 0,3 × 50 = 15 kali (bukan\n20).\nPeta Belajar Menuju 29 Maret 2027\nCicil santai per bulan bersama tutor Bimbel Gemilang!\nBulan Target Fokus Modul\nNov – Des 2026 Tuntaskan Bab 1 (Bilangan, Unit 1.1–1.10) & mulai Bab 2\n(Aljabar, Unit 2.1–2.5).\nJanuari 2027 Daftar TKA (6 Jan–7 Feb) · Selesaikan Unit 2.6–2.10 &\nBab 3 (Geometri, Unit 3.1–3.8).\nFebruari 2027 Gladi Bersih (15–18 Feb) · Tuntaskan Bangun Ruang,\nTransformasi (3.9–3.13) & Bab 4.\nMaret 2027 Drill Tryout 30 soal / 75 menit + review Cheat Sheet\nHal 43 → Ujian 29 Mar–1 Apr 2027!\nPesan Penutup · Bimbel Gemilang\nSelamat telah memiliki panduan lengkap 52 halaman ini! Ingat kunci sukses\nTKA SMP: paham konsep lewat visual, rajin latihan 5 soal cerita tiap hari,\ndan teliti di PG Kompleks. Sampai jumpa di kelas Bimbel Gemilang—\nsemangat raih nilai terbaik!",
    "tryoutImg": "/modul-assets/tryout/tryout_mtk_p51.png",
    "petaBelajarImg": "/modul-assets/tryout/tryout_mtk_p52.png",
    "konsepTeori": [
      {
        "subjudul": "Unit 4.1: Penyajian Data (Tabel, Batang & Garis)",
        "isi": "Langkah pertama statistika adalah merumuskan pertanyaan untuk mengumpulkan data, lalu menyajikannya agar mudah dibaca: Diagram Batang cocok membandingkan antar kategori, sedangkan Diagram Garis cocok melihat tren naik–turun dari waktu ke waktu. Diagram Garis Penjualan Buku (Unit) — Jan s.d. Mei 20 Jan 28 Feb 50 Mar 40 Apr 56 Mei",
        "poinPenting": [
          "Baca judul dan satuan sumbu Y dulu sebelum melihat angka grafiknya!",
          "Pondasi · Membaca Persen Kenaikan % Kenaikan = (Nilai Baru − Nilai Lama) ÷ Nilai Lama × 100%. Selalu bagi dengan nilai awal (lama)!"
        ]
      },
      {
        "subjudul": "Unit 4.2: Diagram Lingkaran (Persen & Derajat)",
        "isi": "bagian! Diagram Lingkaran menampilkan proporsi tiap kategori terhadap keseluruhan. Perhatikan tandanya: jika memakai persen (%) totalnya 100%; jika memakai derajat (°) totalnya 360°. Tanda kotak siku-siku selalu berarti 90° = 25% = ¼ bagian! 90° 120° 150° Ekskul 120 Siswa SMP (Derajat): • Biru (Futsal): 90° (siku-siku) = ¼ × 120 = 30 siswa • Ungu (Basket): 120° = ⅓ × 120 = 40 siswa • Pink (Musik): 360° − 210° = 150° = 50 siswa",
        "poinPenting": [
          "Satu lingkaran penuh selalu 100% atau 360°—tinggal pakai perbandingan",
          "Pondasi · Rumus Universal Diagram Lingkaran Banyak Ditanya = (Sudut atau % Ditanya ÷ Sudut atau % Diketahui) × Jumlah Diketahui. Berlaku untuk mencari total, satu bagian, maupun selisih dua bagian!"
        ]
      },
      {
        "subjudul": "Unit 4.3: Mean, Median & Modus",
        "isi": "(paling sering)! Jika data berbentuk tabel frekuensi, hitung Mean dengan Σ(nilai × frekuensi) ÷ Σfrekuensi. Untuk Median, wajib urutkan data dari terkecil ke terbesar dulu—kalau banyak data ganjil ambil tepat di tengah; kalau genap rata-ratakan dua angka tengah! Contoh Data Terurut: 5, 6, 7, 7, 7, 8, 9 (n = 7) 5 6 7 7 7 8 9 Median = data ke-4 (7) · Modus = 7 (muncul 3×) Mean = (5+6+7+7+7+8+9) ÷ 7 = 49 ÷ 7 = 7",
        "poinPenting": [
          "Tiga pusat data: Mean (rata-rata), Median (nilai tengah terurut), Modus",
          "Pondasi · Rata-Rata Gabungan (Siswa Susulan) Total Nilai = Mean × Banyak Siswa. Jika ada 1 siswa susulan masuk, cukup hitung: Nilai Susulan = Total Baru − Total Lama!"
        ]
      },
      {
        "subjudul": "Unit 4.4: Jangkauan & Bandingkan 2 Kelompok Data",
        "isi": "melihat keragaman! Kompetensi wajib CP TKA SMP: membandingkan ukuran pemusatan (Mean/Median) dan penyebaran (Jangkauan) dari dua kelompok data! Jangkauan (Range) = Nilai Terbesar − Nilai Terkecil. Bandingkan Kelas A vs Kelas B (Mean Sama = 80) Kelas A 75–85 (Range = 10) Kelas B Range Kelas A kecil (10) → lebih MERATA & KONSISTEN daripada Kelas B (50)!",
        "poinPenting": [
          "Mean sama belum tentu kualitas kelas sama—cek Jangkauannya untuk",
          "Pondasi · Pengaruh Nilai Ekstrem (Pencilan) Jika ada 1 nilai sangat tinggi atau sangat rendah (misal 100 atau 20), Mean dan Jangkauan langsung terpengaruh, sedangkan Median tetap stabil!"
        ]
      },
      {
        "subjudul": "Unit 4.5: Peluang Kejadian Tunggal & Ruang Sampel",
        "isi": "s.d. 1)! Rumus dasar Peluang Teoretis: P(A) = n(A) / n(S). Kenali ruang sampel standar: 1 koin (n(S) = 2), 1 dadu (n(S) = 6), 2 koin (n(S) = 4), dan kantong bola (total semua bola). Ruang Sampel Dadu: 1 dadu memiliki 6 kemungkinan mata dadu S = {1, 2, 3, 4, 5, 6}, sehingga n(S) = 6",
        "poinPenting": [
          "Peluang = banyak hasil yang diharapkan dibagi total semua kemungkinan (0",
          "Pondasi · Peluang Komplemen (“Bukan A”) P(Bukan A) = 1 − P(A). Misalnya peluang hujan = 0,35, maka peluang tidak hujan = 1 − 0,35 = 0,65!"
        ]
      },
      {
        "subjudul": "Unit 4.6: Frekuensi Relatif & Frekuensi Harapan",
        "isi": "peluang! Frekuensi Relatif (Peluang Empiris) didapat dari hasil percobaan sesungguhnya: fᵣ = banyak muncul ÷ total percobaan. Sedangkan Frekuensi Harapan adalah perkiraan berapa kali kejadian muncul dalam N kali percobaan: Fₕ = P(A) × N. Frekuensi Relatif (Nyata) fᵣ = f(A) ÷ N Lempar koin 50×, angka muncul 27× fᵣ = 27/50 = 0,54 Frekuensi Harapan (Prediksi) Fₕ = P(A) × N Dadu dilempar 120×, muncul prima Fₕ = ½ × 120 = 60 kali",
        "poinPenting": [
          "Frekuensi relatif itu dari percobaan nyata; frekuensi harapan itu prediksi dari",
          "Pondasi · Hukum Bilangan Besar Semakin banyak percobaan dilakukan (misal 1.000× lempar dadu dibanding 10×), nilai Frekuensi Relatif akan semakin mendekati Peluang Teoretis!"
        ]
      }
    ],
    "trikCepat": "Trik Cepat · Cek Rata-Rata Tanpa Membagi Mau cek apakah rata-rata 5 bulan > 40? Langsung kalikan 5 × 40 = 200. Karena totalnya 194 < 200, rata-ratanya pasti < 40!",
    "jebakanUmum": "Bedakan “penjualan tertinggi” (Mei = 56) dengan “kenaikan tertinggi” (Feb→Mar naik +22, lebih curam daripada Apr→Mei yang naik +16)!",
    "contohSoal": [
      {
        "soal": "Berdasarkan diagram garis di kiri, tentukan Benar atau Salah untuk setiap pernyataan berikut! A. Kenaikan penjualan terbesar terjadi pada Februari ke Maret. B. Penjualan bulan April mengalami penurunan sebesar 20% dari Maret. C. Rata-rata penjualan selama 5 bulan lebih dari 40 buku. Cek A: Feb→Mar naik 50 − 28 = +22 (terbesar → Benar). Cek B: turun 50 − 40 = 10 dari 50 → (10/50) × 100% = 20% (Benar). Cek C: total = 20+28+50+40+56 = 194 → rata-rata = 194 ÷ 5 = 38,8 (kurang dari 40 → Salah). Jawaban: A. Benar · B. Benar · C. Salah",
        "opsi": {
          "A": "Opsi A",
          "B": "Opsi B",
          "C": "Opsi C",
          "D": "Opsi D"
        },
        "kunci": "A",
        "pembahasanLangkah": [
          "Yuk Bahas · Tren Penjualan Buku (PGK Kategori) Soal: Berdasarkan diagram garis di kiri, tentukan Benar atau Salah untuk setiap pernyataan berikut! A. Kenaikan penjualan terbesar terjadi pada Februari ke Maret. B. Penjualan bulan April mengalami penurunan sebesar 20% dari Maret. C. Rata-rata penjualan selama 5 bulan lebih dari 40 buku. Cek A: Feb→Mar naik 50 − 28 = +22 (terbesar → Benar). Cek B: turun 50 − 40 = 10 dari 50 → (10/50) × 100% = 20% (Benar). Cek C: total = 20+28+50+40+56 = 194 → rata-rata = 194 ÷ 5 = 38,8 (kurang dari 40 → Salah). Jawaban: A. Benar · B. Benar · C. Salah"
        ]
      },
      {
        "soal": "Pada diagram lingkaran ekskul di kiri, diketahui siswa yang ikut Basket (120°) adalah 40 anak. Berapa selisih siswa Musik (150°) dan Futsal (90°)?",
        "opsi": {
          "A": "Opsi A",
          "B": "Opsi B",
          "C": "Opsi C",
          "D": "Opsi D"
        },
        "kunci": "C",
        "pembahasanLangkah": [
          "Yuk Bahas · Hobi Siswa (PG Aplikasi) Soal: Pada diagram lingkaran ekskul di kiri, diketahui siswa yang ikut Basket (120°) adalah 40 anak. Berapa selisih siswa Musik (150°) dan Futsal (90°)? Opsi: A. 10 anak · B. 15 anak · C. 20 anak · D. 25 anak Tidak perlu hitung total seluruh siswa dulu! Langsung pakai selisih sudutnya: Musik − Futsal = 150° − 90° = 60°. Bandingkan dengan Basket (120° = 40 anak): karena 60° itu tepat setengahnya 120°, maka selisihnya = ½ × 40 = 20 anak! Jawaban: C. 20 anak"
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "mtk_smp_b4_q1",
        "soal": "Soal 1 [L1 · PG] & Soal 2 [L2 · PGK MCMA]  [Unit 4.2] Diagram lingkaran 200 siswa: IPA 90°, Matematika 108°, sisanya Bahasa. Banyak siswa Bahasa adalah … (A. 80 · B. 90 · C. 100 · D. 110)  [Unit 4.3] Data nilai: 6, 8, 7, 9, 7, 5, 7. Pilih pernyataan benar: (1) Modus = 7 · (2) Median = 7 · (3) Jangkauan = 3 · (4) Mean > 7. Soal 3 [L3 · PGK Kategori — Peluang & Harapan] Sebuah dadu 6 sisi dilempar 1 kali (dan untuk pernyataan C dilempar 90 kali). Tentukan Benar/Salah: A. Peluang muncul mata dadu prima adalah ½. B. Peluang muncul faktor dari 6 adalah ⅔ . C. Dalam 90 lemparan, frekuensi harapan mata dadu > 4 adalah 45 kali.",
        "opsi": {
          "A": "Peluang muncul mata dadu prima adalah ½.",
          "B": "Peluang muncul faktor dari 6 adalah ⅔ .",
          "C": "100",
          "D": "Pernyataan / Opsi (4) Benar"
        },
        "kunci": "B",
        "pembahasan": "Sudut Bahasa = 360° − (90° + 108°) = 162°."
      },
      {
        "id": "mtk_smp_b4_q2",
        "soal": "",
        "opsi": {
          "A": "Pernyataan / Opsi (1) Benar",
          "B": "Pernyataan / Opsi (2) Benar",
          "C": "Pernyataan / Opsi (3) Benar",
          "D": "Pernyataan / Opsi (4) Benar"
        },
        "kunci": "A",
        "pembahasan": "Urut: 5, 6, 7, 7, 7, 8, 9. Modus = 7, Median = 7,"
      },
      {
        "id": "mtk_smp_b4_q3",
        "soal": "Soal 3 [L3 · PGK Kategori — Peluang & Harapan] Sebuah dadu 6 sisi dilempar 1 kali (dan untuk pernyataan C dilempar 90 kali). Tentukan Benar/Salah: A. Peluang muncul mata dadu prima adalah ½. B. Peluang muncul faktor dari 6 adalah ⅔ . C. Dalam 90 lemparan, frekuensi harapan mata dadu > 4 adalah 45 kali.",
        "opsi": {
          "A": "Peluang muncul mata dadu prima adalah ½.",
          "B": "Peluang muncul faktor dari 6 adalah ⅔ .",
          "C": "Pernyataan / Opsi (3) Benar",
          "D": "Pernyataan / Opsi (4) Benar"
        },
        "kunci": "A",
        "pembahasan": "Prima {2,3,5} = 3/6 = ½."
      }
    ]
  }
];
