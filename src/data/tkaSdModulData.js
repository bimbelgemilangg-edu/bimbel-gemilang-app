// src/data/tkaSdModulData.js
// ==============================================================================
// MODUL BELAJAR INTERAKTIF TKA SD KELAS 6 (STANDAR KURIKULUM NASIONAL & GEMILANG)
// - 2 Subtes Utama Resmi TKA SD 2025/2026:
//   1. Matematika / Numerasi TKA SD (MTK_SD) — 4 Bab Terpadu
//   2. Bahasa Indonesia / Literasi TKA SD (BIN_SD) — 4 Bab Terpadu
// - Lengkap dengan Units Micro-Learning, Pondasi Kaidah, Jebakan Umum,
//   Contoh Soal Bertahap (KaTeX), Trik Kilat, & Kuis Cek Pemahaman.
// ==============================================================================

const MTK_SD_BAB_LIST = [
  {
    id: 'mtk-sd-bab-1',
    subtestKode: 'MTK_SD',
    subtestNama: 'Matematika (Numerasi TKA SD)',
    subtestSingkatan: 'MTK SD',
    subtestEmoji: '🔢',
    subtestWarna: '#0d9488',
    subtestBgLight: '#f0fdfa',
    babNumber: 1,
    slug: 'bilangan-pecahan-fpb-kpk-skala',
    judul: 'Bilangan Bulat, Pecahan, FPB/KPK & Rasio Skala',
    durasiBacaMenit: 12,
    isUtama: true,
    ringkasanSingkat:
      'Kuasai operasi hitung campuran (KaBaTaKu), konversi pecahan-desimal-persen, FPB & KPK soal cerita, serta skala dan perbandingan senilai khas TKA SD Kelas 6.',
    learningObjectives: [
      'Menghitung operasi hitung campuran bilangan bulat positif dan negatif dengan urutan KaBaTaKu yang benar.',
      'Mengubah dan mengurutkan pecahan biasa, campuran, desimal, dan persen secara cepat.',
      'Membedakan soal cerita FPB (membagi sama banyak) vs KPK (kejadian berulang bersamaan).',
      'Menyelesaikan soal rasio, diskon belanja, dan skala peta (1 km = 100.000 cm).',
    ],
    units: [
      {
        unitNumber: '1.1',
        judul: 'Operasi Bilangan Bulat & KaBaTaKu',
        hook: 'Jangan tertipu menghitung dari kiri ke kanan begitu saja—cek tanda kurung, kali/bagi, lalu tambah/kurang!',
        teori:
          'Bilangan bulat mencakup bilangan negatif, nol, dan bilangan positif. Dalam soal TKA SD, operasi campuran selalu mengikuti hierarki KaBaTaKu: (1) Dalam Kurung, (2) Kali & Bagi dari kiri ke kanan, (3) Tambah & Kurang dari kiri ke kanan. Untuk perkalian/pembagian: tanda sama hasilnya positif (+), tanda beda hasilnya negatif (−).',
        pondasi:
          'Aturan Bertemu Tanda: $a + (-b) = a - b$ dan $a - (-b) = a + b$. Pada soal suhu atau selisih ketinggian, kata kunci "selisih" berarti nilai terbesar dikurangi nilai terkecil.',
        jebakanTka:
          'Pada soal $24 - 4 \\times 5$, banyak siswa menghitung $24 - 4 = 20$ lalu $\\times 5 = 100$. Salah! Perkalian wajib didahulukan: $24 - 20 = 4$.',
        contohSoal: {
          judul: 'Contoh Soal Unit 1.1',
          soal: 'Suhu es krim di dalam freezer mula-mula $-5^{\\circ}\\text{C}$. Setelah dikeluarkan selama 20 menit, suhunya naik $3^{\\circ}\\text{C}$ setiap 4 menit. Suhu es krim sekarang adalah …',
          opsiString: 'A. 5°C · B. 10°C · C. 15°C · D. 20°C',
          jawaban: 'B',
          solusi:
            'Dalam 20 menit terjadi kenaikan sebanyak $20 \\div 4 = 5$ kali. Total kenaikan $= 5 \\times 3^{\\circ}\\text{C} = +15^{\\circ}\\text{C}$. Maka suhu akhir $= -5 + 15 = 10^{\\circ}\\text{C}$.',
        },
        trikCepat:
          'Gunakan garis bilangan imajiner (termometer): posisi awal $-5$, naik $15$ langkah berarti melewati $0$ (butuh 5 langkah) dan lanjut 10 langkah ke atas $\\rightarrow 10^{\\circ}\\text{C}$.',
      },
      {
        unitNumber: '1.2',
        judul: 'Pecahan, Desimal & Persen',
        hook: 'Satu nilai punya tiga bentuk penyamaran: pecahan, desimal, dan persen!',
        teori:
          'Untuk membandingkan atau mengurutkan pecahan dengan bentuk berbeda (misal $\\frac{3}{4}, 0{,}65, 70\\%, \\frac{4}{5}$), paling cepat ubah semuanya menjadi bentuk persen (%) atau desimal dua angka di belakang koma.',
        pondasi:
          'Pecahan Istimewa Wajib Hafal SD: $\\frac{1}{2} = 0{,}5 = 50\\%$; $\\frac{1}{4} = 0{,}25 = 25\\%$; $\\frac{3}{4} = 0{,}75 = 75\\%$; $\\frac{1}{5} = 0{,}2 = 20\\%$; $\\frac{1}{8} = 0{,}125 = 12{,}5\\%$.',
        jebakanTka:
          'Saat membagi pecahan, jangan langsung kalikan pembilang! Ubah tanda $\\div$ menjadi $\\times$ lalu balik pecahan kedua: $\\frac{a}{b} \\div \\frac{c}{d} = \\frac{a}{b} \\times \\frac{d}{c}$.',
        contohSoal: {
          judul: 'Contoh Soal Unit 1.2',
          soal: 'Ibu membeli $3\\frac{1}{2}$ kg gula pasir. Sebanyak $40\\%$ dipakai membuat kue dan $1\\frac{1}{4}$ kg diberikan kepada nenek. Sisa gula Ibu sekarang adalah …',
          opsiString: 'A. 0,75 kg · B. 0,85 kg · C. 1,05 kg · D. 1,15 kg',
          jawaban: 'B',
          solusi:
            'Gula awal $= 3{,}5$ kg. Dipakai kue $= 40\\% \\times 3{,}5 = 0{,}4 \\times 3{,}5 = 1{,}4$ kg. Diberikan nenek $= 1{,}25$ kg. Sisa $= 3{,}5 - 1{,}4 - 1{,}25 = 0{,}85$ kg.',
        },
        trikCepat:
          'Ubah $40\\%$ menjadi pecahan $\\frac{2}{5}$ dan $3\\frac{1}{2} = \\frac{7}{2}$, lalu coret 2: $\\frac{2}{5} \\times \\frac{7}{2} = \\frac{7}{5} = 1{,}4$ kg. Anti ribet!',
      },
      {
        unitNumber: '1.3',
        judul: 'FPB & KPK dalam Soal Cerita',
        hook: 'Satu kata kunci di soal langsung menentukan: pakai FPB atau KPK!',
        teori:
          'FPB (Faktor Persekutuan Terbesar) digunakan untuk membagi barang menjadi beberapa paket atau kelompok dengan jumlah sama banyak. KPK (Kelipatan Persekutuan Terkecil) digunakan untuk menghitung kapan jadwal rutin atau lampu berkedip bertemu bersamaan kembali.',
        pondasi:
          'FPB: ambil faktor prima yang SAMA saja, pangkat TERKECIL. KPK: ambil SEMUA faktor prima, pilih pangkat TERBESAR.',
        jebakanTka:
          'Cek pertanyaan akhir pada soal FPB! Apakah yang ditanya **jumlah paket maksimal** (nilai FPB-nya), atau **isi masing-masing barang dalam 1 paket** (jumlah barang $\\div$ FPB)?',
        contohSoal: {
          judul: 'Contoh Soal Unit 1.3',
          soal: 'Lampu A berkedip setiap 12 detik, lampu B setiap 15 detik, dan lampu C setiap 20 detik. Jika pukul 08.15.00 ketiganya berkedip bersama, pukul berapa ketiganya berkedip bersama lagi?',
          opsiString: 'A. 08.15.30 · B. 08.16.00 · C. 08.16.15 · D. 08.17.00',
          jawaban: 'B',
          solusi:
            '$12 = 2^2 \\times 3$, $15 = 3 \\times 5$, $20 = 2^2 \\times 5$. $\\text{KPK} = 2^2 \\times 3 \\times 5 = 60$ detik $= 1$ menit. Jadi berkedip bersama lagi pukul $08.15.00 + 1\\text{ menit} = 08.16.00$.',
        },
        trikCepat:
          'Cari kelipatan angka terbesar ($20, 40, 60$). Begitu ketemu $60$ habis dibagi $12$ dan $15$, langsung itulah KPK-nya—tidak perlu bikin pohon faktor panjang!',
      },
      {
        unitNumber: '1.4',
        judul: 'Rasio, Diskon & Skala Peta',
        hook: 'Pada skala peta, 1 km selalu sama dengan 100.000 cm—ingat angka 5 nol!',
        teori:
          'Rasio membandingkan dua besaran sejenis. Skala peta adalah perbandingan $\\text{Jarak Peta (JP)} : \\text{Jarak Sebenarnya (JS)}$. Segitiga ajaibnya: $\\text{JP} = \\text{Skala} \\times \\text{JS}$, dan $\\text{JS} = \\text{JP} \\div \\text{Skala}$.',
        pondasi:
          'Rumus Anti-Ketukar Rasio: $\\text{Nilai Ditanya} = \\frac{\\text{Rasio Ditanya}}{\\text{Rasio Diketahui}} \\times \\text{Nilai Diketahui}$. Jika diketahui "jumlah", penyebutnya jumlah rasio; jika diketahui "selisih", penyebutnya selisih rasio.',
        jebakanTka:
          'Pada skala $1 : 500.000$, $1$ cm di peta mewakili $500.000$ cm $= 5$ km (coret 5 nol, bukan 3 nol!).',
        contohSoal: {
          judul: 'Contoh Soal Unit 1.4',
          soal: 'Perbandingan umur Roni dan adiknya adalah $5 : 3$. Jika selisih umur mereka $6$ tahun, berapa umur Roni $4$ tahun yang akan datang?',
          opsiString: 'A. 15 tahun · B. 17 tahun · C. 19 tahun · D. 21 tahun',
          jawaban: 'C',
          solusi:
            'Selisih rasio $= 5 - 3 = 2$. Umur Roni sekarang $= \\frac{5}{2} \\times 6 = 15$ tahun. Empat tahun lagi $= 15 + 4 = 19$ tahun.',
        },
        trikCepat:
          'Jangan berhenti di $15$ tahun! Selalu garisbawahi kalimat terakhir soal ("4 tahun yang akan datang") agar tidak terpancing pengecoh opsi A.',
      },
    ],
    konsepTeori: [
      {
        subjudul: 'Hierarki KaBaTaKu & Bilangan Negatif',
        isi: 'Dahulukan tanda kurung, lalu perkalian/pembagian dari kiri ke kanan, terakhir penjumlahan/pengurangan.',
        poinPenting: [
          '$a - (-b) = a + b$',
          'Tanda sama ($+\\times+$ atau $-\\times-$) menghasilkan $+$; tanda beda menghasilkan $-$.',
        ],
      },
      {
        subjudul: 'Konversi Pecahan, FPB/KPK & Rasio',
        isi: 'Samakan bentuk ke persen/desimal saat mengurutkan pecahan, gunakan FPB untuk membagi paket merata, dan KPK untuk pertemuan jadwal berkala.',
        poinPenting: [
          '$1\\text{ km} = 100.000\\text{ cm}$ untuk menghitung skala peta.',
          'Rumus cepat rasio: $(\\text{Rasio Ditanya} \\div \\text{Rasio Diketahui}) \\times \\text{Nilai Diketahui}$.',
        ],
      },
    ],
    trikCepat:
      'Saat mencari KPK tiga bilangan di SD ($12, 15, 20$), ambil kelipatan bilangan terbesar ($20, 40, 60$) dan cek mana yang habis dibagi dua bilangan lainnya. Lebih cepat daripada pohon faktor!',
    jebakanUmum:
      'Siswa sering lupa mengubah satuan km ke cm (kurang 2 nol!) pada soal skala peta, atau lupa menambahkan "tahun yang akan datang" pada soal perbandingan umur.',
    contohSoal: [
      {
        soal: 'Hasil dari $120 + (-30) \\times 4 - (-25)$ adalah …',
        opsi: { A: '-25', B: '0', C: '25', D: '385' },
        kunci: 'C',
        pembahasanLangkah: [
          'Kerjakan perkalian lebih dahulu: $(-30) \\times 4 = -120$.',
          'Substitusikan kembali: $120 + (-120) - (-25) = 0 + 25 = 25$.',
        ],
      },
      {
        soal: 'Bu Sari memiliki 48 kue bolu dan 60 kue lapis. Kedua kue dimasukkan ke dalam kotak dengan jumlah masing-masing jenis sama banyak. Berapa kotak terbanyak yang diperlukan dan berapa kue bolu tiap kotak?',
        opsi: { A: '12 kotak, 4 bolu', B: '12 kotak, 5 bolu', C: '6 kotak, 8 bolu', D: '24 kotak, 2 bolu' },
        kunci: 'A',
        pembahasanLangkah: [
          'Karena membagi sama banyak, cari FPB dari 48 dan 60.',
          '$48 = 2^4 \\times 3$ dan $60 = 2^2 \\times 3 \\times 5 \\Rightarrow \\text{FPB} = 2^2 \\times 3 = 12$ kotak.',
          'Isi kue bolu per kotak $= 48 \\div 12 = 4$ kue bolu.',
        ],
      },
    ],
    kuisPemahaman: [
      {
        id: 'mtk_sd_b1_q1',
        soal: 'Hasil dari $84 - 12 \\times 4 + 18 \\div 3$ adalah …',
        opsi: { A: '30', B: '42', C: '294', D: '36' },
        kunci: 'B',
        pembahasan: 'Dahulukan kali dan bagi: $12 \\times 4 = 48$ dan $18 \\div 3 = 6$. Jadi $84 - 48 + 6 = 42$.',
      },
      {
        id: 'mtk_sd_b1_q2',
        soal: 'Urutan pecahan berikut dari yang terkecil hingga terbesar adalah $\\frac{3}{4};\\; 0{,}65;\\; 70\\% ;\\; \\frac{4}{5}$ …',
        opsi: {
          A: '$0{,}65;\\; 70\\% ;\\; \\frac{3}{4};\\; \\frac{4}{5}$',
          B: '$70\\% ;\\; 0{,}65;\\; \\frac{3}{4};\\; \\frac{4}{5}$',
          C: '$\\frac{3}{4};\\; 0{,}65;\\; 70\\% ;\\; \\frac{4}{5}$',
          D: '$0{,}65;\\; \\frac{3}{4};\\; 70\\% ;\\; \\frac{4}{5}$',
        },
        kunci: 'A',
        pembahasan: 'Ubah ke persen: $\\frac{3}{4} = 75\\%$, $0{,}65 = 65\\%$, $70\\% = 70\\%$, $\\frac{4}{5} = 80\\%$. Urutan terkecil ke terbesar: $65\\%, 70\\%, 75\\%, 80\\%$.',
      },
      {
        id: 'mtk_sd_b1_q3',
        soal: 'Andi berenang setiap 6 hari sekali, Budi setiap 8 hari sekali, dan Caca setiap 12 hari sekali. Jika tanggal 3 Maret mereka berenang bersama, kapan mereka berenang bersama lagi?',
        opsi: { A: '24 Maret', B: '27 Maret', C: '29 Maret', D: '30 Maret' },
        kunci: 'B',
        pembahasan: '$\\text{KPK}(6, 8, 12) = 24$ hari. Bersama lagi pada $3 + 24 = 27$ Maret.',
      },
      {
        id: 'mtk_sd_b1_q4',
        soal: 'Jarak kota A dan kota B pada peta dengan skala $1 : 1.500.000$ adalah $6$ cm. Jarak sebenarnya kedua kota tersebut adalah …',
        opsi: { A: '9 km', B: '90 km', C: '25 km', D: '900 km' },
        kunci: 'B',
        pembahasan: '$\\text{JS} = 6 \\times 1.500.000\\text{ cm} = 9.000.000\\text{ cm} = 90\\text{ km}$.',
      },
      {
        id: 'mtk_sd_b1_q5',
        soal: 'Harga sebuah tas Rp180.000 mendapat diskon $20\\%$. Uang yang harus dibayar adalah …',
        opsi: { A: 'Rp36.000', B: 'Rp140.000', C: 'Rp144.000', D: 'Rp160.000' },
        kunci: 'C',
        pembahasan: 'Bayar $= (100\\% - 20\\%) \\times 180.000 = 80\\% \\times 180.000 = \\text{Rp}144.000$.',
      },
    ],
  },
  {
    id: 'mtk-sd-bab-2',
    subtestKode: 'MTK_SD',
    subtestNama: 'Matematika (Numerasi TKA SD)',
    subtestSingkatan: 'MTK SD',
    subtestEmoji: '🔢',
    subtestWarna: '#0d9488',
    subtestBgLight: '#f0fdfa',
    babNumber: 2,
    slug: 'pengukuran-kecepatan-jarak-debit',
    judul: 'Satuan Ukur, Kecepatan, Jarak, Waktu & Debit',
    durasiBacaMenit: 10,
    isUtama: true,
    ringkasanSingkat:
      'Kuasai konversi tangga satuan panjang, berat, luas, dan volume (liter = dm³), segitiga ajaib JKW (Jarak-Kecepatan-Waktu), serta VDW (Volume-Debit-Waktu).',
    learningObjectives: [
      'Mengonversi satuan panjang, berat (ton, kuintal, kg), dan waktu (jam, menit, detik) dengan tepat.',
      'Menghubungkan satuan volume kubik dengan liter ($1\\text{ dm}^3 = 1\\text{ liter}$, $1\\text{ m}^3 = 1.000\\text{ liter}$).',
      'Menyelesaikan soal kecepatan, waktu tempuh, dan dua kendaraan berpapasan/menyusul.',
      'Menghitung debit air pengisian bak mandi atau pengurangan volume tangki.',
    ],
    units: [
      {
        unitNumber: '2.1',
        judul: 'Konversi Satuan Panjang, Berat & Waktu',
        hook: 'Tangga biasa turun 1 tingkat $\\times 10$, tapi tangga luas $\\times 100$ dan volume $\\times 1.000$!',
        teori:
          'Pahami pasangan tangga satuan yang sering keluar di TKA SD: $1\\text{ ton} = 1.000\\text{ kg}$, $1\\text{ kuintal} = 100\\text{ kg}$, $1\\text{ ha (hm}^2\\text{)} = 10.000\\text{ m}^2$, $1\\text{ are (dam}^2\\text{)} = 100\\text{ m}^2$. Untuk volume: $1\\text{ m}^3 = 1.000\\text{ dm}^3 = 1.000\\text{ liter}$, dan $1\\text{ cm}^3 = 1\\text{ ml} = 1\\text{ cc}$.',
        pondasi:
          'Konversi Waktu Desimal: $0{,}5\\text{ jam} = 30\\text{ menit}$; $15\\text{ menit} = \\frac{1}{4}\\text{ jam} = 0{,}25\\text{ jam}$; $20\\text{ menit} = \\frac{1}{3}\\text{ jam}$; $45\\text{ menit} = \\frac{3}{4}\\text{ jam} = 0{,}75\\text{ jam}$.',
        jebakanTka:
          '1 jam 30 menit BUKAN $1{,}3$ jam! Karena 1 jam = 60 menit, maka 30 menit $= \\frac{30}{60} = 0{,}5$ jam, sehingga $1\\text{ jam } 30\\text{ menit} = 1{,}5\\text{ jam}$.',
        contohSoal: {
          judul: 'Contoh Soal Unit 2.1',
          soal: 'Pak Hasan memiliki persediaan beras $1{,}2$ ton. Beras tersebut terjual $4{,}5$ kuintal dan dikirim ke panti asuhan $150$ kg. Sisa beras Pak Hasan adalah …',
          opsiString: 'A. 500 kg · B. 600 kg · C. 650 kg · D. 750 kg',
          jawaban: 'B',
          solusi:
            '$1{,}2\\text{ ton} = 1.200\\text{ kg}$. Terjual $4{,}5\\text{ kuintal} = 450\\text{ kg}$. Sisa $= 1.200 - 450 - 150 = 600\\text{ kg}$.',
        },
        trikCepat:
          'Ubah semua satuan menjadi satuan yang diminta pilihan ganda sebelum menjumlahkan/mengurangkan!',
      },
      {
        unitNumber: '2.2',
        judul: 'Segitiga JKW (Jarak, Kecepatan, Waktu) & Berpapasan',
        hook: 'Tutup huruf yang ditanya di segitiga JKW: J di atas, K dan W di bawah!',
        teori:
          'Rumus inti gerak beraturan: $J = K \\times W$, $K = \\frac{J}{W}$, dan $W = \\frac{J}{K}$. Untuk dua kendaraan berangkat BERSAMAAN dari arah berlawanan agar **berpapasan**, gunakan kecepatan gabungan: $W_{\\text{papasan}} = \\frac{\\text{Jarak Total}}{K_1 + K_2}$.',
        pondasi:
          'Jika kendaraan pertama berangkat lebih awal $t$ jam sebelum kendaraan kedua jalan, hitung dulu jarak yang sudah ditempuh kendaraan pertama ($J_{\\text{awal}} = K_1 \\times t$), lalu $W_{\\text{papasan}} = \\frac{\\text{Jarak Total} - J_{\\text{awal}}}{K_1 + K_2}$.',
        jebakanTka:
          'Jangan lupa menambahkan waktu istirahat jika di tengah perjalanan kendaraan berhenti istirahat! Jam tiba $=$ Jam berangkat $+$ Waktu tempuh $+$ Waktu istirahat.',
        contohSoal: {
          judul: 'Contoh Soal Unit 2.2',
          soal: 'Jarak rumah Doni ke rumah nenek $135$ km. Doni berangkat naik mobil pukul $07.30$ dengan kecepatan rata-rata $60$ km/jam. Jika ia beristirahat $15$ menit di rest area, pukul berapa Doni tiba di rumah nenek?',
          opsiString: 'A. 09.45 · B. 09.55 · C. 10.00 · D. 10.15',
          jawaban: 'C',
          solusi:
            '$W = \\frac{135}{60} = 2\\frac{15}{60}\\text{ jam} = 2\\text{ jam } 15\\text{ menit}$. Ditambah istirahat $15$ menit $= 2\\text{ jam } 30\\text{ menit}$. Jam tiba $= 07.30 + 02.30 = 10.00$.',
        },
        trikCepat:
          'Pecahan jam sisa $\\frac{15}{60}$ jangan diubah ke desimal dulu kalau ditanya pukul tiba—pembilangnya ($15$) langsung berarti $15$ menit!',
      },
      {
        unitNumber: '2.3',
        judul: 'Segitiga VDW (Volume, Debit, Waktu)',
        hook: 'Debit itu persis seperti kecepatan—bedanya yang mengalir adalah Volume air!',
        teori:
          'Debit ($D$) menyatakan banyaknya volume ($V$) zat cair yang mengalir tiap satuan waktu ($W$). Rumusnya: $V = D \\times W$, $D = \\frac{V}{W}$, dan $W = \\frac{V}{D}$.',
        pondasi:
          'Samakan satuan Volume dan Waktu pada Debit! Jika debit dalam **liter/menit** sedangkan ukuran bak masih **cm** atau **m**, ubah volume bak ke $\\text{dm}^3$ (liter) terlebih dahulu.',
        jebakanTka:
          'Soal bak diisi saat kondisi sudah terisi setengahnya: maka Volume yang perlu diisi hanyalah **sisa volume kosongnya** ($\\frac{1}{2} \\times V_{\\text{penuh}}$), bukan volume penuh!',
        contohSoal: {
          judul: 'Contoh Soal Unit 2.3',
          soal: 'Sebuah tangki berkapasitas $240$ liter berisi air seperempat bagian. Keran dibuka dengan debit $12$ liter/menit hingga tangki penuh. Lama keran terbuka adalah …',
          opsiString: 'A. 5 menit · B. 12 menit · C. 15 menit · D. 20 menit',
          jawaban: 'C',
          solusi:
            'Sudah terisi $\\frac{1}{4}$, berarti bagian yang masih kosong $= \\frac{3}{4} \\times 240 = 180$ liter. Waktu isi $= \\frac{180}{12} = 15$ menit.',
        },
        trikCepat:
          'Tangki penuh butuh $240 \\div 12 = 20$ menit. Karena kosongnya $\\frac{3}{4}$ bagian, langsung kalikan $\\frac{3}{4} \\times 20 = 15$ menit!',
      },
    ],
    konsepTeori: [
      {
        subjudul: 'Kesetaraan Volume & Satuan Berat',
        isi: 'Ingat jembatan emas satuan SD: $1\\text{ liter} = 1\\text{ dm}^3$, $1\\text{ ml} = 1\\text{ cm}^3 = 1\\text{ cc}$, dan $1\\text{ m}^3 = 1.000\\text{ liter}$.',
        poinPenting: [
          '$1\\text{ ton} = 1.000\\text{ kg}$ · $1\\text{ kuintal} = 100\\text{ kg}$',
          '$1\\text{ ha} = 10.000\\text{ m}^2$ · $1\\text{ are} = 100\\text{ m}^2$',
        ],
      },
      {
        subjudul: 'JKW & VDW Anti-Salah Satuan',
        isi: 'Selalu pastikan satuan kecepatan (km/jam) cocok dengan jarak (km) dan waktu (jam). Begitu pula debit (liter/menit) cocok dengan volume (liter) dan waktu (menit).',
        poinPenting: [
          '$W_{\\text{papasan bersama}} = \\text{Jarak} \\div (K_1 + K_2)$',
          '$W_{\\text{isi air}} = \\text{Volume Kosong} \\div \\text{Debit}$',
        ],
      },
    ],
    trikCepat:
      'Ketemu soal debit dengan ukuran bak dalam cm (misal $80\\text{ cm} \\times 50\\text{ cm} \\times 60\\text{ cm}$)? Kalikan lalu langsung hilangkan 3 nol untuk mengubah $\\text{cm}^3$ menjadi liter ($240.000\\text{ cm}^3 = 240\\text{ liter}$)!',
    jebakanUmum:
      'Kesalahan paling sering di TKA SD adalah menulis $2\\text{ jam } 45\\text{ menit}$ sebagai $2{,}45\\text{ jam}$. Seharusnya $2\\frac{45}{60} = 2{,}75\\text{ jam}$!',
    contohSoal: [
      {
        soal: 'Sebuah bus melaju dengan kecepatan $72\\text{ km/jam}$. Jarak yang ditempuh bus tersebut dalam waktu $25\\text{ menit}$ adalah …',
        opsi: { A: '25 km', B: '30 km', C: '36 km', D: '42 km' },
        kunci: 'B',
        pembahasanLangkah: [
          'Ubah waktu ke jam: $W = \\frac{25}{60} = \\frac{5}{12}\\text{ jam}$.',
          'Hitung jarak: $J = 72 \\times \\frac{5}{12} = 6 \\times 5 = 30\\text{ km}$.',
        ],
      },
    ],
    kuisPemahaman: [
      {
        id: 'mtk_sd_b2_q1',
        soal: 'Hasil dari $2{,}4\\text{ km} + 350\\text{ m} - 12.000\\text{ cm}$ adalah … m.',
        opsi: { A: '2.530 m', B: '2.630 m', C: '2.730 m', D: '2.870 m' },
        kunci: 'B',
        pembahasan: '$2{,}4\\text{ km} = 2.400\\text{ m}$ dan $12.000\\text{ cm} = 120\\text{ m}$. Jadi $2.400 + 350 - 120 = 2.630\\text{ m}$.',
      },
      {
        id: 'mtk_sd_b2_q2',
        soal: 'Sebuah mobil menempuh jarak $180\\text{ km}$ dari pukul $06.45$ hingga tiba pukul $09.15$ tanpa istirahat. Kecepatan rata-rata mobil tersebut adalah …',
        opsi: { A: '60 km/jam', B: '72 km/jam', C: '75 km/jam', D: '80 km/jam' },
        kunci: 'B',
        pembahasan: 'Waktu tempuh $= 09.15 - 06.45 = 2\\text{ jam } 30\\text{ menit} = 2{,}5\\text{ jam}$. Kecepatan $= 180 \\div 2{,}5 = 72\\text{ km/jam}$.',
      },
      {
        id: 'mtk_sd_b2_q3',
        soal: 'Siti dan Lani berjarak $120\\text{ km}$ dan berangkat bersamaan pukul $08.00$ saling mendekat. Kecepatan Siti $40\\text{ km/jam}$ dan Lani $20\\text{ km/jam}$. Pukul berapa mereka berpapasan?',
        opsi: { A: '09.30', B: '10.00', C: '10.30', D: '11.00' },
        kunci: 'B',
        pembahasan: '$W_{\\text{papasan}} = \\frac{120}{40 + 20} = \\frac{120}{60} = 2\\text{ jam}$. Berpapasan pukul $08.00 + 2\\text{ jam} = 10.00$.',
      },
      {
        id: 'mtk_sd_b2_q4',
        soal: 'Bak mandi berukuran panjang $100\\text{ cm}$, lebar $60\\text{ cm}$, dan tinggi $50\\text{ cm}$ diisi air hingga penuh selama $15\\text{ menit}$. Debit keran air adalah …',
        opsi: { A: '15 liter/menit', B: '20 liter/menit', C: '25 liter/menit', D: '30 liter/menit' },
        kunci: 'B',
        pembahasan: 'Volume $= 100 \\times 60 \\times 50 = 300.000\\text{ cm}^3 = 300\\text{ liter}$. Debit $= 300 \\div 15 = 20\\text{ liter/menit}$.',
      },
      {
        id: 'mtk_sd_b2_q5',
        soal: 'Sebuah toko mempunyai persediaan $0{,}8\\text{ m}^3$ minyak goreng. Jika minyak dikemas ke dalam botol berukuran $2\\text{ liter}$, berapa botol yang dibutuhkan?',
        opsi: { A: '40 botol', B: '160 botol', C: '400 botol', D: '800 botol' },
        kunci: 'C',
        pembahasan: '$0{,}8\\text{ m}^3 = 0{,}8 \\times 1.000 = 800\\text{ liter}$. Banyak botol $= 800 \\div 2 = 400\\text{ botol}$.',
      },
    ],
  },
  {
    id: 'mtk-sd-bab-3',
    subtestKode: 'MTK_SD',
    subtestNama: 'Matematika (Numerasi TKA SD)',
    subtestSingkatan: 'MTK SD',
    subtestEmoji: '🔢',
    subtestWarna: '#0d9488',
    subtestBgLight: '#f0fdfa',
    babNumber: 3,
    slug: 'geometri-bangun-datar-dan-ruang',
    judul: 'Geometri: Bangun Datar Gabungan, Lingkaran & Bangun Ruang',
    durasiBacaMenit: 12,
    isUtama: true,
    ringkasanSingkat:
      'Kuasai rumus keliling & luas bangun datar gabungan, luas bagian lingkaran ($\frac{1}{2}$, $\frac{3}{4}$), jaring-jaring kubus/balok, serta volume & luas permukaan kubus, balok, prisma, dan tabung.',
    learningObjectives: [
      'Menghitung keliling dan luas bangun datar gabungan (persegi panjang, segitiga, trapesium, layang-layang).',
      'Menggunakan nilai $\\pi = \\frac{22}{7}$ atau $3{,}14$ dengan cerdas pada lingkaran penuh maupun seperempat/setengah lingkaran.',
      'Menghitung volume dan luas permukaan kubus, balok, serta tabung.',
      'Menyelesaikan soal aplikasi tinggi air atau banyak kubus satuan dalam wadah balok.',
    ],
    units: [
      {
        unitNumber: '3.1',
        judul: 'Keliling & Luas Bangun Datar Gabungan',
        hook: 'Untuk keliling bangun gabungan, cukup jalan menyusuri TEPI LUARNYA saja—garis pembatas di dalam jangan dihitung!',
        teori:
          'Luas bangun gabungan dihitung dengan **memecah** menjadi bentuk dasar (persegi, persegi panjang, segitiga, trapesium, jajar genjang) lalu dijumlahkan, ATAU menggunakan luas persegi besar dikurangi bagian yang berlubang/terpotong.',
        pondasi:
          'Hafalkan Rumus Luas Penting: Segitiga $= \\frac{1}{2} \\times a \\times t$; Trapesium $= \\frac{(a + b) \\times t}{2}$; Belah Ketupat / Layang-layang $= \\frac{d_1 \\times d_2}{2}$.',
        jebakanTka:
          'Pada soal pemasangan lampu atau pohon di sekeliling taman berbentuk persegi panjang: jumlah pohon/tiang $= \\text{Keliling} \\div \\text{Jarak antartiang}$. Jangan sampai menggunakan Luas!',
        contohSoal: {
          judul: 'Contoh Soal Unit 3.1',
          soal: 'Sebuah kebun berbentuk trapesium sama kaki dengan panjang sisi sejajar $12\\text{ m}$ dan $20\\text{ m}$, serta tinggi $6\\text{ m}$. Jika kebun dijual seharga Rp250.000 per $\\text{m}^2$, harga total kebun adalah …',
          opsiString: 'A. Rp16.000.000 · B. Rp24.000.000 · C. Rp28.000.000 · D. Rp32.000.000',
          jawaban: 'B',
          solusi:
            '$L = \\frac{(12 + 20) \\times 6}{2} = 32 \\times 3 = 96\\text{ m}^2$. Harga $= 96 \\times 250.000 = \\text{Rp}24.000.000$.',
        },
        trikCepat:
          'Mengalikan bilangan dengan $250.000$ cukup bagi bilangan itu dengan $4$ lalu tambah 6 nol ($96 \\div 4 = 24 \\rightarrow \\text{Rp}24.000.000$)!',
      },
      {
        unitNumber: '3.2',
        judul: 'Lingkaran & Bagian Lingkaran',
        hook: 'Cek apakah jari-jari ($r$) atau diameter ($d$) kelipatan 7! Jika ya, pakai $\\pi = \\frac{22}{7}$.',
        teori:
          'Keliling Lingkaran $= \\pi \\times d = 2 \\times \\pi \\times r$. Luas Lingkaran $= \\pi \\times r^2$. Jika hanya ada seperempat, setengah, atau tiga perempat bagian, kalikan luas/busur dengan pecahannya.',
        pondasi:
          'Ingat: Keliling **setengah lingkaran tertutup** adalah $\\frac{1}{2} \\times \\pi \\times d + d$ (lengkung setengah lingkaran DITAMBAH garis diameter penutup di bawahnya!).',
        jebakanTka:
          'Soal memberi tahu DIAMETER ($d = 28$ cm), lalu siswa langsung memasukkan $28$ ke rumus $\\pi \\times r^2$! Harusnya cari jari-jari dulu: $r = d \\div 2 = 14$ cm.',
        contohSoal: {
          judul: 'Contoh Soal Unit 3.2',
          soal: 'Sebuah taman berbentuk setengah lingkaran berdiameter $14$ meter. Di sekeliling taman akan dipasang pagar kawat. Panjang kawat minimum yang dibutuhkan adalah …',
          opsiString: 'A. 22 m · B. 29 m · C. 36 m · D. 44 m',
          jawaban: 'C',
          solusi:
            'Panjang busur lengkung $= \\frac{1}{2} \\times \\frac{22}{7} \\times 14 = 22\\text{ m}$. Tambah garis lurus diameter penutup $14\\text{ m}$: total $= 22 + 14 = 36\\text{ m}$.',
        },
        trikCepat:
          'Keliling $r = 7$ selalu $44$ (luas $154$); $r = 14$ kelilingnya $88$ (luas $616$). Hafalkan angka kembar ini biar hitung setengah/seperempat lingkaran langsung ketemu!',
      },
      {
        unitNumber: '3.3',
        judul: 'Volume & Luas Permukaan Bangun Ruang',
        hook: 'Hampir semua bangun ruang tegak (Kubus, Balok, Prisma, Tabung) punya satu rumus induk: Volume = Luas Alas × Tinggi!',
        teori:
          'Kubus memiliki 6 sisi persegi sama besar ($V = s^3$, $LP = 6s^2$). Balok memiliki 3 pasang sisi ($V = p \\times l \\times t$, $LP = 2(pl + pt + lt)$). Tabung ($V = \\pi r^2 t$).',
        pondasi:
          'Jika diketahui **Volume kubus**, cara mencari panjang rusuknya adalah akar pangkat tiga ($s = \\sqrt[3]{V}$). Hafalkan ekor pangkat 3: $1\\leftrightarrow1, 2\\leftrightarrow8, 3\\leftrightarrow7, 4\\leftrightarrow4, 5\\leftrightarrow5, 6\\leftrightarrow6, 9\\leftrightarrow9$.',
        jebakanTka:
          'Perhatikan kata "bak tanpa tutup" pada soal luas permukaan cat atau keramik! Jika tanpa tutup, sisi atas ($p \\times l$ atau $s^2$) TIDAK dihitung.',
        contohSoal: {
          judul: 'Contoh Soal Unit 3.3',
          soal: 'Sebuah kaleng susu berbentuk tabung memiliki diameter alas $14$ cm dan tinggi $20$ cm. Volume maksimum susu yang dapat ditampung adalah …',
          opsiString: 'A. 1.540 cm³ · B. 3.080 cm³ · C. 6.160 cm³ · D. 12.320 cm³',
          jawaban: 'B',
          solusi:
            '$d = 14\\text{ cm} \\Rightarrow r = 7\\text{ cm}$. $V = \\frac{22}{7} \\times 7 \\times 7 \\times 20 = 154 \\times 20 = 3.080\\text{ cm}^3$.',
        },
        trikCepat:
          'Jangan terkecoh antara diameter dan jari-jari pada tabung! Selalu tulis "$r = d \\div 2$" sebelum menghitung luas alas.',
      },
    ],
    konsepTeori: [
      {
        subjudul: 'Bangun Datar Gabungan & Lingkaran',
        isi: 'Bedakan sisi tepi (untuk keliling) dan area arsiran (untuk luas). Pada bagian lingkaran tertutup, jangan lupa menjumlahkan 2 jari-jari / diameter penutupnya.',
        poinPenting: [
          '$K_{\\text{lingkaran}} = \\pi d$, $L_{\\text{lingkaran}} = \\pi r^2$',
          '$r = \\frac{1}{2} d$',
        ],
      },
      {
        subjudul: 'Bangun Ruang Kubus, Balok & Tabung',
        isi: 'Volume seluruh bangun ruang tegak = $\\text{Luas Alas} \\times \\text{Tinggi}$. Untuk mencari tinggi air dalam wadah balok, bagi volume air dengan luas alas ($p \\times l$).',
        poinPenting: [
          'Kubus tanpa tutup hanya memiliki 5 sisi ($5 \\times s^2$).',
          'Tabung: $V = \\pi r^2 t$.',
        ],
      },
    ],
    trikCepat:
      'Untuk soal "berapa banyak kubus kecil berukuran $r$ yang muat ke dalam kardus balok?", pastikan panjang, lebar, dan tinggi balok dibagi rusuk kubus secara terpisah (dibulatkan ke bawah) jika ukurannya tidak habis membagi!',
    jebakanUmum:
      'Memakai diameter sebagai jari-jari di rumus $\\pi r^2$ menghasilkan jawaban 4 kali lebih besar daripada jawaban yang benar!',
    contohSoal: [
      {
        soal: 'Sebuah akuarium kubus tanpa tutup memiliki panjang rusuk $50\\text{ cm}$. Luas kaca yang dibutuhkan untuk membuat akuarium tersebut adalah …',
        opsi: { A: '10.000 cm²', B: '12.500 cm²', C: '15.000 cm²', D: '125.000 cm²' },
        kunci: 'B',
        pembahasanLangkah: [
          'Akuarium tanpa tutup terdiri atas 5 bidang sisi persegi.',
          '$LP = 5 \\times s^2 = 5 \\times 50 \\times 50 = 12.500\\text{ cm}^2$.',
        ],
      },
    ],
    kuisPemahaman: [
      {
        id: 'mtk_sd_b3_q1',
        soal: 'Luas $\\frac{3}{4}$ bagian lingkaran dengan jari-jari $14\\text{ cm}$ adalah … ($\\pi = \\frac{22}{7}$)',
        opsi: { A: '154 cm²', B: '308 cm²', C: '462 cm²', D: '616 cm²' },
        kunci: 'C',
        pembahasan: '$L = \\frac{3}{4} \\times \\frac{22}{7} \\times 14 \\times 14 = \\frac{3}{4} \\times 616 = 462\\text{ cm}^2$.',
      },
      {
        id: 'mtk_sd_b3_q2',
        soal: 'Sebuah taman persegi panjang berukuran $24\\text{ m} \\times 16\\text{ m}$. Di sekeliling taman ditanami pohon dengan jarak antar pohon $4\\text{ m}$. Banyak pohon yang dibutuhkan adalah …',
        opsi: { A: '16 pohon', B: '20 pohon', C: '40 pohon', D: '96 pohon' },
        kunci: 'B',
        pembahasan: 'Keliling $= 2 \\times (24 + 16) = 80\\text{ m}$. Banyak pohon $= 80 \\div 4 = 20\\text{ pohon}$.',
      },
      {
        id: 'mtk_sd_b3_q3',
        soal: 'Volume sebuah kubus adalah $4.913\\text{ cm}^3$. Panjang rusuk kubus tersebut adalah …',
        opsi: { A: '13 cm', B: '17 cm', C: '23 cm', D: '27 cm' },
        kunci: 'B',
        pembahasan: 'Karena $10^3 = 1.000$ dan $20^3 = 8.000$, serta ekor $3$ berpasangan dengan $7$, maka $\\sqrt[3]{4.913} = 17\\text{ cm}$.',
      },
      {
        id: 'mtk_sd_b3_q4',
        soal: 'Sebuah balok memiliki panjang $15\\text{ cm}$, lebar $10\\text{ cm}$, dan tinggi $8\\text{ cm}$. Luas permukaan balok tersebut adalah …',
        opsi: { A: '350 cm²', B: '600 cm²', C: '700 cm²', D: '1.200 cm²' },
        kunci: 'C',
        pembahasan: '$LP = 2 \\times (15\\cdot10 + 15\\cdot8 + 10\\cdot8) = 2 \\times (150 + 120 + 80) = 2 \\times 350 = 700\\text{ cm}^2$.',
      },
      {
        id: 'mtk_sd_b3_q5',
        soal: 'Sebuah wadah berbentuk balok dengan luas alas $300\\text{ cm}^2$ berisi air setinggi $12\\text{ cm}$. Jika dituangkan tambahan air sebanyak $1{,}5\\text{ liter}$, tinggi air sekarang adalah …',
        opsi: { A: '15 cm', B: '17 cm', C: '18 cm', D: '20 cm' },
        kunci: 'B',
        pembahasan: 'Tambahan air $1{,}5\\text{ liter} = 1.500\\text{ cm}^3$. Kenaikan tinggi $= 1.500 \\div 300 = 5\\text{ cm}$. Tinggi sekarang $= 12 + 5 = 17\\text{ cm}$.',
      },
    ],
  },
  {
    id: 'mtk-sd-bab-4',
    subtestKode: 'MTK_SD',
    subtestNama: 'Matematika (Numerasi TKA SD)',
    subtestSingkatan: 'MTK SD',
    subtestEmoji: '🔢',
    subtestWarna: '#0d9488',
    subtestBgLight: '#f0fdfa',
    babNumber: 4,
    slug: 'statistika-data-diagram-mean-median-modus',
    judul: 'Statistika: Tabel, Diagram Lingkaran, Mean, Median & Modus',
    durasiBacaMenit: 10,
    isUtama: true,
    ringkasanSingkat:
      'Kuasai cara membaca diagram batang dan diagram lingkaran (persen & derajat 360°), serta menghitung rata-rata (mean), nilai tengah (median), dan data terbanyak (modus).',
    learningObjectives: [
      'Membaca informasi dan menghitung selisih atau jumlah dari tabel frekuensi dan diagram batang.',
      'Menghitung banyaknya data pada diagram lingkaran berbasis persen ($100\\%$) maupun derajat ($360^{\\circ}$).',
      'Menentukan modus (frekuensi terbesar) dan median (nilai tengah data terurut) untuk jumlah data ganjil maupun genap.',
      'Menghitung rata-rata gabungan atau mencari nilai yang hilang dari rata-rata yang diketahui.',
    ],
    units: [
      {
        unitNumber: '4.1',
        judul: 'Diagram Lingkaran (% vs Derajat 360°)',
        hook: 'Satu lingkaran penuh itu $100\\%$ atau $360^{\\circ}$—kalau ada tanda siku-siku, artinya $25\\%$ atau $90^{\\circ}$!',
        teori:
          'Untuk mengubah data pada diagram lingkaran menjadi jumlah asli: $\\text{Jumlah Ditanya} = \\frac{\\text{Bagian Ditanya}}{\\text{Bagian Diketahui}} \\times \\text{Jumlah Diketahui}$. Pastikan semua bagian berjumlah tepat $100\\%$ (jika persen) atau $360^{\\circ}$ (jika sudut).',
        pondasi:
          'Jangan lupa simbol sudut siku-siku! Jika satu juring diberi kotak sudut siku-siku tanpa angka, nilainya otomatis $90^{\\circ}$ (atau $25\\%$ dalam diagram persen).',
        jebakanTka:
          'Soal memberi angka **banyak siswa yang menyukai Basket (bukan total seluruh siswa)**, lalu bertanya banyak siswa yang menyukai Renang. Penyebut pecahannya harus **% atau derajat Basket**, BUKAN $100\\%$ atau $360^{\\circ}$!',
        contohSoal: {
          judul: 'Contoh Soal Unit 4.1',
          soal: 'Diagram lingkaran hobi siswa menunjukkan: Sepak Bola $40\\%$, Renang (sudut siku-siku), Tari $15\\%$, dan sisanya Musik. Jika total siswa 120 anak, banyak siswa yang hobi Musik adalah …',
          opsiString: 'A. 18 anak · B. 24 anak · C. 30 anak · D. 36 anak',
          jawaban: 'B',
          solusi:
            'Renang siku-siku $= 25\\%$. Persentase Musik $= 100\\% - (40\\% + 25\\% + 15\\%) = 20\\%$. Banyak siswa $= 20\\% \\times 120 = 24$ anak.',
        },
        trikCepat:
          'Cari persen sisa dulu sebelum dikalikan total siswa, agar hanya mengalikan satu kali.',
      },
      {
        unitNumber: '4.2',
        judul: 'Mean (Rata-rata), Median & Modus',
        hook: 'MODUS paling sering muncul, MEDIAN di tengah setelah DIURUTKAN, MEAN jumlah bagi banyak!',
        teori:
          'Rata-rata ($\\bar{x}$) $= \\frac{\\text{Jumlah seluruh nilai data}}{\\text{Banyak data}}$. Jika berbentuk tabel nilai dan frekuensi: kalikan dulu setiap $(\\text{Nilai} \\times \\text{Frekuensi})$, jumlahkan hasilnya, lalu bagi dengan total frekuensi.',
        pondasi:
          'Mencari Nilai yang Belum Diketahui: $\\text{Nilai Hilang} = (\\text{Rata-rata baru} \\times \\text{Banyak data baru}) - \\text{Jumlah data lama}$.',
        jebakanTka:
          'Untuk mencari MEDIAN, data **WAJIB diurutkan dari terkecil ke terbesar** terlebih dahulu! Jika banyak data genap (misal 10 data), mediannya adalah rata-rata data ke-5 dan data ke-6.',
        contohSoal: {
          judul: 'Contoh Soal Unit 4.2',
          soal: 'Rata-rata nilai ulangan 9 siswa adalah $82$. Setelah Rani mengikuti ulangan susulan, rata-rata kelas menjadi $83$. Nilai ulangan Rani adalah …',
          opsiString: 'A. 88 · B. 90 · C. 92 · D. 94',
          jawaban: 'C',
          solusi:
            'Jumlah 9 siswa $= 9 \\times 82 = 738$. Jumlah 10 siswa $= 10 \\times 83 = 830$. Nilai Rani $= 830 - 738 = 92$.',
        },
        trikCepat:
          'Trik Selisih Rata-rata: Nilai anak baru $= \\text{Rata-rata baru} + (\\text{Jumlah lama} \\times \\text{Kenaikan}) = 83 + (9 \\times 1) = 92$! Super cepat tanpa perkalian besar!',
      },
    ],
    konsepTeori: [
      {
        subjudul: 'Mengolah Data Diagram Lingkaran',
        isi: 'Gunakan perbandingan bagian ditanya per bagian diketahui. Jika diketahui total keseluruhan, penyebutnya $100\\%$ atau $360^{\\circ}$.',
        poinPenting: [
          'Sudut siku-siku $= 90^{\\circ} = 25\\%$.',
          'Setengah lingkaran $= 180^{\\circ} = 50\\%$.',
        ],
      },
      {
        subjudul: 'Ukuran Pemusatan Data (Mean, Median, Modus)',
        isi: 'Modus tidak harus dihitung rumus—cukup cari frekuensi terbanyak. Median wajib mengurutkan data terlebih dulu. Mean adalah total nilai dibagi total frekuensi.',
        poinPenting: [
          'Jumlah nilai $=$ Rata-rata $\\times$ Banyak data.',
          'Jika rata-rata bertambah $+1$ untuk 10 anak, artinya total nilai bertambah $+10$.',
        ],
      },
    ],
    trikCepat:
      'Menghitung median dari tabel frekuensi: jumlahkan frekuensinya dulu ($N$). Jika $N=25$ (ganjil), median berada di urutan ke-$(25+1)\\div 2 = 13$ pakai frekuensi kumulatif!',
    jebakanUmum:
      'Pada tabel data, siswa sering salah mengira **frekuensi terbesar** adalah modusnya! Padahal **Modus adalah NILAI atau NAMA DATA** yang punya frekuensi terbanyak itu.',
    contohSoal: [
      {
        soal: 'Data nilai Matematika 7 siswa adalah: 80, 75, 90, 85, 75, 95, 80. Median dan modus data tersebut berturut-turut adalah …',
        opsi: { A: '85 dan 75', B: '80 dan 75', C: '80 dan 75 & 80', D: '85 dan 80' },
        kunci: 'C',
        pembahasanLangkah: [
          'Urutkan data: 75, 75, 80, 80, 85, 90, 95.',
          'Data ke-4 (tengah) adalah $80$ (Median $= 80$). Nilai yang paling sering muncul adalah $75$ dan $80$ (masing-masing 2 kali).',
        ],
      },
    ],
    kuisPemahaman: [
      {
        id: 'mtk_sd_b4_q1',
        soal: 'Sebuah diagram lingkaran derajat menampilkan ekstrakurikuler 180 siswa: Pramuka $120^{\\circ}$, Paskibra $80^{\\circ}$, Tari $60^{\\circ}$, dan sisanya Futsal. Banyak siswa yang ikut Futsal adalah …',
        opsi: { A: '40 siswa', B: '50 siswa', C: '60 siswa', D: '80 siswa' },
        kunci: 'B',
        pembahasan: 'Derajat Futsal $= 360^{\\circ} - (120 + 80 + 60) = 100^{\\circ}$. Banyak siswa $= \\frac{100}{360} \\times 180 = 50$ siswa.',
      },
      {
        id: 'mtk_sd_b4_q2',
        soal: 'Diketahui data berat badan (kg): 34, 36, 35, 38, 36, 37, 35, 36, 39, 34. Median data tersebut adalah …',
        opsi: { A: '35,5 kg', B: '36 kg', C: '36,5 kg', D: '37 kg' },
        kunci: 'B',
        pembahasan: 'Urutkan 10 data: 34, 34, 35, 35, 36, 36, 36, 37, 38, 39. Data ke-5 dan ke-6 keduanya 36, maka median $= (36 + 36) \\div 2 = 36$ kg.',
      },
      {
        id: 'mtk_sd_b4_q3',
        soal: 'Data nilai ulangan IPAS: nilai 70 (4 anak), nilai 80 (6 anak), nilai 90 (5 anak), nilai 100 (5 anak). Rata-rata nilai ulangan tersebut adalah …',
        opsi: { A: '84,5', B: '85,0', C: '85,5', D: '86,0' },
        kunci: 'C',
        pembahasan: 'Total nilai $= 70(4) + 80(6) + 90(5) + 100(5) = 280 + 480 + 450 + 500 = 1.710$. Total anak $= 20$. Rata-rata $= 1.710 \\div 20 = 85{,}5$.',
      },
      {
        id: 'mtk_sd_b4_q4',
        soal: 'Rata-rata tinggi 4 pemain basket adalah $162\\text{ cm}$. Ketika seorang pemain baru masuk, rata-rata menjadi $164\\text{ cm}$. Tinggi pemain baru tersebut adalah …',
        opsi: { A: '166 cm', B: '170 cm', C: '172 cm', D: '174 cm' },
        kunci: 'C',
        pembahasan: 'Tinggi pemain baru $= 164 + (4 \\times 2) = 172\\text{ cm}$ (atau $5 \\times 164 - 4 \\times 162 = 820 - 648 = 172$).',
      },
      {
        id: 'mtk_sd_b4_q5',
        soal: 'Dari hasil survei makanan favorit: Bakso 18 siswa, Soto 12 siswa, Mie Ayam 22 siswa, Sate 8 siswa. Modus data tersebut adalah …',
        opsi: { A: '22', B: 'Mie Ayam', C: 'Bakso', D: '60' },
        kunci: 'B',
        pembahasan: 'Modus adalah kategori/data dengan frekuensi tertinggi, yaitu Mie Ayam (22 siswa).',
      },
    ],
  },
];

const BIN_SD_BAB_LIST = [
  {
    id: 'bin-sd-bab-1',
    subtestKode: 'BIN_SD',
    subtestNama: 'Bahasa Indonesia (Literasi TKA SD)',
    subtestSingkatan: 'BIN SD',
    subtestEmoji: '📖',
    subtestWarna: '#2563eb',
    subtestBgLight: '#eff6ff',
    babNumber: 1,
    slug: 'ide-pokok-kalimat-utama-fakta-tersurat',
    judul: 'Ide Pokok, Kalimat Utama & Informasi Tersurat Wacana',
    durasiBacaMenit: 10,
    isUtama: true,
    ringkasanSingkat:
      'Teknik cepat menemukan kalimat utama (deduktif/induktif), merumuskan ide pokok paragraf, serta menjawab soal informasi tersurat (5W+1H) tanpa terkecoh opini.',
    learningObjectives: [
      'Membedakan kalimat utama dengan kalimat penjelas dalam satu paragraf utuh.',
      'Menemukan ide pokok paragraf deduktif (awal), induktif (akhir), maupun campuran.',
      'Menjawab pertanyaan fakta tersurat dengan rumus ADiKSiMBa (Apa, Di mana, Kapan, Siapa, Mengapa, Bagaimana).',
    ],
    units: [
      {
        unitNumber: '1.1',
        judul: 'Kalimat Utama vs Ide Pokok',
        hook: 'Kalimat utama tinggal disalin utuh dari teks; ide pokok adalah intisari pendek dari kalimat utama!',
        teori:
          'Paragraf yang baik memiliki satu **Kalimat Utama** yang bersifat umum dan didukung beberapa **Kalimat Penjelas** yang berisi contoh, alasan, atau rincian. Letaknya paling sering di awal paragraf (deduktif) atau di akhir dengan penanda simpulan seperti "Jadi,", "Oleh karena itu,", "Dengan demikian," (induktif).',
        pondasi:
          'Ciri Kalimat Penjelas: sering memakai kata rujukan ("hal ini", "tersebut", "ia", "mereka"), kata hubung antarkalimat ("selain itu", "misalnya"), atau menyebut angka rincian.',
        jebakanTka:
          'Jika soal menanyakan **Kalimat Utama**, pilih kalimat yang lengkap dan ada persis di bacaan. Jika menanyakan **Ide Pokok / Gagasan Utama**, pilih ringkasan intinya (biasanya lebih singkat dan padat).',
        contohSoal: {
          judul: 'Contoh Soal Unit 1.1',
          soal: 'Bacalah paragraf berikut! "(1) Sampah plastik membutuhkan waktu ratusan tahun untuk terurai secara alami. (2) Di laut, serpihan plastik kerap termakan penyu dan ikan. (3) Selain itu, sampah plastik juga menyumbat saluran air hingga memicu banjir saat musim hujan. (4) Oleh karena itu, sampah plastik membawa banyak dampak buruk bagi lingkungan." Kalimat utama paragraf tersebut terdapat pada nomor …',
          opsiString: 'A. (1) · B. (2) · C. (3) · D. (4)',
          jawaban: 'D',
          solusi:
            'Kalimat (1), (2), dan (3) merinci contoh-contoh dampak plastik. Kalimat (4) menyimpulkan seluruh isi dengan kata "Oleh karena itu", sehingga paragraf ini induktif dan kalimat utamanya nomor (4).',
        },
        trikCepat:
          'Selalu cek kalimat terakhir terlebih dulu! Jika diawali kata "Jadi, / Oleh karena itu, / Dengan demikian,", besar kemungkinan kalimat utamanya di akhir!',
      },
      {
        unitNumber: '1.2',
        judul: 'Mengunci Informasi Tersurat (5W+1H)',
        hook: 'Semua jawaban soal fakta tersurat tertulis jelas di teks—jangan pernah mengarang dari pengetahuan luar!',
        teori:
          'Pertanyaan literasi SD sering menanyakan alasan (*Mengapa*), cara (*Bagaimana*), atau pernyataan yang **sesuai dengan isi teks**. Cocokkan kata kunci pertanyaan dengan kalimat yang mengandung kata kunci tersebut di wacana.',
        pondasi:
          'Waspadai kata **pengubah makna** pada pilihan ganda: "hanya", "semua", "tidak pernah", "selalu", atau pertukaran sebab-akibat.',
        jebakanTka:
          'Opsi yang bahasanya terdengar paling keren atau benar di kehidupan nyata belum tentu sesuai teks! Jawaban wajib 100% didukung kalimat dalam wacana.',
        contohSoal: {
          judul: 'Contoh Soal Unit 1.2',
          soal: 'Teks: "Wayang kulit merupakan warisan budaya yang ditetapkan UNESCO pada 7 November 2003. Kini pertunjukannya dipadukan dengan pencahayaan modern agar menarik minat generasi muda." Mengapa pertunjukan wayang kulit dipadukan dengan pencahayaan modern?',
          opsiString: 'A. Agar diakui UNESCO · B. Agar biaya pertunjukan murah · C. Agar menarik minat generasi muda · D. Agar menggantikan dalang',
          jawaban: 'C',
          solusi:
            'Kata kunci "dipadukan dengan pencahayaan modern" diikuti langsung oleh alasan "agar menarik minat generasi muda".',
        },
        trikCepat:
          'Gunakan teknik *scanning*: temukan kata kunci pertanyaan di bacaan, baca 1 kalimat sebelum dan 1 kalimat sesudahnya untuk mengunci jawaban pasti.',
      },
    ],
    konsepTeori: [
      {
        subjudul: 'Letak Kalimat Utama & Gagasan Pokok',
        isi: 'Kalimat utama bersifat umum dan merangkum kalimat penjelas. Letaknya bisa di awal (deduktif) atau akhir (induktif).',
        poinPenting: [
          'Penanda kalimat penjelas: "Hal tersebut", "Selain itu", "Contohnya".',
          'Penanda kalimat utama di akhir: "Oleh karena itu", "Jadi", "Dengan demikian".',
        ],
      },
    ],
    trikCepat:
      'Cara membedakan kalimat utama saat ragu antara kalimat 1 dan kalimat terakhir: tanya diri sendiri "mana kalimat yang menjelaskan kalimat lainnya?". Yang merangkum adalah Kalimat Utama!',
    jebakanUmum:
      'Siswa langsung mengklik kalimat pertama sebagai kalimat utama tanpa membaca kalimat terakhir yang ternyata berisi simpulan ("Jadi, ...").',
    contohSoal: [
      {
        soal: '"Menanam pohon di sekitar rumah membuat udara terasa sejuk. Akar pohon juga membantu menyerap air hujan ke dalam tanah sehingga mengurangi risiko banjir. Tak hanya itu, rimbunnya daun dapat menjadi tempat berteduh burung." Ide pokok paragraf tersebut adalah …',
        opsi: {
          A: 'Cara menanam pohon di rumah',
          B: 'Manfaat menanam pohon di sekitar rumah',
          C: 'Penyebab utama terjadinya banjir',
          D: 'Jenis burung yang tinggal di pohon',
        },
        kunci: 'B',
        pembahasanLangkah: [
          'Kalimat (1), (2), dan (3) seluruhnya membahas kegunaan/manfaat pohon (menyejukkan udara, menyerap air, tempat burung berteduh).',
          'Jadi ide pokok yang merangkum seluruhnya adalah Manfaat menanam pohon di sekitar rumah.',
        ],
      },
    ],
    kuisPemahaman: [
      {
        id: 'bin_sd_b1_q1',
        soal: 'Kalimat yang berisi gagasan umum dan menjadi dasar pengembangan suatu paragraf disebut …',
        opsi: { A: 'Kalimat penjelas', B: 'Kalimat utama', C: 'Kalimat majemuk', D: 'Kalimat pelengkap' },
        kunci: 'B',
        pembahasan: 'Kalimat utama memuat gagasan pokok yang dijelaskan oleh kalimat-kalimat penjelas.',
      },
      {
        id: 'bin_sd_b1_q2',
        soal: '"Sarapan pagi memberi energi bagi otak untuk berkonsentrasi di sekolah. Anak yang rutin sarapan cenderung lebih bugar dan tidak mudah mengantuk. Selain itu, sarapan mencegah nyeri lambung saat belajar." Gagasan utama paragraf tersebut adalah …',
        opsi: {
          A: 'Penyebab nyeri lambung pada siswa',
          B: 'Manfaat sarapan pagi bagi anak sekolah',
          C: 'Menu sarapan sehat untuk pelajar',
          D: 'Alasan anak mengantuk di kelas',
        },
        kunci: 'B',
        pembahasan: 'Ketiga kalimat menjelaskan berbagai manfaat sarapan pagi bagi siswa.',
      },
      {
        id: 'bin_sd_b1_q3',
        soal: 'Manakah ciri yang paling sering menandai sebuah KALIMAT PENJELAS?',
        opsi: {
          A: 'Berisi simpulan dengan kata "Oleh karena itu"',
          B: 'Memuat kata rujukan seperti "hal tersebut" atau contoh rincian',
          C: 'Selalu diletakkan di bagian paling akhir paragraf',
          D: 'Berdiri sendiri tanpa memerlukan kalimat lain',
        },
        kunci: 'B',
        pembahasan: 'Kalimat penjelas merujuk balik ke kalimat utama ("hal tersebut", "selain itu") atau memaparkan contoh spesifik.',
      },
      {
        id: 'bin_sd_b1_q4',
        soal: 'Paragraf yang kalimat utamanya terletak di akhir paragraf disebut paragraf …',
        opsi: { A: 'Deduktif', B: 'Induktif', C: 'Naratif', D: 'Persuasif' },
        kunci: 'B',
        pembahasan: 'Deduktif = di awal (Depan); Induktif = di akhir; Campuran = di awal dan ditegaskan ulang di akhir.',
      },
      {
        id: 'bin_sd_b1_q5',
        soal: '"Bunglon mampu mengubah warna kulitnya menyerupai lingkungan sekitar untuk mengelabui pemangsa. Kemampuan ini disebut mimikri." Berdasarkan teks, tujuan utama bunglon melakukan mimikri adalah …',
        opsi: {
          A: 'Menarik perhatian pasangan',
          B: 'Menghangatkan suhu tubuh',
          C: 'Mengelabui pemangsa',
          D: 'Mencari makanan di malam hari',
        },
        kunci: 'C',
        pembahasan: 'Informasi tersurat secara jelas tertulis: "...untuk mengelabui pemangsa".',
      },
    ],
  },
  {
    id: 'bin-sd-bab-2',
    subtestKode: 'BIN_SD',
    subtestNama: 'Bahasa Indonesia (Literasi TKA SD)',
    subtestSingkatan: 'BIN SD',
    subtestEmoji: '📖',
    subtestWarna: '#2563eb',
    subtestBgLight: '#eff6ff',
    babNumber: 2,
    slug: 'makna-kata-simpulan-fakta-opini',
    judul: 'Makna Kata, Simpulan Paragraf, Sinonim-Antonim & Fakta-Opini',
    durasiBacaMenit: 10,
    isUtama: true,
    ringkasanSingkat:
      'Taklukkan soal makna kata istilah (KBBI kontekstual), sinonim-antonim, menyimpulkan teks dengan tepat, dan membedakan pernyataan fakta vs opini penulis.',
    learningObjectives: [
      'Menentukan makna kata/istilah sulit berdasarkan konteks kalimat di dalam teks.',
      'Menemukan sinonim (persamaan kata) dan antonim (lawan kata) sesuai konteks bacaan.',
      'Membedakan kalimat fakta (terbukti data/kejadian nyata) dengan kalimat opini (pendapat/saran).',
      'Membuat simpulan atau prediksi kejadian logis dari isi bacaan.',
    ],
    units: [
      {
        unitNumber: '2.1',
        judul: 'Makna Kata Kontekstual, Sinonim & Antonim',
        hook: 'Kalau tidak hafal arti sebuah kata sulit, coba tutup kata itu lalu ganti dengan pilihan jawabannya satu per satu!',
        teori:
          'Dalam TKA SD, kosakata populer sering muncul dari bidang lingkungan dan sains dasar seperti *reboisasi* (penghijauan kembali), *erosi* (pengikisan tanah), *abrasi* (pengikisan pantai), *ekosistem*, *habitat*, *inovasi*, dan *komoditas*.',
        pondasi:
          'Sinonim $=$ persamaan arti kata (misal: *flora* = tumbuhan, *fauna* = hewan, *akurat* = tepat/cermat). Antonim $=$ lawan kata (misal: *pro* $\\leftrightarrow$ *kontra*, *ekspor* $\\leftrightarrow$ *impor*, *optimistis* $\\leftrightarrow$ *pesimistis*).',
        jebakanTka:
          'Satu kata bisa memiliki makna berbeda tergantung kalimatnya! Misal kata *menggeluti* bisa berarti bergulat fisik atau menekuni bidang pekerjaan.',
        contohSoal: {
          judul: 'Contoh Soal Unit 2.1',
          soal: '"Untuk mencegah abrasi di pesisir pantai, warga menanam ribuan bibit bakau." Makna kata *abrasi* pada kalimat tersebut adalah …',
          opsiString: 'A. Penanaman pohon di hutan · B. Pengikisan pantai oleh gelombang air laut · C. Pencemaran air sungai · D. Kenaikan suhu bumi',
          jawaban: 'B',
          solusi:
            'Kata kunci "di pesisir pantai" mengarah langsung ke pengikisan pantai/daratan oleh gelombang atau arus air laut.',
        },
        trikCepat:
          'Gunakan teknik substitusi: masukkan setiap opsi jawaban ke dalam kalimat soal. Pilihan yang membuat kalimat tetap logis dan nyambung adalah pemenangnya!',
      },
      {
        unitNumber: '2.2',
        judul: 'Membedakan Fakta vs Opini & Menyimpulkan Teks',
        hook: 'FAKTA bisa dicek benar-salahnya dengan data/pancaindra; OPINI berisi penilaian rasa, dugaan, atau saran!',
        teori:
          'Kalimat Fakta mengandung angka, tanggal, lokasi nyata, atau peristiwa yang benar-benar terjadi. Kalimat Opini ditandai kata subjektif seperti *sebaiknya, seharusnya, menurutku, sangat indah, paling enak, mungkin, diperkirakan*.',
        pondasi:
          'Simpulan yang baik harus mencakup **keseluruhan** isi paragraf secara ringkas (bukan hanya mencomot satu kalimat saja) dan tidak menambah fakta baru yang bertentangan.',
        jebakanTka:
          'Kalimat berita yang berisi kutipan pendapat orang ("Menurut Kepala Desa, pasar baru sebaiknya...") tetap tergolong **opini** atau kutipan pendapat, kecuali jika menjelaskan kejadian yang sudah terjadi.',
        contohSoal: {
          judul: 'Contoh Soal Unit 2.2',
          soal: 'Perhatikan kalimat berikut! (1) Indonesia memiliki lebih dari 17.000 pulau. (2) Pulau Bali merupakan pulau terindah di dunia untuk dikunjungi. (3) Suhu puncak gunung pagi ini tercatat 12°C. (4) Sebaiknya wisatawan membawa jaket tebal saat mendaki. Kalimat fakta ditunjukkan nomor …',
          opsiString: 'A. (1) dan (2) · B. (1) dan (3) · C. (2) dan (4) · D. (3) dan (4)',
          jawaban: 'B',
          solusi:
            '(1) dan (3) memuat data terukur (17.000 pulau dan 12°C). Sedangkan (2) memakai penilaian "terindah" dan (4) memakai saran "sebaiknya", sehingga keduanya opini.',
        },
        trikCepat:
          'Lingkari kata sifat subjektif (*indah, lezat, bagus*) dan kata ajakan (*sebaiknya, hendaknya*). Begitu ketemu, langsung coret dari kandidat Fakta!',
      },
    ],
    konsepTeori: [
      {
        subjudul: 'Fakta vs Opini',
        isi: 'Fakta bersifat objektif (angka, tanggal, kejadian nyata), sedangkan Opini bersifat subjektif (penilaian rasa, harapan, dugaan).',
        poinPenting: [
          'Penanda Opini: *sebaiknya, mungkin, diperkirakan, paling bagus, sangat menarik*.',
          'Penanda Fakta: angka eksak, tahun, tempat resmi, peristiwa teramati.',
        ],
      },
    ],
    trikCepat:
      'Memilih simpulan paragraf: cari opsi yang menggabungkan **Kalimat Utama + Inti penting dari kalimat penjelas** dengan bahasa baru yang netral.',
    jebakanUmum:
      'Terkecoh memilih opini yang kelihatan "seperti fakta" padahal mengandung kata penilaian seperti *terbaik*, *terfavorit*, atau *paling nyaman*.',
    contohSoal: [
      {
        soal: '"Para petani di desa mulai beralih menggunakan pupuk organik karena selain ramah lingkungan, pupuk ini juga menyuburkan tanah dalam jangka panjang." Simpulan paragraf tersebut adalah …',
        opsi: {
          A: 'Pupuk kimia lebih mahal daripada pupuk organik',
          B: 'Pupuk organik dipilih petani karena ramah lingkungan dan menyuburkan tanah',
          C: 'Semua petani desa wajib membuat pupuk sendiri',
          D: 'Tanah desa tidak lagi subur akibat hama',
        },
        kunci: 'B',
        pembahasanLangkah: [
          'Simpulan wajib merangkum alasan petani memilih pupuk organik sesuai teks.',
          'Opsi A, C, D mengandung asumsi di luar teks ("lebih mahal", "wajib", "hama"). Hanya B yang 100% sesuai.',
        ],
      },
    ],
    kuisPemahaman: [
      {
        id: 'bin_sd_b2_q1',
        soal: '"Penebangan liar di lereng gunung memicu terjadinya *erosi* saat hujan deras." Makna kata *erosi* adalah …',
        opsi: {
          A: 'Pengikisan lapisan tanah oleh air atau angin',
          B: 'Pembakaran hutan secara sengaja',
          C: 'Penghijauan kembali lahan gundul',
          D: 'Pendangkalan dasar laut akibat sampah',
        },
        kunci: 'A',
        pembahasan: 'Erosi adalah pengikisan permukaan tanah oleh air hujan, aliran sungai, atau angin. (Penghijauan = reboisasi).',
      },
      {
        id: 'bin_sd_b2_q2',
        soal: 'Antonim (lawan kata) dari kata *hemat* dalam kalimat "Keluarga Pak Ali hidup dengan sangat hemat" adalah …',
        opsi: { A: 'Cermat', B: 'Boros', C: 'Sederhana', D: 'Pelit' },
        kunci: 'B',
        pembahasan: 'Lawan kata hemat adalah boros.',
      },
      {
        id: 'bin_sd_b2_q3',
        soal: 'Manakah yang merupakan kalimat FAKTA?',
        opsi: {
          A: 'Bakso Pak Kumis rasanya paling enak se-kecamatan.',
          B: 'Sebaiknya siswa tidur delapan jam setiap malam.',
          C: 'Upacara Hari Kemerdekaan dilaksanakan setiap tanggal 17 Agustus.',
          D: 'Tahun depan mungkin jumlah wisatawan meningkat pesat.',
        },
        kunci: 'C',
        pembahasan: '17 Agustus adalah fakta objektif yang pasti. Kata "paling enak", "sebaiknya", dan "mungkin" adalah ciri opini.',
      },
      {
        id: 'bin_sd_b2_q4',
        soal: '"Tim peneliti berupaya *menciptakan* teknologi ramah lingkungan." Sinonim kata *menciptakan* yang paling tepat adalah …',
        opsi: { A: 'Meniru', B: 'Menggunakan', C: 'Menghasilkan', D: 'Membeli' },
        kunci: 'C',
        pembahasan: 'Sinonim menciptakan = membuat, menghasilkan, atau merancang sesuatu yang baru.',
      },
      {
        id: 'bin_sd_b2_q5',
        soal: '"Banyak anak kurang menyukai sayur karena rasanya pahit. Padahal, sayur kaya akan serat dan vitamin yang menjaga daya tahan tubuh." Prediksi yang terjadi jika anak rutin mengonsumsi sayur adalah …',
        opsi: {
          A: 'Daya tahan tubuh anak menjadi lebih terjaga',
          B: 'Anak akan kekurangan vitamin',
          C: 'Semua sayur berubah menjadi manis',
          D: 'Anak tidak perlu lagi minum air putih',
        },
        kunci: 'A',
        pembahasan: 'Berdasarkan teks, sayur kaya serat & vitamin untuk menjaga daya tahan tubuh.',
      },
    ],
  },
  {
    id: 'bin-sd-bab-3',
    subtestKode: 'BIN_SD',
    subtestNama: 'Bahasa Indonesia (Literasi TKA SD)',
    subtestSingkatan: 'BIN SD',
    subtestEmoji: '📖',
    subtestWarna: '#2563eb',
    subtestBgLight: '#eff6ff',
    babNumber: 3,
    slug: 'teks-sastra-fabel-unsur-intrinsik-pantun-puisi',
    judul: 'Sastra Anak: Unsur Intrinsik Fabel/Cerpen, Amanat, Puisi & Pantun',
    durasiBacaMenit: 10,
    isUtama: true,
    ringkasanSingkat:
      'Analisis watak tokoh, latar, konflik, amanat cerita fabel/cerpen anak, ungkapan/peribahasa, ciri pantun bersajak a-b-a-b, dan majas dasar dalam puisi.',
    learningObjectives: [
      'Mengidentifikasi watak tokoh, latar (tempat, waktu, suasana), serta konflik dalam teks fiksi/fabel.',
      'Menemukan keteladanan tokoh dan amanat (pesan moral) cerita.',
      'Menafsirkan arti ungkapan (idiom), peribahasa, dan makna kias dalam puisi anak.',
      'Menentukan isi dan melengkapi baris rima pantun sesuai kaidah a-b-a-b dan 8–12 suku kata.',
    ],
    units: [
      {
        unitNumber: '3.1',
        judul: 'Unsur Intrinsik Fabel & Amanat Cerita',
        hook: 'Watak tokoh bisa dilihat dari tindakan, ucapan, maupun sikapnya menghadapi masalah!',
        teori:
          'Dalam cerita anak atau fabel (cerita binatang bertingkah seperti manusia), unsur intrinsik meliputi: Tokoh & Watak (protagonis baik, antagonis jahat/licik), Latar (tempat, waktu, suasana), Alur & Konflik (masalah utama cerita), serta Amanat (pesan moral yang ingin disampaikan penulis).',
        pondasi:
          'Amanat selalu berbentuk ajaran kebaikan yang relevan dengan konflik tokoh (misalnya: "Jangan sombong", "Tolong-menolong tanpa pilih kasih", "Jujur membawa keberuntungan").',
        jebakanTka:
          'Jangan membingungkan **Keteladanan Tokoh** dengan **Watak Tokoh**! Jika ditanya keteladanan, pilih sikap baik tokoh yang pantas ditiru (bukan sifat buruknya).',
        contohSoal: {
          judul: 'Contoh Soal Unit 3.1',
          soal: 'Kutipan Fabel: "Kancil mengejek Kura-kura yang berjalan lambat. Saat lomba lari dimulai, Kancil berlari cepat lalu tertidur di bawah pohon karena merasa pasti menang. Akhirnya, Kura-kura terus melangkah pelan hingga menyentuh garis finis lebih dulu." Amanat cerita tersebut adalah …',
          opsiString: 'A. Tidurlah saat lomba berlangsung · B. Jangan meremehkan orang lain dan bersikap sombong · C. Larilah secepat mungkin setiap hari · D. Kura-kura selalu lebih cepat dari Kancil',
          jawaban: 'B',
          solusi:
            'Kancil kalah akibat kesombongan dan meremehkan Kura-kura. Jadi amanatnya agar kita tidak sombong dan tidak meremehkan kemampuan orang lain.',
        },
        trikCepat:
          'Cari penyebab tokoh mendapat akibat buruk atau baik di akhir cerita—itulah inti amanatnya!',
      },
      {
        unitNumber: '3.2',
        judul: 'Pantun, Puisi, Ungkapan & Peribahasa',
        hook: 'Di pantun, baris 1-2 hanyalah SAMPIRAN; pesan sebenarnya selalu ada di baris 3-4 (ISI)!',
        teori:
          'Pantun memiliki 4 baris bersajak akhir **a-b-a-b** (bunyi akhir baris 1 sama dengan baris 3, baris 2 sama dengan baris 4). Ungkapan (*idiom*) adalah gabungan kata bermakna baru seperti *buah tangan* (oleh-oleh), *ringan tangan* (suka menolong), *panjang tangan* (suka mencuri), *banting tulang* (bekerja keras).',
        pondasi:
          'Majas Dasar SD: (1) **Personifikasi**: benda mati berperilaku seperti manusia (*angin berbisik, ombak menari*). (2) **Hiperbola**: melebih-lebihkan (*suaranya menggelegar membelah langit*). (3) **Metafora**: perbandingan langsung (*raja siang* = matahari, *dewi malam* = bulan).',
        jebakanTka:
          'Saat melengkapi baris pantun yang rumpang, perhatikan DUA hal: (1) rima akhiran bunyi harus cocok (a-b-a-b), dan (2) isi baris ke-3 & ke-4 harus nyambung maknanya!',
        contohSoal: {
          judul: 'Contoh Soal Unit 3.2',
          soal: 'Bacalah pantun berikut!\nJalan-jalan ke Kota Batu,\nMembeli apel manis rasanya.\n...,\nAgar kelak sukses hidupnya.\nKalimat yang tepat untuk melengkapi baris ketiga pantun adalah …',
          opsiString: 'A. Jangan lupa membawa buku · B. Rajin-rajinlah menuntut ilmu · C. Ayo bermain sepanjang waktu · D. Makan buah sehat selalu',
          jawaban: 'B',
          solusi:
            'Baris ke-1 berakhir bunyi "-tu", maka baris ke-3 juga harus berakhiran "-tu" atau rima "-u", serta maknanya nyambung dengan baris ke-4 ("Agar kelak sukses hidupnya"). Paling tepat dan berima adalah "Rajin-rajinlah menuntut ilmu".',
        },
        trikCepat:
          'Cek rima vokal terakhir lebih dulu! Pilihan yang rimanya melenceng dari pola a-b-a-b bisa langsung dicoret.',
      },
    ],
    konsepTeori: [
      {
        subjudul: 'Unsur Intrinsik & Ungkapan Penting SD',
        isi: 'Pahami watak, konflik, dan amanat cerita fiksi/fabel, serta hafalkan ungkapan populer SD.',
        poinPenting: [
          '*Tinggi hati* = sombong; *rendah hati* = tidak sombong.',
          '*Kambing hitam* = pihak yang dipersalahkan; *kepala dingin* = tenang/sabar.',
        ],
      },
    ],
    trikCepat:
      'Saat mencari makna kalimat dalam puisi yang mengandung majas, terjemahkan kata kiasnya ke arti sebenarnya (misal *pelita bangsa* = guru/penerang ilmu).',
    jebakanUmum:
      'Tertukar antara *rendah hati* (baik/tidak sombong) dengan *rendah diri* (minder/kurang percaya diri)!',
    contohSoal: [
      {
        soal: 'Pak Tani tetap *banting tulang* di sawah meski terik matahari menyengat demi biaya sekolah anaknya. Makna ungkapan *banting tulang* adalah …',
        opsi: { A: 'Mengalami patah tulang', B: 'Bekerja keras sekuat tenaga', C: 'Bermalas-malasan', D: 'Beristirahat di gubuk' },
        kunci: 'B',
        pembahasanLangkah: [
          'Ungkapan "banting tulang" berarti bekerja keras membanting tenaga demi mencapai sesuatu.',
        ],
      },
    ],
    kuisPemahaman: [
      {
        id: 'bin_sd_b3_q1',
        soal: 'Meskipun menjadi juara kelas, Dina tetap bersikap *rendah hati* kepada semua temannya. Arti ungkapan *rendah hati* adalah …',
        opsi: { A: 'Minder atau tidak percaya diri', B: 'Tidak sombong', C: 'Suka menolong', D: 'Pemalu' },
        kunci: 'B',
        pembahasan: 'Rendah hati = tidak sombong; rendah diri = minder; tinggi hati = sombong.',
      },
      {
        id: 'bin_sd_b3_q2',
        soal: '"Daun-daun kelapa melambai-lambai memanggil angin senja." Majas yang digunakan pada kalimat puisi tersebut adalah …',
        opsi: { A: 'Hiperbola', B: 'Personifikasi', C: 'Metafora', D: 'Asosiasi' },
        kunci: 'B',
        pembahasan: 'Benda mati/tumbuhan ("daun") diberi sifat manusia ("melambai-lambai memanggil") adalah majas Personifikasi.',
      },
      {
        id: 'bin_sd_b3_q3',
        soal: 'Ciri utama pola rima akhir pada sebuah pantun adalah …',
        opsi: { A: 'a-a-a-a', B: 'a-a-b-b', C: 'a-b-a-b', D: 'a-b-b-a' },
        kunci: 'C',
        pembahasan: 'Pantun bersajak silang a-b-a-b (berbeda dengan syair yang bersajak a-a-a-a).',
      },
      {
        id: 'bin_sd_b3_q4',
        soal: 'Pesan moral yang ingin disampaikan pengarang kepada pembaca melalui sebuah cerita disebut …',
        opsi: { A: 'Latar', B: 'Alur', C: 'Amanat', D: 'Tema' },
        kunci: 'C',
        pembahasan: 'Amanat adalah pesan moral; tema adalah ide dasar cerita; latar adalah tempat/waktu/suasana.',
      },
      {
        id: 'bin_sd_b3_q5',
        soal: '"Bagai air di daun talas." Arti peribahasa tersebut adalah …',
        opsi: {
          A: 'Orang yang teguh pendiriannya',
          B: 'Orang yang tidak tetap pendiriannya (selalu berubah-ubah)',
          C: 'Sangat dermawan dan suka berbagi',
          D: 'Dua orang yang sangat kompak',
        },
        kunci: 'B',
        pembahasan: 'Air di atas daun talas selalu bergoyang/menggelinding tidak menetap, melambangkan sifat plin-plan/tidak tetap pendirian.',
      },
    ],
  },
  {
    id: 'bin-sd-bab-4',
    subtestKode: 'BIN_SD',
    subtestNama: 'Bahasa Indonesia (Literasi TKA SD)',
    subtestSingkatan: 'BIN SD',
    subtestEmoji: '📖',
    subtestWarna: '#2563eb',
    subtestBgLight: '#eff6ff',
    babNumber: 4,
    slug: 'kaidah-eyd-kalimat-efektif-teks-fungsional',
    judul: 'Kaidah EYD V, Kata Baku, Kalimat Efektif & Teks Fungsional',
    durasiBacaMenit: 10,
    isUtama: true,
    ringkasanSingkat:
      'Kuasai penggunaan huruf kapital & tanda baca sesuai EYD V, memperbaiki kalimat tidak efektif (mubazir), kata baku vs tidak baku, serta membaca poster, petunjuk pemakaian & pidato.',
    learningObjectives: [
      'Menerapkan huruf kapital pada nama orang, hari/bulan, geografi, sapaan, dan judul karangan.',
      'Membedakan kata depan "di" (pisah) dengan imbuhan "di-" (serangkai).',
      'Memperbaiki kalimat boros/mubazir menjadi kalimat efektif dan memakai kata baku KBBI.',
      'Memahami isi teks prosedur (petunjuk penggunaan), iklan/poster, dan melengkapi teks pidato.',
    ],
    units: [
      {
        unitNumber: '4.1',
        judul: 'Huruf Kapital, Tanda Baca & Penulisan "di" (EYD V)',
        hook: 'Jangan tulis "di sekolah" digabung atau "dimakan" dipisah—cek apakah menunjukkan TEMPAT atau KATA KERJA!',
        teori:
          'Jika setelah "di" diikuti kata tempat/arah/waktu (*di rumah, di atas, di Bandung*), tulis **terpisah**. Jika merupakan imbuhan kata kerja pasif (*ditulis, dimakan, dibawa*), tulis **serangkai**. Huruf kapital dipakai untuk awal kalimat, nama orang, nama geografi yang diikuti nama diri (*Gunung Merapi, Danau Toba*), nama hari/bulan (*Senin, Agustus*), dan gelar yang diikuti nama.',
        pondasi:
          'Aturan Judul Karangan: Semua kata diawali huruf kapital KECUALI kata tugas di tengah judul seperti *di, ke, dari, dan, yang, untuk, pada, dalam*.',
        jebakanTka:
          'Kata "jeruk bali", "kacang bogor", "gula jawa", atau "kunci inggris" yang menunjukkan **jenis barang** TIDAK menggunakan huruf kapital! Tapi "Kota Bogor" atau "Provinsi Jawa Barat" pakai kapital.',
        contohSoal: {
          judul: 'Contoh Soal Unit 4.1',
          soal: 'Manakah penulisan kalimat berikut yang paling tepat sesuai kaidah EYD V?',
          opsiString: 'A. Ibu membeli jeruk Bali di Pasar Baru. · B. Ibu membeli jeruk bali di pasar baru. · C. Ibu membeli jeruk bali di Pasar Baru. · D. ibu membeli Jeruk Bali di pasar Baru.',
          jawaban: 'C',
          solusi:
            '"jeruk bali" adalah nama jenis buah (huruf kecil), sedangkan "Pasar Baru" adalah nama tempat khusus (kapital). Maka C paling tepat.',
        },
        trikCepat:
          'Uji "di": coba ubah "di" menjadi "me-". Kalau bisa jadi kata kerja aktif (*dimakan* $\\rightarrow$ *memakan*), berarti imbuhan $\\rightarrow$ TULIS SERANGKAI!',
      },
      {
        unitNumber: '4.2',
        judul: 'Kata Baku, Kalimat Efektif & Teks Prosedur/Pidato',
        hook: 'Kalimat efektif = hemat kata, tidak ganda (*para siswa-siswa* salah!), dan strukturnya jelas (S-P)!',
        teori:
          'Hindari pemborosan kata: "agar supaya", "sangat indah sekali", "para hadirin sekalian", "demi untuk", "banyak anak-anak". Pilih salah satu! Selain itu, pahami teks fungsional seperti urutan acak petunjuk alat (*teks prosedur*) dan bagian pembuka/isi/penutup *teks pidato*.',
        pondasi:
          'Daftar Kata Baku Langganan TKA SD: *apotek* (bukan apotik), *praktik* (bukan praktek), *nasihat* (bukan nasehat), *ijazah* (bukan ijasah), *kreativitas* (bukan kreatifitas), *aktivitas*, *jadwal*, *sistem*, *izin*.',
        jebakanTka:
          'Kata tanya + tidak baku: *kwalitas* (salah) $\\rightarrow$ *kualitas*; *analisa* (salah) $\\rightarrow$ *analisis*; *merubah* (salah) $\\rightarrow$ *mengubah*; *di mana* vs *yang mana* jangan dipakai sebagai penghubung di tengah kalimat pernyataan.',
        contohSoal: {
          judul: 'Contoh Soal Unit 4.2',
          soal: 'Perhatikan kalimat tidak efektif berikut: "Para hadirin sekalian dimohon agar supaya segera duduk di kursinya masing-masing." Perbaikan menjadi kalimat efektif adalah …',
          opsiString: 'A. Hadirin sekalian dimohon agar supaya duduk di kursinya. · B. Para hadirin dimohon segera duduk di kursinya. · C. Hadirin dimohon segera duduk di kursinya masing-masing. · D. Para hadirin semua dimohon duduk segera.',
          jawaban: 'C',
          solusi:
            '"Hadirin" sudah bermakna jamak (semua orang yang hadir), sehingga tidak perlu "para" maupun "sekalian". Dan "agar supaya" diganti cukup "agar" atau langsung "segera".',
        },
        trikCepat:
          'Cek kata ulang jamak! Begitu melihat "para ...-..." atau "banyak ...-..." atau "sangat ... sekali", langsung eliminasi karena pasti boros/tidak efektif!',
      },
    ],
    konsepTeori: [
      {
        subjudul: 'EYD V & Kalimat Efektif',
        isi: 'Pisahkan kata depan penunjuk tempat (*di pasar, ke sekolah*) dan gabungkan imbuhan kerja pasif (*ditulis, kepergian*). Pastikan tidak ada kata bermakna ganda.',
        poinPenting: [
          'Kata baku: *apotek, praktik, nasihat, kreativitas, aktivitas, analisis, mengubah*.',
          'Hindari: *para siswa-siswa*, *agar supaya*, *sangat cantik sekali*.',
        ],
      },
    ],
    trikCepat:
      'Mengurutkan kalimat acak teks petunjuk/prosedur: cari **langkah awal** (biasanya membuka kemasan / mencolokkan kabel / menyiapkan bahan), lalu cocokkan nomor urutan akhir yang menutup alat/menyajikan hasil.',
    jebakanUmum:
      'Menulis *kreatifitas* atau *aktifitas* karena mengikuti bunyi ucapan. Dalam KBBI, akhiran serapan baku menggunakan **-vitas** (*kreativitas, aktivitas, efektivitas*).',
    contohSoal: [
      {
        soal: 'Manakah kelompok kata baku seluruhnya sesuai KBBI?',
        opsi: {
          A: 'apotik, praktek, ijasah',
          B: 'apotek, praktik, ijazah',
          C: 'apotek, praktek, nasehat',
          D: 'apotik, nasihat, kreatifitas',
        },
        kunci: 'B',
        pembahasanLangkah: [
          'Bentuk bakunya adalah apotek, praktik, ijazah, nasihat, kreativitas.',
        ],
      },
    ],
    kuisPemahaman: [
      {
        id: 'bin_sd_b4_q1',
        soal: 'Penulisan judul karangan yang tepat sesuai kaidah EYD V adalah …',
        opsi: {
          A: 'Wisata Seru Di Pulau Bali',
          B: 'Wisata Seru di Pulau Bali',
          C: 'Wisata seru di pulau Bali',
          D: 'Wisata Seru Di pulau Bali',
        },
        kunci: 'B',
        pembahasan: 'Kata depan "di" di tengah judul ditulis dengan huruf kecil; kata lainnya memakai huruf kapital awal.',
      },
      {
        id: 'bin_sd_b4_q2',
        soal: 'Manakah kalimat berikut yang merupakan KALIMAT EFEKTIF?',
        opsi: {
          A: 'Banyak anak-anak bermain layang-layang di lapangan.',
          B: 'Pemandangan di puncak gunung itu sangat indah sekali.',
          C: 'Siswa kelas enam mengikuti ujian praktik dengan tertib.',
          D: 'Kepada Bapak Kepala Sekolah waktu dan tempat kami persilakan.',
        },
        kunci: 'C',
        pembahasan: 'Opsi A boros ("banyak anak-anak"), B boros ("sangat ... sekali"), D rancu ("waktu dan tempat kami persilakan" seharusnya "Bapak Kepala Sekolah kami persilakan menyampaikan sambutan").',
      },
      {
        id: 'bin_sd_b4_q3',
        soal: '"Paman membeli obat di ... setelah mendapatkan ... dari dokter." Kata baku yang tepat untuk melengkapi kalimat tersebut adalah …',
        opsi: {
          A: 'apotik, nasehat',
          B: 'apotek, nasihat',
          C: 'apotik, nasihat',
          D: 'apotek, nasehat',
        },
        kunci: 'B',
        pembahasan: 'Bentuk baku dalam KBBI adalah "apotek" dan "nasihat".',
      },
      {
        id: 'bin_sd_b4_q4',
        soal: 'Manakah penggunaan kata berimbuhan "di-" yang benar (ditulis serangkai)?',
        opsi: {
          A: 'Buku itu diletakkan dimeja guru.',
          B: 'Adik belajar diruang tamu.',
          C: 'Soal matematika itu dikerjakan dengan teliti.',
          D: 'Ayah baru saja pulang dari kantor disore hari.',
        },
        kunci: 'C',
        pembahasan: '"dikerjakan" adalah kata kerja pasif (bisa diubah menjadi mengerjakan), maka ditulis serangkai. "di meja", "di ruang", "di sore" adalah penunjuk tempat/waktu dan wajib dipisah.',
      },
      {
        id: 'bin_sd_b4_q5',
        soal: 'Cermati petunjuk menyalakan kipas angin berikut:\n(1) Tekan tombol kecepatan 1, 2, atau 3.\n(2) Pastikan steker tertancap pada stopkontak.\n(3) Letakkan kipas angin di permukaan yang rata.\n(4) Arahkan kepala kipas sesuai keinginan.\nUrutan pemakaian yang tepat adalah …',
        opsi: {
          A: '(3)-(2)-(1)-(4)',
          B: '(2)-(3)-(4)-(1)',
          C: '(3)-(1)-(2)-(4)',
          D: '(1)-(2)-(3)-(4)',
        },
        kunci: 'A',
        pembahasan: 'Langkah aman dimulai dari meletakkan di permukaan rata (3), menancapkan steker (2), menekan tombol kecepatan (1), lalu mengarahkan kepala kipas (4).',
      },
    ],
  },
];

export const DAFTAR_SUBTES_SD = [
  {
    kode: 'MTK_SD',
    nama: 'Matematika (Numerasi)',
    singkatan: 'MTK SD',
    emoji: '🔢',
    warna: '#0d9488',
    bgLight: '#f0fdfa',
    deskripsi: 'Operasi Bilangan, Pecahan, FPB/KPK, Kecepatan & Debit, Geometri, serta Statistika Data TKA SD.',
    isUtama: true,
    babList: MTK_SD_BAB_LIST,
  },
  {
    kode: 'BIN_SD',
    nama: 'Bahasa Indonesia (Literasi)',
    singkatan: 'BIN SD',
    emoji: '📖',
    warna: '#2563eb',
    bgLight: '#eff6ff',
    deskripsi: 'Ide Pokok, Fakta Tersurat, Makna Kata, Fakta vs Opini, Sastra Fabel/Pantun, dan Kaidah EYD V.',
    isUtama: true,
    babList: BIN_SD_BAB_LIST,
  },
];

export const SEMUA_BAB_SD = [...MTK_SD_BAB_LIST, ...BIN_SD_BAB_LIST];

export function getSubtestSdByKode(kode) {
  const k = String(kode || '').toUpperCase();
  return DAFTAR_SUBTES_SD.find((s) => s.kode === k) || null;
}

export function getBabSdBySlug(subtestKode, babSlug) {
  const k = String(subtestKode || '').toUpperCase();
  const sub = DAFTAR_SUBTES_SD.find((s) => s.kode === k);
  if (sub) {
    return sub.babList.find((b) => b.slug === babSlug) || null;
  }
  return SEMUA_BAB_SD.find((b) => b.slug === babSlug) || null;
}

export function getBabSdTetangga(subtestKode, babSlug) {
  const k = String(subtestKode || '').toUpperCase();
  const sub = DAFTAR_SUBTES_SD.find((s) => s.kode === k);
  const list = sub ? sub.babList : SEMUA_BAB_SD;
  const idx = list.findIndex((b) => b.slug === babSlug);
  return {
    prevBab: idx > 0 ? list[idx - 1] : null,
    nextBab: idx < list.length - 1 ? list[idx + 1] : null,
  };
}

export function hitungStatistikModulSdSiswa(studentId) {
  const sid = studentId || 'siswa_sd_default';
  const storageKeySelesai = `gemilang_modul_sd_selesai_${sid}`;
  let babSelesaiArr = [];
  try {
    const raw = localStorage.getItem(storageKeySelesai);
    if (raw) babSelesaiArr = JSON.parse(raw);
  } catch {
    babSelesaiArr = [];
  }

  const totalBab = SEMUA_BAB_SD.length;
  const selesaiCount = babSelesaiArr.length;
  const persen = totalBab > 0 ? Math.round((selesaiCount / totalBab) * 100) : 0;

  const perSubtest = {};
  DAFTAR_SUBTES_SD.forEach((sub) => {
    const subBabIds = sub.babList.map((b) => b.id);
    const subSelesai = subBabIds.filter((id) => babSelesaiArr.includes(id)).length;
    perSubtest[sub.kode] = {
      selesai: subSelesai,
      total: sub.babList.length,
      persen: sub.babList.length > 0 ? Math.round((subSelesai / sub.babList.length) * 100) : 0,
    };
  });

  return {
    totalBab,
    totalSelesai: selesaiCount,
    selesaiCount,
    persenTotal: persen,
    persen,
    perSubtes: perSubtest,
    perSubtest,
    babSelesaiIds: babSelesaiArr,
  };
}

export function getDaftarBabSdSelesai(studentId) {
  const sid = studentId || 'siswa_sd_default';
  const storageKey = `gemilang_modul_sd_selesai_${sid}`;
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function tandaiBabSdSelesai(studentId, babId) {
  const sid = studentId || 'siswa_sd_default';
  const storageKey = `gemilang_modul_sd_selesai_${sid}`;
  let selesaiArr = [];
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) selesaiArr = JSON.parse(raw);
  } catch {
    selesaiArr = [];
  }
  if (!selesaiArr.includes(babId)) {
    selesaiArr.push(babId);
    try {
      localStorage.setItem(storageKey, JSON.stringify(selesaiArr));
    } catch {
      // ignore
    }
  }
}

export function simpanTerakhirDibacaSd(studentId, babData) {
  const sid = studentId || 'siswa_sd_default';
  const storageKey = `gemilang_modul_sd_last_${sid}`;
  try {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        ...babData,
        timestamp: Date.now(),
      })
    );
  } catch {
    // ignore
  }
}

export function getTerakhirDibacaSd(studentId) {
  const sid = studentId || 'siswa_sd_default';
  const storageKey = `gemilang_modul_sd_last_${sid}`;
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function simpanSkorKuisSdBab(studentId, babId, skorBenar, totalSoal) {
  const sid = studentId || 'siswa_sd_default';
  const storageKey = `gemilang_modul_sd_kuis_${sid}_${babId}`;
  const nilai100 = totalSoal > 0 ? Math.round((skorBenar / totalSoal) * 100) : 0;
  const xpReward = skorBenar * 25;

  const data = {
    babId,
    skorBenar,
    totalSoal,
    nilai100,
    xpReward,
    lulus: skorBenar >= Math.ceil(totalSoal * 0.6),
    waktu: Date.now(),
  };

  try {
    localStorage.setItem(storageKey, JSON.stringify(data));
  } catch {
    // ignore
  }

  if (data.lulus) {
    tandaiBabSdSelesai(sid, babId);
  }

  return data;
}

export function getSkorKuisSdBab(studentId, babId) {
  const sid = studentId || 'siswa_sd_default';
  const storageKey = `gemilang_modul_sd_kuis_${sid}_${babId}`;
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
