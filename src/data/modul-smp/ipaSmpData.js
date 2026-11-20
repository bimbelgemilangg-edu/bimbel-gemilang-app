// src/data/modul-smp/ipaSmpData.js
// ==============================================================================
// MODUL MASTER 52 HALAMAN RESMI TKA SMP 2027 - BIMBEL GEMILANG
// 100% Bebas Kuis Kunci Dummy, Bebas PUA, Pecahan Tegak KaTeX & Terstruktur Rapi
// ==============================================================================

export const IPA_SMP_MODUL = [
  {
    "id": "ipa_smp_bab_1",
    "subtestKode": "IPA_SMP",
    "subtestNama": "Ilmu Pengetahuan Alam (IPA CP Fase D)",
    "subtestSingkatan": "IPA",
    "subtestEmoji": "🔬",
    "subtestWarna": "#059669",
    "subtestBgLight": "#ecfdf5",
    "babNumber": 1,
    "slug": "pengukuran-zat-suhu-kalor-energi",
    "judul": "Bab 1 · Pengukuran, Zat, Suhu, Kalor & Energi",
    "durasiBacaMenit": 15,
    "ringkasanSingkat": "Identifikasi variabel percobaan (bebas, terikat, kontrol), ketelitian alat ukur, massa jenis, skala termometer, rumus kalor $Q = mc\\Delta T$, dan energi.",
    "learningObjectives": [
      "Menentukan variabel bebas, terikat, dan kontrol pada rancangan percobaan sains.",
      "Membaca skala jangka sorong dan mikrometer sekrup serta menghitung massa jenis $\\rho = m/V$.",
      "Menghitung konversi termometer dan kalor perubahan wujud zat $Q = mc\\Delta T$ dan $Q = mL$."
    ],
    "pdfUrl": "/modul-pdf/Modul_Master_TKA_SMP_IPA_2027.pdf",
    "pdfFilename": "Modul_Master_TKA_SMP_IPA_2027.pdf",
    "pdfTotalHalaman": 52,
    "isUtama": false,
    "units": [
      {
        "unitNumber": "1.1",
        "judul": "Metode Ilmiah & Variabel",
        "hook": "Kunci menjawab soal percobaan: bedakan Variabel Bebas, Terikat & Kontrol!",
        "teori": "Setiap ilmuwan bekerja dengan urutan Metode Ilmiah: Observasi → Rumusan Masalah → Hipotesis (dugaan sementara) → Eksperimen → Analisis Data → Kesimpulan. Di soal ujian, yang paling sering keluar adalah menentukan 3 jenis variabel dari sebuah percobaan! Variabel BEBAS Sengaja DIBEDAKAN (faktor penyebab) Ex: Jenis pupuk Variabel TERIKAT Hasil yang DIUKUR (akibat perubahan) Ex: Tinggi tanaman Variabel KONTROL Dibuat SAMA PERSIS (biar adil/valid) Ex: Air, cahaya, pot",
        "pondasi": "Pondasi · Data Kualitatif vs Kuantitatif Data Kualitatif: Berupa deskripsi indra tanpa angka (warna daun menguning, bau menyengat, tekstur kasar). Data Kuantitatif: Berupa angka hasil pengukuran dengan alat ukur (tinggi 12 cm, suhu 37°C, massa 50 gram).",
        "jebakanTka": "Dalam kalimat “Pengaruh X terhadap Y”, jangan sampai terbalik: X selalu Variabel Bebas, sedangkan Y selalu Variabel Terikat!",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 1.1",
          "soal": "Dina menanam 3 pot kacang hijau dengan ukuran pot, jenis tanah, dan volume air yang sama. Pot A diletakkan di tempat terang, Pot B di tempat redup, Pot C di lemari gelap. Setelah 7 hari, Dina mengukur tinggi batang tiap pot. Tentukan variabel bebas, terikat, dan kontrolnya! Pembahasan: Yang sengaja dibedakan Dina adalah intensitas cahaya (terang/redup/gelap) → Variabel Bebas. Yang diukur sebagai hasilnya adalah tinggi batang → Variabel Terikat. Yang dijaga tetap sama (pot, tanah, air, jenis biji) → Variabel Kontrol. Jawaban: Bebas = intensitas cahaya; Terikat = tinggi batang; Kontrol = pot, tanah, air.",
          "opsiString": "",
          "jawaban": "Bebas = intensitas cahaya; Terikat = tinggi batang; Kontrol = pot, tanah, air",
          "solusi": "Yuk Bahas · Menentukan Variabel Eksperimen Soal: Dina menanam 3 pot kacang hijau dengan ukuran pot, jenis tanah, dan volume air yang sama. Pot A diletakkan di tempat terang, Pot B di tempat redup, Pot C di lemari gelap. Setelah 7 hari, Dina mengukur tinggi batang tiap pot. Tentukan variabel bebas, terikat, dan kontrolnya! Pembahasan: Yang sengaja dibedakan Dina adalah intensitas cahaya (terang/redup/gelap) → Variabel Bebas. Yang diukur sebagai hasilnya adalah tinggi batang → Variabel Terikat. Yang dijaga tetap sama (pot, tanah, air, jenis biji) → Variabel Kontrol. Jawaban: Bebas = intensitas cahaya; Terikat = tinggi batang; Kontrol = pot, tanah, air."
        },
        "trikCepat": "Trik Cepat · Rumus B-T-K Ingat akronim B-T-K: Bebas = di-Bedakan, Terikat = di-Teliti/diukur hasilnya, Kontrol = di-Kembarang/disamakan!",
        "pageNumber": 4,
        "illustrationImg": null,
        "illustrationCaption": "",
        "slideImg": "/modul-assets/pages/ipa_p4.png"
      },
      {
        "unitNumber": "1.2",
        "judul": "Pengukuran, Jangka Sorong & Mikrometer",
        "hook": "Wajib hafal 7 Besaran Pokok dan cara baca Jangka Sorong + Mikrometer",
        "teori": "Sekrup! Besaran Pokok adalah besaran yang satuannya ditetapkan lebih dulu (SI). Ada 7: Panjang (m), Massa (kg), Waktu (s), Suhu (K), Kuat Arus (A), Intensitas Cahaya (cd), Jumlah Zat (mol). Selain 7 itu (luas, volume, kecepatan, gaya, massa jenis) disebut Besaran Turunan. Kiri: Jangka Sorong (ketelitian 0,01 cm · SU + SN)  |  Kanan: Mikrometer Sekrup (ketelitian 0,01 mm · SU + 0,5 mm + SP)",
        "pondasi": "Pondasi · Jembatan Keledai 7 Besaran Pokok Hafalkan kalimat “Ji-Wa S-M-P Ku-In”: Ji = Jumlah zat (mol) · Wa = Waktu (sekon) S = Suhu (Kelvin) · M = Massa (kg) · P = Panjang (meter) Ku = Kuat arus (Ampere) · In = Intensitas cahaya (candela)",
        "jebakanTka": "Sering banget siswa lupa menambahkan 0,5 mm dari garis kecil di bagian bawah skala utama mikrometer sekrup! Selalu cek: ada garis bawah setelah angka terakhir atau tidak?",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 1.2",
          "soal": "Tiga lengan neraca Ohaus menunjukkan beban masing-masing 200 g, 40 g, dan 5,5 g. Berapa massa benda dalam satuan SI (kg)? Pembahasan: Jumlahkan ketiga lengan: 200 + 40 + 5,5 = 245,5 gram. Karena satuan SI massa adalah kilogram (kg), bagi dengan 1.000 → 245,5 / 1.000 = 0,2455 kg. Jawaban: 245,5 gram atau 0,2455 kg.",
          "opsiString": "",
          "jawaban": "",
          "solusi": "Yuk Bahas · Membaca Neraca Ohaus & Konversi Soal: Tiga lengan neraca Ohaus menunjukkan beban masing-masing 200 g, 40 g, dan 5,5 g. Berapa massa benda dalam satuan SI (kg)? Pembahasan: Jumlahkan ketiga lengan: 200 + 40 + 5,5 = 245,5 gram. Karena satuan SI massa adalah kilogram (kg), bagi dengan 1.000 → 245,5 / 1.000 = 0,2455 kg. Jawaban: 245,5 gram atau 0,2455 kg."
        },
        "trikCepat": "Trik Cepat · Satuan Jangka vs Mikrometer Jangka Sorong = cm (2 angka di belakang koma, misal 2,36 cm). Mikrometer = mm (2 angka di belakang koma, misal 4,78 mm). Jangan tertukar satuannya!",
        "pageNumber": 5,
        "illustrationImg": "/modul-assets/illustrations/ipa_p5.jpeg",
        "illustrationCaption": "Kiri: Jangka Sorong (ketelitian 0,01 cm · SU + SN)  |  Kanan: Mikrometer",
        "slideImg": "/modul-assets/pages/ipa_p5.png"
      },
      {
        "unitNumber": "1.3",
        "judul": "Wujud Zat & Massa Jenis",
        "hook": "Kenapa kapal baja raksasa mengapung sementara paku kecil tenggelam?",
        "teori": "Semua materi tersusun dari partikel super kecil. Pada zat padat, partikelnya rapat & teratur (bentuk dan volume tetap). Pada zat cair, agak renggang (volume tetap, bentuk ikut wadah). Pada gas, sangat bebas bergerak (bentuk dan volume berubah memenuhi ruang). Kiri: Gelas ukur ukur volume batu (V = V₂ − V₁)  |  Kanan: Susunan partikel Padat (rapat), Cair, dan Gas (renggang)",
        "pondasi": "Pondasi · Rumus Massa Jenis (ρ) Massa Jenis = kerapatan suatu benda tiap satuan volume: ρ = m / V. Konversi cepat: 1 g/cm³ = 1.000 kg/m³ (tinggal kali 1.000!). Benda mengapung jika ρ_benda < ρ_cair; melayang jika =; tenggelam jika >.",
        "jebakanTka": "Menyerap kalor (butuh panas): Mencair, Menguap, Menyublim (kapur barus). Melepas kalor (didinginkan): Membeku, Mengembun, Mengkristal/Deposisi (salju/bunga es).",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 1.3",
          "soal": "Sebuah batu ditimbang massanya 150 g. Saat dicelupkan ke gelas ukur berisi air 40 mL, permukaan air naik menjadi 90 mL. Berapa massa jenis batu dalam SI (kg/m³)? Pembahasan: Volume batu = selisih permukaan air = 90 - 40 = 50 mL = 50 cm³. Maka ρ = m / V = 150 g / 50 cm³ = 3 g/cm³. Ubah ke SI (kali 1.000) → 3 × 1.000 = 3.000 kg/m³. Jawaban: 3 g/cm³ atau 3.000 kg/m³.",
          "opsiString": "",
          "jawaban": "",
          "solusi": "Yuk Bahas · Mengukur Massa Jenis Batu Tak Beraturan Soal: Sebuah batu ditimbang massanya 150 g. Saat dicelupkan ke gelas ukur berisi air 40 mL, permukaan air naik menjadi 90 mL. Berapa massa jenis batu dalam SI (kg/m³)? Pembahasan: Volume batu = selisih permukaan air = 90 - 40 = 50 mL = 50 cm³. Maka ρ = m / V = 150 g / 50 cm³ = 3 g/cm³. Ubah ke SI (kali 1.000) → 3 × 1.000 = 3.000 kg/m³. Jawaban: 3 g/cm³ atau 3.000 kg/m³."
        },
        "trikCepat": "Trik Cepat · 1 mL = 1 cm³ Ingat kesetaraan sakti ini: 1 mL = 1 cm³ dan 1 Liter = 1 dm³. Jadi pembacaan gelas ukur (mL) bisa langsung dipakai buat membagi gram!",
        "pageNumber": 6,
        "illustrationImg": "/modul-assets/illustrations/ipa_p6.jpeg",
        "illustrationCaption": "Kiri: Gelas ukur ukur volume batu (V = V₂ − V₁)  |  Kanan: Susunan partikel",
        "slideImg": "/modul-assets/pages/ipa_p6.png"
      },
      {
        "unitNumber": "1.4",
        "judul": "Perubahan Zat & Pemisahan Campuran",
        "hook": "Bedakan perubahan fisika vs kimia dan pilih teknik pemisahan campuran",
        "teori": "yang tepat! Perubahan Fisika tidak menghasilkan zat baru dan bisa kembali (es mencair, kayu jadi meja, gula larut). Perubahan Kimia menghasilkan zat baru, cirinya ada 4: perubahan warna, suhu berubah, timbul gas, atau terbentuk endapan (besi berkarat, nasi basi, kayu dibakar, fermentasi tapai). (1) Destilasi (beda titik didih)  ·  (2) Filtrasi (saring endapan)  ·  (3) Kromatografi (pisah warna tinta)",
        "pondasi": "Pondasi · 5 Metode Pemisahan Campuran Wajib Hafal Filtrasi (Penyaringan): Beda ukuran partikel (air keruh/ampas kopi). Destilasi (Penyulingan): Beda titik didih (air + alkohol, minyak bumi). Kristalisasi (Penguapan): Mendapat padatan terlarut (garam dari air laut). Sublimasi: Zat mudah menyublim (kapur barus + pasir). Kromatografi: Beda kecepatan merambat warna (tinta spidol, klorofil).",
        "jebakanTka": "Hati-hati pada soal lilin! Lilin meleleh adalah perubahan fisika (hanya berubah wujud padat→cair), sedangkan sumbu lilin terbakar jadi arang adalah perubahan kimia!",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 1.4",
          "soal": "Yuk Bahas · Memilih Metode Pemisahan Tepat Soal (PGK): Di laboratorium, seorang siswa ingin memisahkan: (1) air murni dari campuran air + alkohol, dan (2) zat warna pada tinta hitam. Metode yang paling tepat secara berurutan adalah... Pembahasan: (1) Air (titik didih 100°C) dan alkohol (78°C) berbeda titik didihnya → pakai Destilasi. (2) Memisahkan pigmen warna pada tinta → pakai Kromatografi kertas. Jawaban: (1) Destilasi dan (2) Kromatografi.",
          "opsiString": "",
          "jawaban": "(1)",
          "solusi": "Yuk Bahas · Memilih Metode Pemisahan Tepat Soal (PGK): Di laboratorium, seorang siswa ingin memisahkan: (1) air murni dari campuran air + alkohol, dan (2) zat warna pada tinta hitam. Metode yang paling tepat secara berurutan adalah... Pembahasan: (1) Air (titik didih 100°C) dan alkohol (78°C) berbeda titik didihnya → pakai Destilasi. (2) Memisahkan pigmen warna pada tinta → pakai Kromatografi kertas. Jawaban: (1) Destilasi dan (2) Kromatografi."
        },
        "trikCepat": "",
        "pageNumber": 7,
        "illustrationImg": "/modul-assets/illustrations/ipa_p7.jpeg",
        "illustrationCaption": "Perubahan Fisika tidak menghasilkan zat baru dan bisa kembali (es mencair, kayu jadi meja, gula larut). Perubahan Kimia menghasilkan zat baru, cirinya ada 4: perubahan warna, suhu berubah, timbul gas, atau terbentuk endapan (besi berkarat, nasi basi, kayu dibakar, fermentasi tapai).",
        "slideImg": "/modul-assets/pages/ipa_p7.png"
      },
      {
        "unitNumber": "1.5",
        "judul": "Asam, Basa, Garam & Skala pH",
        "hook": "Cukup pegang skala pH 0–14 dan trik warna kertas lakmus anti-ketukar!",
        "teori": "Asam (pH < 7) terasa masam, korosif, melepas ion H⁺ (cuka, jeruk, asam lambung HCl). Basa (pH > 7) terasa pahit, licin di kulit, melepas ion OH⁻ (sabun, deterjen, obat maag Mg(OH)₂). Netral (pH = 7) contohnya air murni dan larutan garam dapur (NaCl). Asam (pH < 7): lakmus biru → merah  |  Netral (pH = 7)  |  Basa (pH > 7): lakmus merah → biru",
        "pondasi": "Pondasi · Indikator Alami (Sering Keluar!) Kunyit: Dalam asam berwarna kuning cerah, dalam basa berubah jadi merah bata/jingga gelap. Kubis Ungu: Asam → merah/pink; Netral → ungu; Basa → hijau/kuning. Bunga Sepatu: Asam → merah cerah; Basa → hijau.",
        "jebakanTka": "Sakit maag terjadi karena asam lambung berlebih, jadi obat maag harus bersifat BASA (Mg(OH)₂) agar terjadi reaksi netralisasi: Asam + Basa → Garam + Air.",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 1.5",
          "soal": "Data uji 4 larutan: Larutan P (lakmus merah→merah, biru→merah); Q (merah→biru, biru→biru); R (merah→merah, biru→biru); S (merah→merah, biru→merah). Manakah pasangan larutan bersifat Asam dan Netral? Pembahasan: Yang bikin semua lakmus jadi merah adalah Asam (P dan S). Yang bikin semua jadi biru adalah Basa (Q). Yang tidak mengubah warna lakmus adalah Netral (R). Jawaban: Asam = P & S; Netral = R (Basa = Q).",
          "opsiString": "",
          "jawaban": "Asam = P & S; Netral = R (Basa = Q)",
          "solusi": "Yuk Bahas · Tabel Uji Kertas Lakmus Soal: Data uji 4 larutan: Larutan P (lakmus merah→merah, biru→merah); Q (merah→biru, biru→biru); R (merah→merah, biru→biru); S (merah→merah, biru→merah). Manakah pasangan larutan bersifat Asam dan Netral? Pembahasan: Yang bikin semua lakmus jadi merah adalah Asam (P dan S). Yang bikin semua jadi biru adalah Basa (Q). Yang tidak mengubah warna lakmus adalah Netral (R). Jawaban: Asam = P & S; Netral = R (Basa = Q)."
        },
        "trikCepat": "Trik Cepat · B-B & A-M Hafal 2 huruf saja: Basa → Biru (B-B), Asam → Merah (A-M)! Kalau kedua kertas lakmus warnanya tidak berubah, pasti Netral (Garam/Air).",
        "pageNumber": 8,
        "illustrationImg": "/modul-assets/illustrations/ipa_p8.jpeg",
        "illustrationCaption": "",
        "slideImg": "/modul-assets/pages/ipa_p8.png"
      },
      {
        "unitNumber": "1.6",
        "judul": "Suhu & Konversi Termometer",
        "hook": "Pegang 1 rasio ajaib 5 : 4 : 9 : 5, semua soal konversi suhu langsung beres!",
        "teori": "Suhu adalah derajat panas/dinginnya suatu benda (satuan SI: Kelvin, bukan Celcius!). Ada 4 skala utama yang dibandingkan dari titik tetap bawah (es melebur) sampai titik tetap atas (air mendidih): Celcius (°C) Atas: 100° Skala: 5 Bawah: 0° Reamur (°R) Atas: 80° Skala: 4 Bawah: 0° Fahrenheit (°F) Atas: 212° Skala: 9 Bawah: 32° Kelvin (K) Atas: 373 Skala: 5 Bawah: 273 Rumus Umum Termometer X: (T_X − Bawah_X) / (Atas_X − Bawah_X) = C / 100",
        "pondasi": "Pondasi · Konversi Kilat dari Celcius R = (4/5) × C  |  F = (9/5) × C + 32  |  K = C + 273 Contoh 40°C: R = (4/5)×40 = 32°R · F = (9/5)×40 + 32 = 104°F · K = 40 + 273 = 313 K.",
        "jebakanTka": "Ke Fahrenheit: kali dulu (9/5), baru + 32. Dari Fahrenheit ke Celcius: kurangi 32 dulu, baru kali (5/9)! Jangan sampai urutannya terbalik.",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 1.6",
          "soal": "Termometer X memiliki titik beku -10°X dan titik didih 110°X. Jika air bersuhu 25°C diukur dengan termometer X, berapakah angka yang ditunjukkan? Pembahasan: Rentang termometer X = 110 - (-10) = 120. Pakai perbandingan: (X - (-10)) / 120 = 25 / 100 → (X + 10) / 120 = 1/4 → X + 10 = 30 → X = 20°X. Jawaban: 20°X.",
          "opsiString": "",
          "jawaban": "",
          "solusi": "Yuk Bahas · Termometer Tak Berskala (Termometer X) Soal: Termometer X memiliki titik beku -10°X dan titik didih 110°X. Jika air bersuhu 25°C diukur dengan termometer X, berapakah angka yang ditunjukkan? Pembahasan: Rentang termometer X = 110 - (-10) = 120. Pakai perbandingan: (X - (-10)) / 120 = 25 / 100 → (X + 10) / 120 = 1/4 → X + 10 = 30 → X = 20°X. Jawaban: 20°X."
        },
        "trikCepat": "Trik Cepat · Ditanya di Atas, Diketahui di Bawah Untuk konversi C ↔ R ↔ F, selalu taruh rasio yang ditanya di atas dan rasio yang diketahui di bawah. Untuk Kelvin tidak pakai tanda derajat (°), cukup tulis 313 K.",
        "pageNumber": 9,
        "illustrationImg": null,
        "illustrationCaption": "",
        "slideImg": "/modul-assets/pages/ipa_p9.png"
      },
      {
        "unitNumber": "1.7",
        "judul": "Pemuaian & Kalor (Grafik Es–Uap)",
        "hook": "Pahami beda garis MIRING (suhu naik) vs garis DATAR (berubah wujud)!",
        "teori": "Pemuaian: Benda memuai saat dipanaskan (ΔL = L₀·α·ΔT). Pada keping bimetal (2 logam direkatkan), saat dipanaskan ia melengkung ke arah logam yang koefisien muainya (α) lebih kecil; saat didinginkan melengkung ke arah α lebih besar. T(°C) Kalor (Q) 0°C 100° A B C D E Q₁=mc_esΔTQ₂ = m·L (Melebur) Q₃=mc_airΔT Q₄ = m·U (Menguap)",
        "pondasi": "Pondasi · Asas Black (Pencampuran Zat) Saat air panas dicampur air dingin, kalor yang dilepas = kalor yang diterima: Q_lepas = Q_terima → m₁·c₁·(T₁ − T_c) = m₂·c₂·(T_c − T₂).",
        "jebakanTka": "Pada garis datar B–C (melebur) dan D–E (menguap), suhu tetap konstan karena kalor dipakai penuh untuk mengubah wujud. Jangan masukkan ΔT di garis datar!",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 1.7",
          "soal": "Es bermassa 500 g bersuhu -10°C dipanaskan hingga menjadi air bersuhu 20°C. Jika c_es = 2.100 J/kg°C, L = 336.000 J/kg, dan c_air = 4.200 J/kg°C, berapa kalor totalnya? Pembahasan: Ubah massa ke kg: m = 500 g = 0,5 kg. Ada 3 tahap: Q₁ (es -10°→0°): 0,5 × 2.100 × 10 = 10.500 J Q₂ (es melebur): 0,5 × 336.000 = 168.000 J Q₃ (air 0°→20°): 0,5 × 4.200 × 20 = 42.000 J Total = 10.500 + 168.000 + 42.000 = 220.500 J = 220,5 kJ. Jawaban: 220.500 J atau 220,5 kJ.",
          "opsiString": "",
          "jawaban": "",
          "solusi": "Yuk Bahas · Menghitung Kalor Total Grafik A–B–C–D Soal: Es bermassa 500 g bersuhu -10°C dipanaskan hingga menjadi air bersuhu 20°C. Jika c_es = 2.100 J/kg°C, L = 336.000 J/kg, dan c_air = 4.200 J/kg°C, berapa kalor totalnya? Pembahasan: Ubah massa ke kg: m = 500 g = 0,5 kg. Ada 3 tahap: Q₁ (es -10°→0°): 0,5 × 2.100 × 10 = 10.500 J Q₂ (es melebur): 0,5 × 336.000 = 168.000 J Q₃ (air 0°→20°): 0,5 × 4.200 × 20 = 42.000 J Total = 10.500 + 168.000 + 42.000 = 220.500 J = 220,5 kJ. Jawaban: 220.500 J atau 220,5 kJ."
        },
        "trikCepat": "",
        "pageNumber": 10,
        "illustrationImg": null,
        "illustrationCaption": "",
        "slideImg": "/modul-assets/pages/ipa_p10.png"
      },
      {
        "unitNumber": "1.8",
        "judul": "Perpindahan Kalor (Konduksi–Konveksi–Radiasi)",
        "hook": "Panas selalu mengalir dari suhu TINGGI ke suhu RENDAH lewat 3 cara!",
        "teori": "Pernah pegang gagang sendok logam di teh panas lalu terasa ikut panas? Itu Konduksi! Kalor berpindah dengan 3 mekanisme berbeda tergantung ada atau tidaknya zat perantara (medium): Kiri: Konduksi (gagang), Konveksi (aliran air), Radiasi (pancaran)  |  Kanan: Penampang Termos (vakum & kaca perak)",
        "pondasi": "Pondasi · Rahasia Termos Air Panas Termos dirancang menahan ketiga perpindahan kalor sekaligus: Tutup gabus/plastik: Mencegah konduksi (bahan isolator). Ruang hampa udara (vakum): Mencegah konveksi & konduksi. Dinding kaca berlapis perak mengilap: Memantulkan panas → mencegah radiasi!",
        "jebakanTka": "Siang hari (Angin LAUT): Daratan cepat panas → udara darat naik → angin bertiup dari Laut ke Darat (nelayan pulang). Malam hari (Angin DARAT): Laut lebih hangat → angin dari Darat ke Laut (nelayan berangkat melaut).",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 1.8",
          "soal": "Di siang terik, siswa yang memakai kaus hitam merasa jauh lebih panas dibanding yang memakai kaus putih. Fenomena ini berkaitan dengan perpindahan kalor secara... Pembahasan: Panas matahari sampai ke bumi melewati ruang hampa secara Radiasi. Permukaan berwarna hitam/kusam adalah penyerap sekaligus pemancar kalor radiasi terbaik, sedangkan putih mengilap memantulkannya. Jawaban: Radiasi (warna gelap menyerap kalor radiasi paling besar).",
          "opsiString": "",
          "jawaban": "",
          "solusi": "Yuk Bahas · Mengapa Baju Hitam Lebih Gerah? Soal: Di siang terik, siswa yang memakai kaus hitam merasa jauh lebih panas dibanding yang memakai kaus putih. Fenomena ini berkaitan dengan perpindahan kalor secara... Pembahasan: Panas matahari sampai ke bumi melewati ruang hampa secara Radiasi. Permukaan berwarna hitam/kusam adalah penyerap sekaligus pemancar kalor radiasi terbaik, sedangkan putih mengilap memantulkannya. Jawaban: Radiasi (warna gelap menyerap kalor radiasi paling besar)."
        },
        "trikCepat": "Trik Cepat · Nama Angin = Asalnya! Ingat aturan geografi-fisika ini: Angin DARAT berarti datang DARI Darat (malam hari). Angin LAUT berarti datang DARI Laut (siang hari)!",
        "pageNumber": 11,
        "illustrationImg": "/modul-assets/illustrations/ipa_p11.jpeg",
        "illustrationCaption": "Kiri: Konduksi (gagang), Konveksi (aliran air), Radiasi (pancaran)  |  Kanan:",
        "slideImg": "/modul-assets/pages/ipa_p11.png"
      },
      {
        "unitNumber": "1.9",
        "judul": "Zat Aditif & Zat Adiktif",
        "hook": "Sering tertukar! Aditif = tambahan makanan; Adiktif = bikin ketagihan!",
        "teori": "Zat Aditif sengaja ditambahkan pada makanan/minuman untuk memperbaiki warna, rasa, aroma, atau daya tahan. Ada yang alami (aman) dan buatan/sintetis (dibatasi dosisnya, bahkan ada yang dilarang keras seperti Boraks, Formalin, Rhodamin B, dan Methanil Yellow). ZAT ADITIF (Pangan) • Pewarna: Pandan / Tartrazin • Pemanis: Gula / Aspartam, Sakarin • Pengawet: Garam / Natrium Benzoat • Penyedap: Bawang / MSG (Vetsin) DILARANG: Boraks, Formalin, Rhodamin B ZAT ADIKTIF (Kecanduan) • Stimulan (memacu saraf): Kafein, Nikotin, Kokain, Sabu • Depresan (menekan saraf): Alkohol, Morfin, Heroin, Obat tidur • Halusinogen: LSD, Ganja (khayalan)",
        "pondasi": "Pondasi · Membaca Komposisi Kemasan Makanan Di soal literasi sains, sering ditampilkan label komposisi minuman kemasan! Kenali nama kimia aditif sintetis yang sah: Natrium benzoat / Asam sorbat → Pengawet. Aspartam / Asesulfam-K / Siklamat → Pemanis buatan. Tartrazin (kuning) / Biru berlian → Pewarna sintetis. Mononatrium glutamat (MSG) → Penguat rasa (penyedap).",
        "jebakanTka": "Kenali 3 racun utama rokok: Nikotin (bikin kecanduan & penyempitan pembuluh darah), Tar (lengket, pemicu kanker paru), dan Karbon Monoksida / CO (mengikat hemoglobin lebih kuat dari O₂ sehingga tubuh kekurangan oksigen).",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 1.9",
          "soal": "Label minuman mencantumkan: Air, Gula, Asam Sitrat, Natrium Benzoat, Aspartam, Tartrazin CI 19140. Zat manakah yang berfungsi sebagai pengawet dan pemanis buatan? Pembahasan: Natrium benzoat berfungsi sebagai pengawet sintetis agar minuman tidak cepat berjamur, sedangkan Aspartam adalah pemanis buatan (rendah kalori). Tartrazin = pewarna kuning; Asam sitrat = pengatur keasaman. Jawaban: Pengawet = Natrium benzoat; Pemanis buatan = Aspartam.",
          "opsiString": "",
          "jawaban": "",
          "solusi": "Yuk Bahas · Analisis Label Minuman Kemasan Soal: Label minuman mencantumkan: Air, Gula, Asam Sitrat, Natrium Benzoat, Aspartam, Tartrazin CI 19140. Zat manakah yang berfungsi sebagai pengawet dan pemanis buatan? Pembahasan: Natrium benzoat berfungsi sebagai pengawet sintetis agar minuman tidak cepat berjamur, sedangkan Aspartam adalah pemanis buatan (rendah kalori). Tartrazin = pewarna kuning; Asam sitrat = pengatur keasaman. Jawaban: Pengawet = Natrium benzoat; Pemanis buatan = Aspartam."
        },
        "trikCepat": "",
        "pageNumber": 12,
        "illustrationImg": null,
        "illustrationCaption": "",
        "slideImg": "/modul-assets/pages/ipa_p12.png"
      },
      {
        "unitNumber": "1.10",
        "judul": "Energi Kinetik, Potensial & Mekanik",
        "hook": "Energi tak bisa diciptakan atau dimusnahkan—hanya berubah bentuk!",
        "teori": "Dalam fisika SMP, ada dua energi mekanik utama: Energi Potensial (Ep) karena ketinggian benda (Ep = m·g·h) dan Energi Kinetik (Ek) karena gerak/kecepatan benda (Ek = $\\frac{1}{2}$·m·v²). Jumlah keduanya adalah Energi Mekanik (Em = Ep + Ek) yang nilainya selalu tetap jika gesekan diabaikan! 1Puncak (h=10m) Ep = 200 J (Maks) Ek = 0 J 2 Tengah (h=4m) Ep = 80 J · Ek = 120 J Em tetap = 200 J! 3 Tanah (h=0m) Ep = 0 J Ek = 200 J (Maks)",
        "pondasi": "Pondasi · Energi Terbarukan vs Tak Terbarukan Terbarukan (ramah lingkungan): Matahari (surya), angin (bayu), air (hidro), panas bumi (geotermal), biomassa/biogas. Tak Terbarukan (fosil, terbatas): Batu bara, minyak bumi, gas alam.",
        "jebakanTka": "Hati-hati pada PLTA: Air jatuh (Potensial → Kinetik) memutar turbin → generator (Listrik). Pada aki/baterai: Kimia → Listrik. Pada fotosintesis: Cahaya → Kimia.",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 1.10",
          "soal": "Buah mangga bermassa 2 kg jatuh dari dahan setinggi 10 m (g = 10 m/s²). Berapakah energi kinetik mangga tepat saat berada pada ketinggian 4 m dari tanah? Pembahasan: Di puncak (h = 10 m): Em = Ep₁ = m·g·h₁ = 2 × 10 × 10 = 200 J. Di ketinggian 4 m: Ep₂ = 2 × 10 × 4 = 80 J. Karena Em kekal, maka Ek₂ = Em − Ep₂ = 200 − 80 = 120 J! Jawaban: 120 Joule.",
          "opsiString": "",
          "jawaban": "",
          "solusi": "Yuk Bahas · Buah Mangga Jatuh Bebas Soal: Buah mangga bermassa 2 kg jatuh dari dahan setinggi 10 m (g = 10 m/s²). Berapakah energi kinetik mangga tepat saat berada pada ketinggian 4 m dari tanah? Pembahasan: Di puncak (h = 10 m): Em = Ep₁ = m·g·h₁ = 2 × 10 × 10 = 200 J. Di ketinggian 4 m: Ep₂ = 2 × 10 × 4 = 80 J. Karena Em kekal, maka Ek₂ = Em − Ep₂ = 200 − 80 = 120 J! Jawaban: 120 Joule."
        },
        "trikCepat": "Trik Cepat · Langsung Pakai Selisih Tinggi! Untuk benda jatuh bebas dari diam, Ek di ketinggian h₂ sama dengan m·g·(h₁ − h₂)! Cek: 2 × 10 × (10 − 4) = 120 J. Selesai dalam 5 detik!",
        "pageNumber": 13,
        "illustrationImg": null,
        "illustrationCaption": "",
        "slideImg": "/modul-assets/pages/ipa_p13.png"
      }
    ],
    "cheatSheet": "",
    "cheatSheetImg": null,
    "miniTryout": "",
    "tryoutImg": null,
    "petaBelajarImg": null,
    "konsepTeori": [
      {
        "subjudul": "Unit 1.1: Metode Ilmiah & Variabel",
        "isi": "Setiap ilmuwan bekerja dengan urutan Metode Ilmiah: Observasi → Rumusan Masalah → Hipotesis (dugaan sementara) → Eksperimen → Analisis Data → Kesimpulan. Di soal ujian, yang paling sering keluar adalah menentukan 3 jenis variabel dari sebuah percobaan! Variabel BEBAS Sengaja DIBEDAKAN (faktor penyebab) Ex: Jenis pupuk Variabel TERIKAT Hasil yang DIUKUR (akibat perubahan) Ex: Tinggi tanaman Variabel KONTROL Dibuat SAMA PERSIS (biar adil/valid) Ex: Air, cahaya, pot",
        "poinPenting": [
          "Kunci menjawab soal percobaan: bedakan Variabel Bebas, Terikat & Kontrol!",
          "Pondasi · Data Kualitatif vs Kuantitatif Data Kualitatif: Berupa deskripsi indra tanpa angka (warna daun menguning, bau menyengat, tekstur kasar). Data Kuantitatif: Berupa angka hasil pengukuran dengan alat ukur (tinggi 12 cm, suhu 37°C, massa 50 gram)."
        ]
      },
      {
        "subjudul": "Unit 1.2: Pengukuran, Jangka Sorong & Mikrometer",
        "isi": "Sekrup! Besaran Pokok adalah besaran yang satuannya ditetapkan lebih dulu (SI). Ada 7: Panjang (m), Massa (kg), Waktu (s), Suhu (K), Kuat Arus (A), Intensitas Cahaya (cd), Jumlah Zat (mol). Selain 7 itu (luas, volume, kecepatan, gaya, massa jenis) disebut Besaran Turunan. Kiri: Jangka Sorong (ketelitian 0,01 cm · SU + SN)  |  Kanan: Mikrometer Sekrup (ketelitian 0,01 mm · SU + 0,5 mm + SP)",
        "poinPenting": [
          "Wajib hafal 7 Besaran Pokok dan cara baca Jangka Sorong + Mikrometer",
          "Pondasi · Jembatan Keledai 7 Besaran Pokok Hafalkan kalimat “Ji-Wa S-M-P Ku-In”: Ji = Jumlah zat (mol) · Wa = Waktu (sekon) S = Suhu (Kelvin) · M = Massa (kg) · P = Panjang (meter) Ku = Kuat arus (Ampere) · In = Intensitas cahaya (candela)"
        ]
      },
      {
        "subjudul": "Unit 1.3: Wujud Zat & Massa Jenis",
        "isi": "Semua materi tersusun dari partikel super kecil. Pada zat padat, partikelnya rapat & teratur (bentuk dan volume tetap). Pada zat cair, agak renggang (volume tetap, bentuk ikut wadah). Pada gas, sangat bebas bergerak (bentuk dan volume berubah memenuhi ruang). Kiri: Gelas ukur ukur volume batu (V = V₂ − V₁)  |  Kanan: Susunan partikel Padat (rapat), Cair, dan Gas (renggang)",
        "poinPenting": [
          "Kenapa kapal baja raksasa mengapung sementara paku kecil tenggelam?",
          "Pondasi · Rumus Massa Jenis (ρ) Massa Jenis = kerapatan suatu benda tiap satuan volume: ρ = m / V. Konversi cepat: 1 g/cm³ = 1.000 kg/m³ (tinggal kali 1.000!). Benda mengapung jika ρ_benda < ρ_cair; melayang jika =; tenggelam jika >."
        ]
      },
      {
        "subjudul": "Unit 1.4: Perubahan Zat & Pemisahan Campuran",
        "isi": "yang tepat! Perubahan Fisika tidak menghasilkan zat baru dan bisa kembali (es mencair, kayu jadi meja, gula larut). Perubahan Kimia menghasilkan zat baru, cirinya ada 4: perubahan warna, suhu berubah, timbul gas, atau terbentuk endapan (besi berkarat, nasi basi, kayu dibakar, fermentasi tapai). (1) Destilasi (beda titik didih)  ·  (2) Filtrasi (saring endapan)  ·  (3) Kromatografi (pisah warna tinta)",
        "poinPenting": [
          "Bedakan perubahan fisika vs kimia dan pilih teknik pemisahan campuran",
          "Pondasi · 5 Metode Pemisahan Campuran Wajib Hafal Filtrasi (Penyaringan): Beda ukuran partikel (air keruh/ampas kopi). Destilasi (Penyulingan): Beda titik didih (air + alkohol, minyak bumi). Kristalisasi (Penguapan): Mendapat padatan terlarut (garam dari air laut). Sublimasi: Zat mudah menyublim (kapur barus + pasir). Kromatografi: Beda kecepatan merambat warna (tinta spidol, klorofil)."
        ]
      },
      {
        "subjudul": "Unit 1.5: Asam, Basa, Garam & Skala pH",
        "isi": "Asam (pH < 7) terasa masam, korosif, melepas ion H⁺ (cuka, jeruk, asam lambung HCl). Basa (pH > 7) terasa pahit, licin di kulit, melepas ion OH⁻ (sabun, deterjen, obat maag Mg(OH)₂). Netral (pH = 7) contohnya air murni dan larutan garam dapur (NaCl). Asam (pH < 7): lakmus biru → merah  |  Netral (pH = 7)  |  Basa (pH > 7): lakmus merah → biru",
        "poinPenting": [
          "Cukup pegang skala pH 0–14 dan trik warna kertas lakmus anti-ketukar!",
          "Pondasi · Indikator Alami (Sering Keluar!) Kunyit: Dalam asam berwarna kuning cerah, dalam basa berubah jadi merah bata/jingga gelap. Kubis Ungu: Asam → merah/pink; Netral → ungu; Basa → hijau/kuning. Bunga Sepatu: Asam → merah cerah; Basa → hijau."
        ]
      },
      {
        "subjudul": "Unit 1.6: Suhu & Konversi Termometer",
        "isi": "Suhu adalah derajat panas/dinginnya suatu benda (satuan SI: Kelvin, bukan Celcius!). Ada 4 skala utama yang dibandingkan dari titik tetap bawah (es melebur) sampai titik tetap atas (air mendidih): Celcius (°C) Atas: 100° Skala: 5 Bawah: 0° Reamur (°R) Atas: 80° Skala: 4 Bawah: 0° Fahrenheit (°F) Atas: 212° Skala: 9 Bawah: 32° Kelvin (K) Atas: 373 Skala: 5 Bawah: 273 Rumus Umum Termometer X: (T_X − Bawah_X) / (Atas_X − Bawah_X) = C / 100",
        "poinPenting": [
          "Pegang 1 rasio ajaib 5 : 4 : 9 : 5, semua soal konversi suhu langsung beres!",
          "Pondasi · Konversi Kilat dari Celcius R = (4/5) × C  |  F = (9/5) × C + 32  |  K = C + 273 Contoh 40°C: R = (4/5)×40 = 32°R · F = (9/5)×40 + 32 = 104°F · K = 40 + 273 = 313 K."
        ]
      },
      {
        "subjudul": "Unit 1.7: Pemuaian & Kalor (Grafik Es–Uap)",
        "isi": "Pemuaian: Benda memuai saat dipanaskan (ΔL = L₀·α·ΔT). Pada keping bimetal (2 logam direkatkan), saat dipanaskan ia melengkung ke arah logam yang koefisien muainya (α) lebih kecil; saat didinginkan melengkung ke arah α lebih besar. T(°C) Kalor (Q) 0°C 100° A B C D E Q₁=mc_esΔTQ₂ = m·L (Melebur) Q₃=mc_airΔT Q₄ = m·U (Menguap)",
        "poinPenting": [
          "Pahami beda garis MIRING (suhu naik) vs garis DATAR (berubah wujud)!",
          "Pondasi · Asas Black (Pencampuran Zat) Saat air panas dicampur air dingin, kalor yang dilepas = kalor yang diterima: Q_lepas = Q_terima → m₁·c₁·(T₁ − T_c) = m₂·c₂·(T_c − T₂)."
        ]
      },
      {
        "subjudul": "Unit 1.8: Perpindahan Kalor (Konduksi–Konveksi–Radiasi)",
        "isi": "Pernah pegang gagang sendok logam di teh panas lalu terasa ikut panas? Itu Konduksi! Kalor berpindah dengan 3 mekanisme berbeda tergantung ada atau tidaknya zat perantara (medium): Kiri: Konduksi (gagang), Konveksi (aliran air), Radiasi (pancaran)  |  Kanan: Penampang Termos (vakum & kaca perak)",
        "poinPenting": [
          "Panas selalu mengalir dari suhu TINGGI ke suhu RENDAH lewat 3 cara!",
          "Pondasi · Rahasia Termos Air Panas Termos dirancang menahan ketiga perpindahan kalor sekaligus: Tutup gabus/plastik: Mencegah konduksi (bahan isolator). Ruang hampa udara (vakum): Mencegah konveksi & konduksi. Dinding kaca berlapis perak mengilap: Memantulkan panas → mencegah radiasi!"
        ]
      },
      {
        "subjudul": "Unit 1.9: Zat Aditif & Zat Adiktif",
        "isi": "Zat Aditif sengaja ditambahkan pada makanan/minuman untuk memperbaiki warna, rasa, aroma, atau daya tahan. Ada yang alami (aman) dan buatan/sintetis (dibatasi dosisnya, bahkan ada yang dilarang keras seperti Boraks, Formalin, Rhodamin B, dan Methanil Yellow). ZAT ADITIF (Pangan) • Pewarna: Pandan / Tartrazin • Pemanis: Gula / Aspartam, Sakarin • Pengawet: Garam / Natrium Benzoat • Penyedap: Bawang / MSG (Vetsin) DILARANG: Boraks, Formalin, Rhodamin B ZAT ADIKTIF (Kecanduan) • Stimulan (memacu saraf): Kafein, Nikotin, Kokain, Sabu • Depresan (menekan saraf): Alkohol, Morfin, Heroin, Obat tidur • Halusinogen: LSD, Ganja (khayalan)",
        "poinPenting": [
          "Sering tertukar! Aditif = tambahan makanan; Adiktif = bikin ketagihan!",
          "Pondasi · Membaca Komposisi Kemasan Makanan Di soal literasi sains, sering ditampilkan label komposisi minuman kemasan! Kenali nama kimia aditif sintetis yang sah: Natrium benzoat / Asam sorbat → Pengawet. Aspartam / Asesulfam-K / Siklamat → Pemanis buatan. Tartrazin (kuning) / Biru berlian → Pewarna sintetis. Mononatrium glutamat (MSG) → Penguat rasa (penyedap)."
        ]
      },
      {
        "subjudul": "Unit 1.10: Energi Kinetik, Potensial & Mekanik",
        "isi": "Dalam fisika SMP, ada dua energi mekanik utama: Energi Potensial (Ep) karena ketinggian benda (Ep = m·g·h) dan Energi Kinetik (Ek) karena gerak/kecepatan benda (Ek = $\\frac{1}{2}$·m·v²). Jumlah keduanya adalah Energi Mekanik (Em = Ep + Ek) yang nilainya selalu tetap jika gesekan diabaikan! 1Puncak (h=10m) Ep = 200 J (Maks) Ek = 0 J 2 Tengah (h=4m) Ep = 80 J · Ek = 120 J Em tetap = 200 J! 3 Tanah (h=0m) Ep = 0 J Ek = 200 J (Maks)",
        "poinPenting": [
          "Energi tak bisa diciptakan atau dimusnahkan—hanya berubah bentuk!",
          "Pondasi · Energi Terbarukan vs Tak Terbarukan Terbarukan (ramah lingkungan): Matahari (surya), angin (bayu), air (hidro), panas bumi (geotermal), biomassa/biogas. Tak Terbarukan (fosil, terbatas): Batu bara, minyak bumi, gas alam."
        ]
      }
    ],
    "trikCepat": "Trik Cepat · Rumus B-T-K Ingat akronim B-T-K: Bebas = di-Bedakan, Terikat = di-Teliti/diukur hasilnya, Kontrol = di-Kembarang/disamakan!",
    "jebakanUmum": "Dalam kalimat “Pengaruh X terhadap Y”, jangan sampai terbalik: X selalu Variabel Bebas, sedangkan Y selalu Variabel Terikat!",
    "contohSoal": [
      {
        "soal": "Dina menanam 3 pot kacang hijau dengan ukuran pot, jenis tanah, dan volume air yang sama. Pot A diletakkan di tempat terang, Pot B di tempat redup, Pot C di lemari gelap. Setelah 7 hari, Dina mengukur tinggi batang tiap pot. Tentukan variabel bebas, terikat, dan kontrolnya! Pembahasan: Yang sengaja dibedakan Dina adalah intensitas cahaya (terang/redup/gelap) → Variabel Bebas. Yang diukur sebagai hasilnya adalah tinggi batang → Variabel Terikat. Yang dijaga tetap sama (pot, tanah, air, jenis biji) → Variabel Kontrol. Jawaban: Bebas = intensitas cahaya; Terikat = tinggi batang; Kontrol = pot, tanah, air.",
        "opsi": {
          "A": "Opsi A",
          "B": "Opsi B",
          "C": "Opsi C",
          "D": "Opsi D"
        },
        "kunci": "B",
        "pembahasanLangkah": [
          "Yuk Bahas · Menentukan Variabel Eksperimen Soal: Dina menanam 3 pot kacang hijau dengan ukuran pot, jenis tanah, dan volume air yang sama. Pot A diletakkan di tempat terang, Pot B di tempat redup, Pot C di lemari gelap. Setelah 7 hari, Dina mengukur tinggi batang tiap pot. Tentukan variabel bebas, terikat, dan kontrolnya! Pembahasan: Yang sengaja dibedakan Dina adalah intensitas cahaya (terang/redup/gelap) → Variabel Bebas. Yang diukur sebagai hasilnya adalah tinggi batang → Variabel Terikat. Yang dijaga tetap sama (pot, tanah, air, jenis biji) → Variabel Kontrol. Jawaban: Bebas = intensitas cahaya; Terikat = tinggi batang; Kontrol = pot, tanah, air."
        ]
      },
      {
        "soal": "Tiga lengan neraca Ohaus menunjukkan beban masing-masing 200 g, 40 g, dan 5,5 g. Berapa massa benda dalam satuan SI (kg)? Pembahasan: Jumlahkan ketiga lengan: 200 + 40 + 5,5 = 245,5 gram. Karena satuan SI massa adalah kilogram (kg), bagi dengan 1.000 → 245,5 / 1.000 = 0,2455 kg. Jawaban: 245,5 gram atau 0,2455 kg.",
        "opsi": {
          "A": "Opsi A",
          "B": "Opsi B",
          "C": "Opsi C",
          "D": "Opsi D"
        },
        "kunci": "C",
        "pembahasanLangkah": [
          "Yuk Bahas · Membaca Neraca Ohaus & Konversi Soal: Tiga lengan neraca Ohaus menunjukkan beban masing-masing 200 g, 40 g, dan 5,5 g. Berapa massa benda dalam satuan SI (kg)? Pembahasan: Jumlahkan ketiga lengan: 200 + 40 + 5,5 = 245,5 gram. Karena satuan SI massa adalah kilogram (kg), bagi dengan 1.000 → 245,5 / 1.000 = 0,2455 kg. Jawaban: 245,5 gram atau 0,2455 kg."
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "ipa_smp_b1_q1",
        "soal": "Level 1 · PG1. Pengukuran: Skala utama mikrometer sekrup menunjukkan 3,5 mm dan skala putar segaris di angka 14. Hasil pengukuran tebal pelat logam tersebut adalah …",
        "opsi": {
          "A": "3,14 mm",
          "B": "3,54 mm",
          "C": "3,64 mm",
          "D": "4,90 mm"
        },
        "kunci": "C",
        "pembahasan": "Skala utama = 3,5 mm, skala putar = $14 \\times 0,01 = 0,14$ mm. Jumlahkan: $3,5 + 0,14 = 3,64$ mm. (Jangan terkecoh 3,14 mm!)."
      },
      {
        "id": "ipa_smp_b1_q2",
        "soal": "Level 1 · PG2. Perubahan Zat: Berikut yang termasuk contoh perubahan kimia dalam kehidupan sehari-hari adalah …",
        "opsi": {
          "A": "Es batu mencair di dalam gelas",
          "B": "Kapur barus menyublim di lemari pakaian",
          "C": "Susu segar berubah menjadi yoghurt",
          "D": "Garam dilarutkan ke dalam air hangat"
        },
        "kunci": "C",
        "pembahasan": "Pembuatan yoghurt melibatkan fermentasi bakteri Lactobacillus yang menghasilkan asam laktat (zat baru) → perubahan kimia. Pilihan A, B, dan D hanya perubahan wujud atau pelarutan (perubahan fisika)."
      },
      {
        "id": "ipa_smp_b1_q3",
        "soal": "Level 2 · PG3. Massa Jenis: Kubus logam bersisi 2 cm memiliki massa 64 g. Massa jenis logam tersebut dalam satuan standar internasional (SI) adalah …",
        "opsi": {
          "A": "8 kg/m³",
          "B": "800 kg/m³",
          "C": "8.000 kg/m³",
          "D": "32.000 kg/m³"
        },
        "kunci": "C",
        "pembahasan": "Volume kubus $V = s^3 = 2^3 = 8\\text{ cm}^3$. Massa jenis $\\rho = \\frac{m}{V} = \\frac{64}{8} = 8\\text{ g/cm}^3$. Konversi ke SI (dikalikan 1.000): $8 \\times 1.000 = 8.000\\text{ kg/m}^3$."
      },
      {
        "id": "ipa_smp_b1_q4",
        "soal": "Level 2 · PG4. Suhu: Suhu sebuah ruangan laboratorium tercatat 35°C. Jika diukur menggunakan termometer Fahrenheit, suhu ruangan tersebut adalah …",
        "opsi": {
          "A": "63°F",
          "B": "85°F",
          "C": "95°F",
          "D": "105°F"
        },
        "kunci": "C",
        "pembahasan": "Rumus konversi Celcius ke Fahrenheit: $F = (\\frac{9}{5} \\times C) + 32 = (\\frac{9}{5} \\times 35) + 32 = (9 \\times 7) + 32 = 63 + 32 = 95^\\circ\\text{F}$."
      },
      {
        "id": "ipa_smp_b1_q5",
        "soal": "Level 3 · PG5. Kalor: Sebanyak 2 kg air bersuhu 20°C dipanaskan hingga 70°C ($c_{\\text{air}} = 4.200\\text{ J/kg}^\\circ\\text{C}$). Besar kalor yang dibutuhkan adalah …",
        "opsi": {
          "A": "210 kJ",
          "B": "420 kJ",
          "C": "588 kJ",
          "D": "840 kJ"
        },
        "kunci": "B",
        "pembahasan": "Perubahan suhu $\\Delta T = 70 - 20 = 50^\\circ\\text{C}$. Kalor $Q = m \\cdot c \\cdot \\Delta T = 2 \\times 4.200 \\times 50 = 420.000\\text{ J} = 420\\text{ kJ}$. Trik cepat: $2 \\times 50 = 100$, lalu $100 \\times 4.200 = 420.000\\text{ J}$."
      },
      {
        "id": "ipa_smp_b1_q6",
        "soal": "Level 3 · PGK MCMA6. Asam–Basa & Energi: Pilih dua pernyataan yang BENAR dari daftar berikut:\n(1) Larutan dengan pH 3 dapat mengubah lakmus biru menjadi merah.\n(2) Angin laut terjadi pada malam hari dan bertiup dari laut menuju darat.\n(3) Buah kelapa jatuh mengalami perubahan Energi Potensial menjadi Energi Kinetik.\n(4) Pemisahan campuran air dan alkohol paling tepat menggunakan metode filtrasi.",
        "opsi": {
          "A": "(1) dan (3)",
          "B": "(1) dan (2)",
          "C": "(2) dan (4)",
          "D": "(3) dan (4)"
        },
        "kunci": "A",
        "pembahasan": "Analisis butir:\n• (1) BENAR: pH 3 bersifat asam, lakmus biru berubah menjadi merah.\n• (2) SALAH: Angin laut terjadi siang hari (malam hari adalah angin darat).\n• (3) BENAR: Saat jatuh, ketinggian berkurang ($E_p$ turun) dan kecepatan bertambah ($E_k$ naik).\n• (4) SALAH: Air dan alkohol dipisahkan dengan destilasi (titik didih berbeda), bukan filtrasi.\nJadi pernyataan yang benar adalah (1) dan (3)."
      }
    ]
  },
  {
    "id": "ipa_smp_bab_2",
    "subtestKode": "IPA_SMP",
    "subtestNama": "Ilmu Pengetahuan Alam (IPA CP Fase D)",
    "subtestSingkatan": "IPA",
    "subtestEmoji": "🔬",
    "subtestWarna": "#059669",
    "subtestBgLight": "#ecfdf5",
    "babNumber": 2,
    "slug": "mekanika-gelombang-optik-listrik-magnet",
    "judul": "Bab 2 · Mekanika, Gelombang, Optik, Listrik & Magnet",
    "durasiBacaMenit": 16,
    "ringkasanSingkat": "Gerak lurus (GLB & GLBB), 3 Hukum Newton, tekanan zat cair ($P = \\rho gh$), getaran-gelombang ($v = \\lambda f$), cermin-lensa, dan Hukum Ohm ($V = IR$).",
    "learningObjectives": [
      "Menganalisis grafik gerak $v-t$ dan pola titik ticker timer GLB/GLBB dipercepat-diperlambat.",
      "Menerapkan Hukum II dan III Newton serta rumus tekanan hidrostatis dan Hukum Pascal.",
      "Menghitung frekuensi gelombang, pembentukan bayangan cermin/lensa, serta hambatan rangkaian seri-paralel."
    ],
    "pdfUrl": "/modul-pdf/Modul_Master_TKA_SMP_IPA_2027.pdf",
    "pdfFilename": "Modul_Master_TKA_SMP_IPA_2027.pdf",
    "pdfTotalHalaman": 52,
    "isUtama": false,
    "units": [
      {
        "unitNumber": "2.1",
        "judul": "Gerak Lurus (GLB, GLBB & Grafik v–t)",
        "hook": "Kuasai 3 grafik sakti dan cara cepat baca pita ticker timer tanpa bingung!",
        "teori": "GLB (Gerak Lurus Beraturan): Kecepatan tetap (a = 0), rumus v = s / t. GLBB (Gerak Lurus Berubah Beraturan): Kecepatan berubah teratur karena ada percepatan tetap (a = (v_t − v₀) / t). Bisa dipercepat (bola jatuh) atau diperlambat (bola dilempar ke atas / mobil direm). GLB (v tetap) v t Ticker timer: • • • • • GLBB Dipercepat v t Tetesan oli (F→): • • • • • GLBB Diperlambat v t Tetesan oli (F→): • • • • •",
        "pondasi": "Pondasi · Jarak vs Perpindahan & Konversi km/jam Jarak: Total lintasan yang ditempuh (selalu dijumlah). Perpindahan: Garis lurus dari posisi awal ke akhir (pakai Pythagoras jika belok 90°). Konversi cepat: km/jam → m/s tinggal bagi 3,6 (contoh: 72 km/jam = 20 m/s).",
        "jebakanTka": "Tetesan Oli dibaca searah gerak mobil (jarak makin lebar = dipercepat). Sebaliknya, Pita Ticker Timer ditarik dari ujung depan, jadi dibaca dari arah yang ditarik (berlawanan panah)!",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 2.1",
          "soal": "Sebuah mobil bergerak dengan kecepatan awal 10 m/s lalu dipercepat beraturan hingga menjadi 22 m/s dalam waktu 4 sekon. Hitung percepatan dan jarak tempuhnya! Pembahasan: Percepatan a = (22 − 10) / 4 = 12 / 4 = 3 m/s². Untuk jarak, pakai trik Luas Trapesium di bawah grafik v–t: s = $\\frac{1}{2}$ × (v₀ + v_t) × t = $\\frac{1}{2}$ × (10 + 22) × 4 = 16 × 4 = 64 m! Jawaban: a = 3 m/s² dan jarak s = 64 meter.",
          "opsiString": "",
          "jawaban": "",
          "solusi": "Yuk Bahas · Percepatan & Jarak dari Grafik v–t Soal: Sebuah mobil bergerak dengan kecepatan awal 10 m/s lalu dipercepat beraturan hingga menjadi 22 m/s dalam waktu 4 sekon. Hitung percepatan dan jarak tempuhnya! Pembahasan: Percepatan a = (22 − 10) / 4 = 12 / 4 = 3 m/s². Untuk jarak, pakai trik Luas Trapesium di bawah grafik v–t: s = $\\frac{1}{2}$ × (v₀ + v_t) × t = $\\frac{1}{2}$ × (10 + 22) × 4 = 16 × 4 = 64 m! Jawaban: a = 3 m/s² dan jarak s = 64 meter."
        },
        "trikCepat": "Trik Cepat · Jarak = Luas Grafik v–t Ketemu grafik v–t? Tak perlu hafal rumus v₀t + $\\frac{1}{2}$at²! Cukup hitung luas bangun di bawah garis grafik (persegi panjang / segitiga / trapesium)!",
        "pageNumber": 16,
        "illustrationImg": null,
        "illustrationCaption": "",
        "slideImg": "/modul-assets/pages/ipa_p16.png"
      },
      {
        "unitNumber": "2.2",
        "judul": "Gaya & Hukum Newton I, II, III",
        "hook": "Kenapa tubuhmu terdorong ke depan saat bus direm mendadak? Itu Hukum",
        "teori": "Newton I! Gaya (F, Newton) adalah tarikan/dorongan. Jika beberapa gaya bekerja segaris, hitung Resultan Gaya (ΣF): gaya searah dijumlah, gaya berlawanan dikurang. Benda bergerak ke arah resultan yang lebih besar. Hukum Newton I ΣF = 0 (Inersia) Benda malas berubah Ex: Bus direm mendadak, kertas ditarik cepat, koin jatuh ke gelas Hukum Newton II a = ΣF / m Percepatan benda Ex: Troli kosong lebih cepat melaju daripada troli penuh barang Hukum Newton III F_aksi = −F_reaksi Gaya berpasangan Ex: Roket meluncur, mendayung perahu, tangan dorong tembok",
        "pondasi": "Pondasi · Gaya Gesek Gaya gesek selalu berlawanan arah dengan arah gerak benda. Ada yang menguntungkan (alas sepatu bergerigi, rem mobil) dan merugikan (mesin aus → dikurangi dengan oli/pelumas).",
        "jebakanTka": "Massa (m) selalu TETAP di mana pun (di Bumi maupun Bulan). Berat (w = m·g) bisa berubah tergantung gravitasi! Di Bulan (g_Bulan = 1/6 g_Bumi), beratmu jadi 1/6-nya, tapi massamu tetap!",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 2.2",
          "soal": "Sebuah balok bermassa 4 kg di lantai licin ditarik ke kanan oleh dua anak dengan gaya 30 N dan 10 N, sementara satu anak menarik ke kiri dengan gaya 16 N. Hitung percepatan balok dan arahnya! Pembahasan: Resultan gaya: ΣF = (30 + 10) − 16 = 40 − 16 = 24 N ke kanan. Pakai Hukum Newton II: a = ΣF / m = 24 / 4 = 6 m/s² ke kanan. Jawaban: 6 m/s² ke arah kanan.",
          "opsiString": "",
          "jawaban": "",
          "solusi": "Yuk Bahas · Resultan Gaya & Percepatan Balok Soal: Sebuah balok bermassa 4 kg di lantai licin ditarik ke kanan oleh dua anak dengan gaya 30 N dan 10 N, sementara satu anak menarik ke kiri dengan gaya 16 N. Hitung percepatan balok dan arahnya! Pembahasan: Resultan gaya: ΣF = (30 + 10) − 16 = 40 − 16 = 24 N ke kanan. Pakai Hukum Newton II: a = ΣF / m = 24 / 4 = 6 m/s² ke kanan. Jawaban: 6 m/s² ke arah kanan."
        },
        "trikCepat": "Trik Cepat · 3 Kata Kunci Newton Newton I = kaget/malas (rem mendadak, gas mendadak). Newton II = hitungan F = m·a. Newton III = dorong ke belakang, melaju ke depan (roket, renang, dayung)!",
        "pageNumber": 17,
        "illustrationImg": null,
        "illustrationCaption": "",
        "slideImg": "/modul-assets/pages/ipa_p17.png"
      },
      {
        "unitNumber": "2.3",
        "judul": "Usaha, Daya & Pesawat Sederhana",
        "hook": "Kerja keras dorong tembok sampai keringatan, tapi tembok tak pindah →",
        "teori": "Usaha = NOL! Usaha (W, Joule) terjadi jika gaya menyebabkan perpindahan: W = ΣF × s. Daya (P, Watt) adalah kecepatan melakukan usaha: P = W / t. Untuk mempermudah usaha, kita pakai Pesawat Sederhana yang punya Keuntungan Mekanis (KM = w / F): (1) Tuas (w·Lb = F·Lk)  ·  (2) Bidang Miring (KM = s/h)  ·  (3) Katrol Majemuk (KM = jumlah tali penopang)",
        "pondasi": "Pondasi · Cara Memperbesar Keuntungan Tuas Agar gaya kuasa F makin kecil (ringan), kita harus memperpanjang Lengan Kuasa (Lk) atau menggeser titik tumpu mendekati beban (memperpendek Lb)!",
        "jebakanTka": "Hafalkan apa yang ada di TENGAH: Jenis 1 (Tumpu tengah): gunting, tang, jungkat-jungkit. Jenis 2 (Beban tengah): gerobak dorong, pemecah kemiri. Jenis 3 (Kuasa tengah): pinset, sekop, lengan atas manusia!",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 2.3",
          "soal": "Sebuah batu seberat 600 N diungkit memakai linggis. Jarak beban ke titik tumpu (Lb) adalah 0,5 m, sedangkan jarak kuasa ke titik tumpu (Lk) adalah 2 m. Berapa gaya minimal untuk mengangkat batu tersebut? Pembahasan: Hitung Keuntungan Mekanis: KM = Lk / Lb = 2 / 0,5 = 4. Maka gaya kuasa F = w / KM = 600 / 4 = 150 N. (Bisa juga langsung: 600 × 0,5 = F × 2 → 300 = 2F → F = 150 N.) Jawaban: KM = 4 dan gaya minimal F = 150 Newton.",
          "opsiString": "",
          "jawaban": "",
          "solusi": "Yuk Bahas · Menghitung Gaya Kuasa Tuas Soal: Sebuah batu seberat 600 N diungkit memakai linggis. Jarak beban ke titik tumpu (Lb) adalah 0,5 m, sedangkan jarak kuasa ke titik tumpu (Lk) adalah 2 m. Berapa gaya minimal untuk mengangkat batu tersebut? Pembahasan: Hitung Keuntungan Mekanis: KM = Lk / Lb = 2 / 0,5 = 4. Maka gaya kuasa F = w / KM = 600 / 4 = 150 N. (Bisa juga langsung: 600 × 0,5 = F × 2 → 300 = 2F → F = 150 N.) Jawaban: KM = 4 dan gaya minimal F = 150 Newton."
        },
        "trikCepat": "Trik Cepat · Tuas = “Tu-Be-Ku” Jenis 1-2-3 cukup ingat urutan yang di tengah: Tu (Tumpu = 1), Be (Beban = 2), Ku (Kuasa = 3). Pada bidang miring, s selalu panjang papan miring, bukan alas datarnya!",
        "pageNumber": 18,
        "illustrationImg": "/modul-assets/illustrations/ipa_p18.jpeg",
        "illustrationCaption": "",
        "slideImg": "/modul-assets/pages/ipa_p18.png"
      },
      {
        "unitNumber": "2.4",
        "judul": "Tekanan Zat, Pascal & Archimedes",
        "hook": "Kenapa bebek mudah jalan di lumpur sedangkan ayam malah ambles? Luas",
        "teori": "alasnya! Tekanan Zat Padat: P = F / A (Pascal atau N/m²). Makin kecil luas bidang tekan (A), makin besar tekanannya (pisau tajam, paku runcing). Sebaliknya kaki bebek berselaput (A besar) → tekanan kecil → tidak ambles! Kiri: Dongkrak Hidrolik Pascal (F₁/A₁ = F₂/A₂)  |  Kanan: Archimedes (Mengapung, Melayang, Tenggelam)",
        "pondasi": "Pondasi · Tekanan Udara & Aplikasi Biologi Tekanan Udara (Barometer): Tiap naik 100 m dari permukaan laut, tekanan udara turun 1 cmHg (di pantai = 76 cmHg). Di Tubuh & Tumbuhan: Tekanan darah (tensimeter → Hukum Pascal), pengangkutan air di xilem tumbuhan (kapilaritas + daya isap daun).",
        "jebakanTka": "Jika akuarium sedalam 100 cm dan ikan berada 30 cm dari dasar, maka kedalaman ikan h BUKAN 30 cm, melainkan 100 − 30 = 70 cm = 0,7 m dari permukaan air!",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 2.4",
          "soal": "Sebuah dongkrak hidrolik memiliki luas penampang kecil A₁ = 5 cm² dan penampang besar A₂ = 200 cm². Berapa gaya F₁ yang diperlukan untuk mengangkat mobil seberat 8.000 N? Pembahasan: Karena perbandingan A₁/A₂ satuannya sama-sama cm², tak perlu diubah ke m²! F₁ / 5 = 8.000 / 200 → F₁ / 5 = 40 → F₁ = 40 × 5 = 200 N. Jawaban: 200 Newton.",
          "opsiString": "",
          "jawaban": "",
          "solusi": "Yuk Bahas · Dongkrak Hidrolik (Hukum Pascal) Soal: Sebuah dongkrak hidrolik memiliki luas penampang kecil A₁ = 5 cm² dan penampang besar A₂ = 200 cm². Berapa gaya F₁ yang diperlukan untuk mengangkat mobil seberat 8.000 N? Pembahasan: Karena perbandingan A₁/A₂ satuannya sama-sama cm², tak perlu diubah ke m²! F₁ / 5 = 8.000 / 200 → F₁ / 5 = 40 → F₁ = 40 × 5 = 200 N. Jawaban: 200 Newton."
        },
        "trikCepat": "Trik Cepat · Cek Luas Alas Terkecil Kalau soal menampilkan 4 balok bermassa sama dan menanya “mana tekanan terbesar?”, langsung pilih balok yang luas alas bawahnya paling kecil!",
        "pageNumber": 19,
        "illustrationImg": "/modul-assets/illustrations/ipa_p19.jpeg",
        "illustrationCaption": "Tekanan Zat Padat: P = F / A (Pascal atau N/m²). Makin kecil luas bidang tekan (A), makin besar tekanannya (pisau tajam, paku runcing). Sebaliknya kaki bebek berselaput (A besar) → tekanan kecil → tidak ambles!",
        "slideImg": "/modul-assets/pages/ipa_p19.png"
      },
      {
        "unitNumber": "2.5",
        "judul": "Getaran, Gelombang & Bunyi",
        "hook": "Pahami 1 gelombang penuh, rumus v = λ·f, dan pantulan bunyi (sonar)!",
        "teori": "Getaran adalah gerak bolak-balik di sekitar titik seimbang (bandul A–B–C–B–A = 1 getaran penuh). Frekuensi f = n / t (Hz), Periode T = t / n = 1 / f (s). Gelombang adalah getaran yang merambat: Transversal (bukit + lembah, ex: tali, cahaya) dan Longitudinal (rapatan + regangan, ex: bunyi). 1 λ (1 Bukit + 1 Lembah) A (Amplitudo) Total di gambar = 2 λ v = λ · f = λ / T",
        "pondasi": "Pondasi · Klasifikasi Frekuensi Bunyi & Resonansi Infrasonik (< 20 Hz): Gajah, jangkrik, anjing. Audiosonik (20 – 20.000 Hz): Dapat didengar telinga manusia. Ultrasonik (> 20.000 Hz): Kelelawar, lumba-lumba, USG medis, sonar. Resonansi: Ikut bergetarnya benda karena frekuensinya sama (kotak gitar, bandul dengan panjang tali sama).",
        "jebakanTka": "Saat kapal menembakkan sonar ke dasar laut, bunyi menempuh perjalanan bolak-balik (turun + naik)! Jadi rumus kedalaman laut wajib dibagi 2: s = (v × t) / 2!",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 2.5",
          "soal": "Yuk Bahas · Gelombang Tali & Kedalaman Laut Soal 1: Pada grafik di samping, panjang total 2 gelombang adalah 12 m dan ditempuh dalam 4 s. Berapa cepat rambat gelombangnya? Pembahasan: λ = 12 / 2 = 6 m; f = n / t = 2 / 4 = 0,5 Hz. Maka v = λ × f = 6 × 0,5 = 3 m/s. (Atau langsung v = jarak / waktu = 12 / 4 = 3 m/s!) Soal 2: Sonar kapal kembali setelah 2 s (v = 1.500 m/s). Kedalaman laut = (1.500 × 2) / 2 = 1.500 m. Jawaban: (1) v = 3 m/s; (2) Kedalaman = 1.500 m.",
          "opsiString": "",
          "jawaban": "(1)",
          "solusi": "Yuk Bahas · Gelombang Tali & Kedalaman Laut Soal 1: Pada grafik di samping, panjang total 2 gelombang adalah 12 m dan ditempuh dalam 4 s. Berapa cepat rambat gelombangnya? Pembahasan: λ = 12 / 2 = 6 m; f = n / t = 2 / 4 = 0,5 Hz. Maka v = λ × f = 6 × 0,5 = 3 m/s. (Atau langsung v = jarak / waktu = 12 / 4 = 3 m/s!) Soal 2: Sonar kapal kembali setelah 2 s (v = 1.500 m/s). Kedalaman laut = (1.500 × 2) / 2 = 1.500 m. Jawaban: (1) v = 3 m/s; (2) Kedalaman = 1.500 m."
        },
        "trikCepat": "",
        "pageNumber": 20,
        "illustrationImg": null,
        "illustrationCaption": "",
        "slideImg": "/modul-assets/pages/ipa_p20.png"
      },
      {
        "unitNumber": "2.6",
        "judul": "Cahaya, Cermin, Lensa & Cacat Mata",
        "hook": "Cukup pegang 1 rumus optik dan aturan tanda (+) vs (−) biar anti-keliru!",
        "teori": "Cahaya merambat lurus, dapat dipantulkan (cermin), dan dibiaskan (lensa). Untuk cermin lengkung maupun lensa tipis, rumusnya SAMA PERSIS: 1/f = 1/s + 1/s' dan perbesaran M = |s'/s| = h'/h, dengan f = $\\frac{1}{2}$ R. Kiri: Cermin Cekung & Lensa Cembung (kumpulkan sinar)  |  Kanan: Miopi (depan retina) & Hipermetropi (belakang retina)",
        "pondasi": "Pondasi · Cermin Datar & Jumlah Bayangan Bayangan cermin datar selalu maya, tegak, sama besar, terbalik kanan-kiri. Dua cermin datar membentuk sudut α menghasilkan n = (360° / α) − 1 bayangan (misal α = 60° → n = 6 − 1 = 5 bayangan).",
        "jebakanTka": "Miopi (rabun jauh): Bayangan jatuh di depan retina → ditolong lensa cekung (−), P = −100 / PR(cm). Hipermetropi (rabun dekat): Bayangan di belakang retina → lensa cembung (+), P = 4 − 100/PP(cm).",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 2.6",
          "soal": "Yuk Bahas · Bayangan Cermin Cekung & Kacamata Soal 1: Benda diletakkan 15 cm di depan cermin cekung berfokus 10 cm. Tentukan letak dan sifat bayangan! Pembahasan: 1/s' = 1/f − 1/s = 1/10 − 1/15 = (3 − 2)/30 = 1/30 → s' = +30 cm. Perbesaran M = 30/15 = 2×. Karena s' (+) dan M > 1, sifatnya: Nyata, Terbalik, Diperbesar. Soal 2: Penderita miopi hanya jelas melihat maksimal 200 cm. Kekuatan kacamata: P = −100 / 200 = −0,5 Dioptri. Jawaban: (1) s' = 30 cm (Nyata, Terbalik, Diperbesar); (2) −0,5 D.",
          "opsiString": "",
          "jawaban": "(1)",
          "solusi": "Yuk Bahas · Bayangan Cermin Cekung & Kacamata Soal 1: Benda diletakkan 15 cm di depan cermin cekung berfokus 10 cm. Tentukan letak dan sifat bayangan! Pembahasan: 1/s' = 1/f − 1/s = 1/10 − 1/15 = (3 − 2)/30 = 1/30 → s' = +30 cm. Perbesaran M = 30/15 = 2×. Karena s' (+) dan M > 1, sifatnya: Nyata, Terbalik, Diperbesar. Soal 2: Penderita miopi hanya jelas melihat maksimal 200 cm. Kekuatan kacamata: P = −100 / 200 = −0,5 Dioptri. Jawaban: (1) s' = 30 cm (Nyata, Terbalik, Diperbesar); (2) −0,5 D."
        },
        "trikCepat": "Trik Cepat · Rumus Langsung s' Malas menyamakan penyebut? Pakai rumus kilat: s' = (s × f) / (s − f)! Cek: (15 × 10) / (15 − 10) = 150 / 5 = 30 cm!",
        "pageNumber": 21,
        "illustrationImg": "/modul-assets/illustrations/ipa_p21.jpeg",
        "illustrationCaption": "Kiri: Cermin Cekung & Lensa Cembung (kumpulkan sinar)  |  Kanan: Miopi",
        "slideImg": "/modul-assets/pages/ipa_p21.png"
      },
      {
        "unitNumber": "2.7",
        "judul": "Listrik Statis & Hukum Coulomb",
        "hook": "Hanya ELEKTRON (−) yang bisa pindah! Proton (+) diam di inti atom!",
        "teori": "Atom tersusun dari proton (+) dan neutron (0) di inti, serta elektron (−) di kulit atom. Benda bermuatan negatif jika menerima elektron; bermuatan positif jika kehilangan elektron. Muatan sejenis tolak-menolak, tak sejenis tarik-menarik. 2 Pasangan Gosok Wajib Hafal! 1. Penggaris Plastik + Kain Wol: Elektron pindah Wol → Plastik Plastik (−), Wol (+) 2. Batang Kaca + Kain Sutera: Elektron Kaca → Sutera | Kaca (+) Hukum Coulomb F = k · (q₁ · q₂) / r² F sebanding dengan q₁·q₂ F berbanding terbalik r²! (k = 9 × 10⁹ N·m²/C²)",
        "pondasi": "Pondasi · Elektroskop & Aplikasi Petir Elektroskop mendeteksi muatan benda: jika benda bermuatan didekatkan ke kepala elektroskop netral, kedua daun elektroskop membuka (mekar) karena bermuatan sejenis. Penangkal Petir menyalurkan loncatan elektron awan langsung ke bumi (grounding) agar aman.",
        "jebakanTka": "Setiap opsi yang menyebutkan “proton berpindah dari kaca ke sutera” itu 100% SALAH! Yang berpindah selalu elektron.",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 2.7",
          "soal": "Dua muatan listrik terpisah pada jarak r mengalami gaya tolak- menolak sebesar 40 N. Jika jarak kedua muatan diperbesar menjadi 2r (muatan tetap), berapakah gaya Coulombnya sekarang? Pembahasan: Karena F berbanding terbalik dengan kuadrat jarak (r²), saat jarak dikali 2, gaya dibagi 2² = 4! Jadi F₂ = 40 / 4 = 10 N. Jawaban: 10 Newton.",
          "opsiString": "",
          "jawaban": "",
          "solusi": "Yuk Bahas · Perbandingan Gaya Coulomb Soal: Dua muatan listrik terpisah pada jarak r mengalami gaya tolak- menolak sebesar 40 N. Jika jarak kedua muatan diperbesar menjadi 2r (muatan tetap), berapakah gaya Coulombnya sekarang? Pembahasan: Karena F berbanding terbalik dengan kuadrat jarak (r²), saat jarak dikali 2, gaya dibagi 2² = 4! Jadi F₂ = 40 / 4 = 10 N. Jawaban: 10 Newton."
        },
        "trikCepat": "Trik Cepat · “Pla-Min” & “Ka-Plus” Hafal 2 kata lucu: Pla-Min (Plastik jadi Minus) dan Ka-Plus (Kaca jadi Plus). Dijamin tak pernah ketukar lagi saat ujian!",
        "pageNumber": 22,
        "illustrationImg": null,
        "illustrationCaption": "",
        "slideImg": "/modul-assets/pages/ipa_p22.png"
      },
      {
        "unitNumber": "2.8",
        "judul": "Listrik Dinamis, Ohm & Seri–Paralel",
        "hook": "Pegang segitiga V–I–R (Hukum Ohm) dan cara bereskan rangkaian campuran!",
        "teori": "Arus listrik (I, Ampere) mengalir dari potensial tinggi (+) ke rendah (−), kebalikan arah elektron. Hukum Ohm: V = I × R (V = tegangan Volt, R = hambatan Ohm/Ω). Hukum I Kirchhoff: Jumlah arus masuk titik cabang = jumlah arus keluar (ΣI_masuk = ΣI_keluar). Kiri: Rangkaian Seri (1 jalur, arus sama, 1 putus padam semua)  |  Kanan: Rangkaian Paralel (bercabang, tegangan sama)",
        "pondasi": "Pondasi · Cara Pasang Amperemeter & Voltmeter Amperemeter (ukur arus I) dipasang secara SERI. Voltmeter (ukur tegangan V) dipasang secara PARALEL.",
        "jebakanTka": "Setelah menghitung 1/R_p = $\\frac{3}{6}$, jangan langsung jawab $\\frac{3}{6}$ Ω! Wajib dibalik jadi R_p = 6/3 = 2 Ω! Atau pakai trik cepat di kanan.",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 2.8",
          "soal": "Resistor R₂ = 6 Ω dan R₃ = 3 Ω disusun paralel, lalu diserikan dengan R₁ = 4 Ω dan dihubungkan ke baterai 12 V. Berapa kuat arus total rangkaian? Pembahasan: Bereskan paralel dulu dengan trik kali per tambah: R_p = (6 × 3) / (6 + 3) = 18 / 9 = 2 Ω. Lalu serikan dengan R₁: R_total = 4 + 2 = 6 Ω. Terakhir pakai Hukum Ohm: I = V / R_total = 12 / 6 = 2 Ampere. Jawaban: R_total = 6 Ω dan I = 2 Ampere.",
          "opsiString": "",
          "jawaban": "",
          "solusi": "Yuk Bahas · Rangkaian Campuran + Hukum Ohm Soal: Resistor R₂ = 6 Ω dan R₃ = 3 Ω disusun paralel, lalu diserikan dengan R₁ = 4 Ω dan dihubungkan ke baterai 12 V. Berapa kuat arus total rangkaian? Pembahasan: Bereskan paralel dulu dengan trik kali per tambah: R_p = (6 × 3) / (6 + 3) = 18 / 9 = 2 Ω. Lalu serikan dengan R₁: R_total = 4 + 2 = 6 Ω. Terakhir pakai Hukum Ohm: I = V / R_total = 12 / 6 = 2 Ampere. Jawaban: R_total = 6 Ω dan I = 2 Ampere."
        },
        "trikCepat": "Trik Cepat · Paralel 2 Resistor = Kali / Tambah Untuk 2 resistor paralel, langsung pakai R_p = (R₁ × R₂) / (R₁ + R₂)! Kalau 2 resistornya sama besar (misal 8 Ω & 8 Ω), tinggal bagi 2 → 4 Ω!",
        "pageNumber": 23,
        "illustrationImg": "/modul-assets/illustrations/ipa_p23.jpeg",
        "illustrationCaption": "Kiri: Rangkaian Seri (1 jalur, arus sama, 1 putus padam semua)  |  Kanan:",
        "slideImg": "/modul-assets/pages/ipa_p23.png"
      },
      {
        "unitNumber": "2.9",
        "judul": "Energi, Daya & Biaya Listrik (kWh)",
        "hook": "Soal paling langganan keluar tiap tahun—hitung tagihan listrik 30 hari!",
        "teori": "Daya listrik (P, Watt) adalah energi listrik yang dipakai tiap detik: P = V · I = I² · R = V² / R. Energi listrik (W, Joule) adalah W = P × t = V · I · t. Untuk tagihan PLN, satuan energinya bukan Joule, melainkan kWh (kilo-Watt- hour)! Langkah 1 Jumlah alat × Watt × Jam = Wh / hari → Langkah 2 Jumlahkan semua lalu ÷ 1.000 = kWh → Langkah 3 Kalikan 30 hari = kWh/bulan → Langkah 4 Kali tarif per kWh = Rupiah!",
        "pondasi": "Pondasi · Spesifikasi Lampu & Hemat Listrik Tulisan 220 V / 40 W pada lampu berarti lampu menyala normal dengan daya 40 W jika dipasang pada tegangan 220 V. Cara hemat listrik: ganti lampu pijar ke LED, cabut charger saat tidak dipakai, atur AC 25°C.",
        "jebakanTka": "Banyak siswa lupa mengalikan jumlah lampu (misal 4 lampu × 10 W) atau lupa membagi Wh dengan 1.000 untuk menjadi kWh!",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 2.9",
          "soal": "Sebuah rumah memakai 4 lampu 10 W (5 jam/hari), 1 TV 100 W (4 jam/hari), dan 1 kulkas 100 W (24 jam/hari). Jika tarif Rp1.500/kWh, berapa tagihan 1 bulan (30 hari)? Pembahasan: Lampu: 4 × 10 × 5 = 200 Wh · TV: 1 × 100 × 4 = 400 Wh · Kulkas: 1 × 100 × 24 = 2.400 Wh. Total harian = 200 + 400 + 2.400 = 3.000 Wh = 3 kWh. 30 hari = 3 × 30 = 90 kWh → Biaya = 90 × Rp1.500 = Rp135.000! Jawaban: Rp135.000,00.",
          "opsiString": "",
          "jawaban": "",
          "solusi": "Yuk Bahas · Menghitung Tagihan Listrik Rumah Soal: Sebuah rumah memakai 4 lampu 10 W (5 jam/hari), 1 TV 100 W (4 jam/hari), dan 1 kulkas 100 W (24 jam/hari). Jika tarif Rp1.500/kWh, berapa tagihan 1 bulan (30 hari)? Pembahasan: Lampu: 4 × 10 × 5 = 200 Wh · TV: 1 × 100 × 4 = 400 Wh · Kulkas: 1 × 100 × 24 = 2.400 Wh. Total harian = 200 + 400 + 2.400 = 3.000 Wh = 3 kWh. 30 hari = 3 × 30 = 90 kWh → Biaya = 90 × Rp1.500 = Rp135.000! Jawaban: Rp135.000,00."
        },
        "trikCepat": "",
        "pageNumber": 24,
        "illustrationImg": null,
        "illustrationCaption": "",
        "slideImg": "/modul-assets/pages/ipa_p24.png"
      },
      {
        "unitNumber": "2.10",
        "judul": "Kemagnetan, Lorentz & Transformator",
        "hook": "Pahami 3 cara membuat magnet, kaidah tangan kanan, dan rumus sakti trafo!",
        "teori": "Magnet punya kutub Utara (U/N) dan Selatan (S); sejenis tolak-menolak, tak sejenis tarik-menarik. 3 cara membuat magnet: (1) Menggosok searah (ujung terakhir digosok jadi kutub berlawanan), (2) Induksi (didekatkan, ujung terdekat jadi kutub berlawanan), dan (3) Elektromagnet (dililit kawat berarus DC → pakai kaidah genggaman tangan kanan: 4 jari = arah arus, jempol = kutub Utara!). Magnet Batang (medan U→S)  ·  Elektromagnet (paku + lilitan DC)  · Transformator (Vp/Vs = Np/Ns = Is/Ip)",
        "pondasi": "Pondasi · Jenis Bahan Magnetik Feromagnetik (ditarik kuat): Besi, baja, nikel, kobalt. Paramagnetik (ditarik lemah): Aluminium, platina. Diamagnetik (ditolak lemah): Bismut, emas, seng, kayu/plastik.",
        "jebakanTka": "Sifat magnet hilang jika dipanaskan/dibakar, dipukul-pukul, atau dialiri arus bolak-balik (AC). Ingat juga: Trafo hanya bekerja pada arus AC, bukan DC!",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 2.10",
          "soal": "Sebuah transformator ideal memiliki lilitan primer 1.000 dan lilitan sekunder 200. Jika dihubungkan ke sumber AC 220 V, berapakah tegangan sekundernya dan jenis trafonya? Pembahasan: Vp / Vs = Np / Ns → 220 / Vs = 1.000 / 200 = 5 → Vs = 220 / 5 = 44 Volt. Karena tegangan turun (220 V → 44 V) dan Ns < Np, maka ini Trafo Step-Down. Jawaban: Vs = 44 Volt (Trafo Step-Down).",
          "opsiString": "",
          "jawaban": "",
          "solusi": "Yuk Bahas · Menghitung Tegangan Trafo Soal: Sebuah transformator ideal memiliki lilitan primer 1.000 dan lilitan sekunder 200. Jika dihubungkan ke sumber AC 220 V, berapakah tegangan sekundernya dan jenis trafonya? Pembahasan: Vp / Vs = Np / Ns → 220 / Vs = 1.000 / 200 = 5 → Vs = 220 / 5 = 44 Volt. Karena tegangan turun (220 V → 44 V) dan Ns < Np, maka ini Trafo Step-Down. Jawaban: Vs = 44 Volt (Trafo Step-Down)."
        },
        "trikCepat": "Trik Cepat · Cek Rasio Lilitan! Lilitan turun 5× (1.000 → 200), maka tegangan otomatis ikut turun 5× (220 ÷ 5 = 44 V), sedangkan arusnya malah naik 5×!",
        "pageNumber": 25,
        "illustrationImg": "/modul-assets/illustrations/ipa_p25.jpeg",
        "illustrationCaption": "Magnet punya kutub Utara (U/N) dan Selatan (S); sejenis tolak-menolak, tak sejenis tarik-menarik. 3 cara membuat magnet: (1) Menggosok searah (ujung terakhir digosok jadi kutub berlawanan), (2) Induksi (didekatkan, ujung terdekat jadi kutub berlawanan), dan (3) Elektromagnet (dililit kawat berarus DC → pakai kaidah genggaman tangan kanan: 4 jari = arah arus, jempol = kutub Utara!).",
        "slideImg": "/modul-assets/pages/ipa_p25.png"
      }
    ],
    "cheatSheet": "",
    "cheatSheetImg": null,
    "miniTryout": "",
    "tryoutImg": null,
    "petaBelajarImg": null,
    "konsepTeori": [
      {
        "subjudul": "Unit 2.1: Gerak Lurus (GLB, GLBB & Grafik v–t)",
        "isi": "GLB (Gerak Lurus Beraturan): Kecepatan tetap (a = 0), rumus v = s / t. GLBB (Gerak Lurus Berubah Beraturan): Kecepatan berubah teratur karena ada percepatan tetap (a = (v_t − v₀) / t). Bisa dipercepat (bola jatuh) atau diperlambat (bola dilempar ke atas / mobil direm). GLB (v tetap) v t Ticker timer: • • • • • GLBB Dipercepat v t Tetesan oli (F→): • • • • • GLBB Diperlambat v t Tetesan oli (F→): • • • • •",
        "poinPenting": [
          "Kuasai 3 grafik sakti dan cara cepat baca pita ticker timer tanpa bingung!",
          "Pondasi · Jarak vs Perpindahan & Konversi km/jam Jarak: Total lintasan yang ditempuh (selalu dijumlah). Perpindahan: Garis lurus dari posisi awal ke akhir (pakai Pythagoras jika belok 90°). Konversi cepat: km/jam → m/s tinggal bagi 3,6 (contoh: 72 km/jam = 20 m/s)."
        ]
      },
      {
        "subjudul": "Unit 2.2: Gaya & Hukum Newton I, II, III",
        "isi": "Newton I! Gaya (F, Newton) adalah tarikan/dorongan. Jika beberapa gaya bekerja segaris, hitung Resultan Gaya (ΣF): gaya searah dijumlah, gaya berlawanan dikurang. Benda bergerak ke arah resultan yang lebih besar. Hukum Newton I ΣF = 0 (Inersia) Benda malas berubah Ex: Bus direm mendadak, kertas ditarik cepat, koin jatuh ke gelas Hukum Newton II a = ΣF / m Percepatan benda Ex: Troli kosong lebih cepat melaju daripada troli penuh barang Hukum Newton III F_aksi = −F_reaksi Gaya berpasangan Ex: Roket meluncur, mendayung perahu, tangan dorong tembok",
        "poinPenting": [
          "Kenapa tubuhmu terdorong ke depan saat bus direm mendadak? Itu Hukum",
          "Pondasi · Gaya Gesek Gaya gesek selalu berlawanan arah dengan arah gerak benda. Ada yang menguntungkan (alas sepatu bergerigi, rem mobil) dan merugikan (mesin aus → dikurangi dengan oli/pelumas)."
        ]
      },
      {
        "subjudul": "Unit 2.3: Usaha, Daya & Pesawat Sederhana",
        "isi": "Usaha = NOL! Usaha (W, Joule) terjadi jika gaya menyebabkan perpindahan: W = ΣF × s. Daya (P, Watt) adalah kecepatan melakukan usaha: P = W / t. Untuk mempermudah usaha, kita pakai Pesawat Sederhana yang punya Keuntungan Mekanis (KM = w / F): (1) Tuas (w·Lb = F·Lk)  ·  (2) Bidang Miring (KM = s/h)  ·  (3) Katrol Majemuk (KM = jumlah tali penopang)",
        "poinPenting": [
          "Kerja keras dorong tembok sampai keringatan, tapi tembok tak pindah →",
          "Pondasi · Cara Memperbesar Keuntungan Tuas Agar gaya kuasa F makin kecil (ringan), kita harus memperpanjang Lengan Kuasa (Lk) atau menggeser titik tumpu mendekati beban (memperpendek Lb)!"
        ]
      },
      {
        "subjudul": "Unit 2.4: Tekanan Zat, Pascal & Archimedes",
        "isi": "alasnya! Tekanan Zat Padat: P = F / A (Pascal atau N/m²). Makin kecil luas bidang tekan (A), makin besar tekanannya (pisau tajam, paku runcing). Sebaliknya kaki bebek berselaput (A besar) → tekanan kecil → tidak ambles! Kiri: Dongkrak Hidrolik Pascal (F₁/A₁ = F₂/A₂)  |  Kanan: Archimedes (Mengapung, Melayang, Tenggelam)",
        "poinPenting": [
          "Kenapa bebek mudah jalan di lumpur sedangkan ayam malah ambles? Luas",
          "Pondasi · Tekanan Udara & Aplikasi Biologi Tekanan Udara (Barometer): Tiap naik 100 m dari permukaan laut, tekanan udara turun 1 cmHg (di pantai = 76 cmHg). Di Tubuh & Tumbuhan: Tekanan darah (tensimeter → Hukum Pascal), pengangkutan air di xilem tumbuhan (kapilaritas + daya isap daun)."
        ]
      },
      {
        "subjudul": "Unit 2.5: Getaran, Gelombang & Bunyi",
        "isi": "Getaran adalah gerak bolak-balik di sekitar titik seimbang (bandul A–B–C–B–A = 1 getaran penuh). Frekuensi f = n / t (Hz), Periode T = t / n = 1 / f (s). Gelombang adalah getaran yang merambat: Transversal (bukit + lembah, ex: tali, cahaya) dan Longitudinal (rapatan + regangan, ex: bunyi). 1 λ (1 Bukit + 1 Lembah) A (Amplitudo) Total di gambar = 2 λ v = λ · f = λ / T",
        "poinPenting": [
          "Pahami 1 gelombang penuh, rumus v = λ·f, dan pantulan bunyi (sonar)!",
          "Pondasi · Klasifikasi Frekuensi Bunyi & Resonansi Infrasonik (< 20 Hz): Gajah, jangkrik, anjing. Audiosonik (20 – 20.000 Hz): Dapat didengar telinga manusia. Ultrasonik (> 20.000 Hz): Kelelawar, lumba-lumba, USG medis, sonar. Resonansi: Ikut bergetarnya benda karena frekuensinya sama (kotak gitar, bandul dengan panjang tali sama)."
        ]
      },
      {
        "subjudul": "Unit 2.6: Cahaya, Cermin, Lensa & Cacat Mata",
        "isi": "Cahaya merambat lurus, dapat dipantulkan (cermin), dan dibiaskan (lensa). Untuk cermin lengkung maupun lensa tipis, rumusnya SAMA PERSIS: 1/f = 1/s + 1/s' dan perbesaran M = |s'/s| = h'/h, dengan f = $\\frac{1}{2}$ R. Kiri: Cermin Cekung & Lensa Cembung (kumpulkan sinar)  |  Kanan: Miopi (depan retina) & Hipermetropi (belakang retina)",
        "poinPenting": [
          "Cukup pegang 1 rumus optik dan aturan tanda (+) vs (−) biar anti-keliru!",
          "Pondasi · Cermin Datar & Jumlah Bayangan Bayangan cermin datar selalu maya, tegak, sama besar, terbalik kanan-kiri. Dua cermin datar membentuk sudut α menghasilkan n = (360° / α) − 1 bayangan (misal α = 60° → n = 6 − 1 = 5 bayangan)."
        ]
      },
      {
        "subjudul": "Unit 2.7: Listrik Statis & Hukum Coulomb",
        "isi": "Atom tersusun dari proton (+) dan neutron (0) di inti, serta elektron (−) di kulit atom. Benda bermuatan negatif jika menerima elektron; bermuatan positif jika kehilangan elektron. Muatan sejenis tolak-menolak, tak sejenis tarik-menarik. 2 Pasangan Gosok Wajib Hafal! 1. Penggaris Plastik + Kain Wol: Elektron pindah Wol → Plastik Plastik (−), Wol (+) 2. Batang Kaca + Kain Sutera: Elektron Kaca → Sutera | Kaca (+) Hukum Coulomb F = k · (q₁ · q₂) / r² F sebanding dengan q₁·q₂ F berbanding terbalik r²! (k = 9 × 10⁹ N·m²/C²)",
        "poinPenting": [
          "Hanya ELEKTRON (−) yang bisa pindah! Proton (+) diam di inti atom!",
          "Pondasi · Elektroskop & Aplikasi Petir Elektroskop mendeteksi muatan benda: jika benda bermuatan didekatkan ke kepala elektroskop netral, kedua daun elektroskop membuka (mekar) karena bermuatan sejenis. Penangkal Petir menyalurkan loncatan elektron awan langsung ke bumi (grounding) agar aman."
        ]
      },
      {
        "subjudul": "Unit 2.8: Listrik Dinamis, Ohm & Seri–Paralel",
        "isi": "Arus listrik (I, Ampere) mengalir dari potensial tinggi (+) ke rendah (−), kebalikan arah elektron. Hukum Ohm: V = I × R (V = tegangan Volt, R = hambatan Ohm/Ω). Hukum I Kirchhoff: Jumlah arus masuk titik cabang = jumlah arus keluar (ΣI_masuk = ΣI_keluar). Kiri: Rangkaian Seri (1 jalur, arus sama, 1 putus padam semua)  |  Kanan: Rangkaian Paralel (bercabang, tegangan sama)",
        "poinPenting": [
          "Pegang segitiga V–I–R (Hukum Ohm) dan cara bereskan rangkaian campuran!",
          "Pondasi · Cara Pasang Amperemeter & Voltmeter Amperemeter (ukur arus I) dipasang secara SERI. Voltmeter (ukur tegangan V) dipasang secara PARALEL."
        ]
      },
      {
        "subjudul": "Unit 2.9: Energi, Daya & Biaya Listrik (kWh)",
        "isi": "Daya listrik (P, Watt) adalah energi listrik yang dipakai tiap detik: P = V · I = I² · R = V² / R. Energi listrik (W, Joule) adalah W = P × t = V · I · t. Untuk tagihan PLN, satuan energinya bukan Joule, melainkan kWh (kilo-Watt- hour)! Langkah 1 Jumlah alat × Watt × Jam = Wh / hari → Langkah 2 Jumlahkan semua lalu ÷ 1.000 = kWh → Langkah 3 Kalikan 30 hari = kWh/bulan → Langkah 4 Kali tarif per kWh = Rupiah!",
        "poinPenting": [
          "Soal paling langganan keluar tiap tahun—hitung tagihan listrik 30 hari!",
          "Pondasi · Spesifikasi Lampu & Hemat Listrik Tulisan 220 V / 40 W pada lampu berarti lampu menyala normal dengan daya 40 W jika dipasang pada tegangan 220 V. Cara hemat listrik: ganti lampu pijar ke LED, cabut charger saat tidak dipakai, atur AC 25°C."
        ]
      },
      {
        "subjudul": "Unit 2.10: Kemagnetan, Lorentz & Transformator",
        "isi": "Magnet punya kutub Utara (U/N) dan Selatan (S); sejenis tolak-menolak, tak sejenis tarik-menarik. 3 cara membuat magnet: (1) Menggosok searah (ujung terakhir digosok jadi kutub berlawanan), (2) Induksi (didekatkan, ujung terdekat jadi kutub berlawanan), dan (3) Elektromagnet (dililit kawat berarus DC → pakai kaidah genggaman tangan kanan: 4 jari = arah arus, jempol = kutub Utara!). Magnet Batang (medan U→S)  ·  Elektromagnet (paku + lilitan DC)  · Transformator (Vp/Vs = Np/Ns = Is/Ip)",
        "poinPenting": [
          "Pahami 3 cara membuat magnet, kaidah tangan kanan, dan rumus sakti trafo!",
          "Pondasi · Jenis Bahan Magnetik Feromagnetik (ditarik kuat): Besi, baja, nikel, kobalt. Paramagnetik (ditarik lemah): Aluminium, platina. Diamagnetik (ditolak lemah): Bismut, emas, seng, kayu/plastik."
        ]
      }
    ],
    "trikCepat": "Trik Cepat · Jarak = Luas Grafik v–t Ketemu grafik v–t? Tak perlu hafal rumus v₀t + $\\frac{1}{2}$at²! Cukup hitung luas bangun di bawah garis grafik (persegi panjang / segitiga / trapesium)!",
    "jebakanUmum": "Tetesan Oli dibaca searah gerak mobil (jarak makin lebar = dipercepat). Sebaliknya, Pita Ticker Timer ditarik dari ujung depan, jadi dibaca dari arah yang ditarik (berlawanan panah)!",
    "contohSoal": [
      {
        "soal": "Sebuah mobil bergerak dengan kecepatan awal 10 m/s lalu dipercepat beraturan hingga menjadi 22 m/s dalam waktu 4 sekon. Hitung percepatan dan jarak tempuhnya! Pembahasan: Percepatan a = (22 − 10) / 4 = 12 / 4 = 3 m/s². Untuk jarak, pakai trik Luas Trapesium di bawah grafik v–t: s = $\\frac{1}{2}$ × (v₀ + v_t) × t = $\\frac{1}{2}$ × (10 + 22) × 4 = 16 × 4 = 64 m! Jawaban: a = 3 m/s² dan jarak s = 64 meter.",
        "opsi": {
          "A": "Opsi A",
          "B": "Opsi B",
          "C": "Opsi C",
          "D": "Opsi D"
        },
        "kunci": "C",
        "pembahasanLangkah": [
          "Yuk Bahas · Percepatan & Jarak dari Grafik v–t Soal: Sebuah mobil bergerak dengan kecepatan awal 10 m/s lalu dipercepat beraturan hingga menjadi 22 m/s dalam waktu 4 sekon. Hitung percepatan dan jarak tempuhnya! Pembahasan: Percepatan a = (22 − 10) / 4 = 12 / 4 = 3 m/s². Untuk jarak, pakai trik Luas Trapesium di bawah grafik v–t: s = $\\frac{1}{2}$ × (v₀ + v_t) × t = $\\frac{1}{2}$ × (10 + 22) × 4 = 16 × 4 = 64 m! Jawaban: a = 3 m/s² dan jarak s = 64 meter."
        ]
      },
      {
        "soal": "Sebuah balok bermassa 4 kg di lantai licin ditarik ke kanan oleh dua anak dengan gaya 30 N dan 10 N, sementara satu anak menarik ke kiri dengan gaya 16 N. Hitung percepatan balok dan arahnya! Pembahasan: Resultan gaya: ΣF = (30 + 10) − 16 = 40 − 16 = 24 N ke kanan. Pakai Hukum Newton II: a = ΣF / m = 24 / 4 = 6 m/s² ke kanan. Jawaban: 6 m/s² ke arah kanan.",
        "opsi": {
          "A": "Opsi A",
          "B": "Opsi B",
          "C": "Opsi C",
          "D": "Opsi D"
        },
        "kunci": "C",
        "pembahasanLangkah": [
          "Yuk Bahas · Resultan Gaya & Percepatan Balok Soal: Sebuah balok bermassa 4 kg di lantai licin ditarik ke kanan oleh dua anak dengan gaya 30 N dan 10 N, sementara satu anak menarik ke kiri dengan gaya 16 N. Hitung percepatan balok dan arahnya! Pembahasan: Resultan gaya: ΣF = (30 + 10) − 16 = 40 − 16 = 24 N ke kanan. Pakai Hukum Newton II: a = ΣF / m = 24 / 4 = 6 m/s² ke kanan. Jawaban: 6 m/s² ke arah kanan."
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "ipa_smp_b2_q1",
        "soal": "Level 1 · PG1. Hukum Newton: Ketika kita mendayung perahu dengan mendorong air ke belakang, perahu justru terdorong melaju ke depan. Peristiwa ini sesuai dengan prinsip …",
        "opsi": {
          "A": "Hukum Newton I",
          "B": "Hukum Newton II",
          "C": "Hukum Newton III",
          "D": "Hukum Pascal"
        },
        "kunci": "C",
        "pembahasan": "Dayung mendorong air ke belakang ($F_{\\text{aksi}}$), air membalas mendorong perahu ke depan ($F_{\\text{reaksi}}$). Sesuai Hukum Newton III ($F_{\\text{aksi}} = -F_{\\text{reaksi}}$)."
      },
      {
        "id": "ipa_smp_b2_q2",
        "soal": "Level 1 · PG2. Bidang Miring: Sebuah peti seberat 400 N dinaikkan ke atas truk setinggi 1 m menggunakan papan bidang miring sepanjang 4 m. Gaya dorong minimal yang diperlukan adalah …",
        "opsi": {
          "A": "50 N",
          "B": "100 N",
          "C": "200 N",
          "D": "1.600 N"
        },
        "kunci": "B",
        "pembahasan": "Keuntungan mekanis bidang miring $KM = \\frac{s}{h} = \\frac{4}{1} = 4$. Maka gaya minimal $F = \\frac{w}{KM} = \\frac{400}{4} = 100\\text{ N}$."
      },
      {
        "id": "ipa_smp_b2_q3",
        "soal": "Level 2 · PG3. Tekanan Hidrostatis: Seekor ikan berenang pada kedalaman 2 m di bawah permukaan air danau ($\\rho = 1.000\\text{ kg/m}^3, g = 10\\text{ m/s}^2$). Tekanan hidrostatis yang dialami ikan tersebut adalah …",
        "opsi": {
          "A": "2.000 Pa",
          "B": "10.000 Pa",
          "C": "20.000 Pa",
          "D": "200.000 Pa"
        },
        "kunci": "C",
        "pembahasan": "Tekanan hidrostatis $P_h = \\rho \\cdot g \\cdot h = 1.000 \\times 10 \\times 2 = 20.000\\text{ Pa}$ (atau setara $20\\text{ kPa}$)."
      },
      {
        "id": "ipa_smp_b2_q4",
        "soal": "Level 2 · PG4. Cermin & Lensa: Cermin yang dipasang pada kaca spion kendaraan agar menghasilkan bayangan yang bersifat maya, tegak, dan diperkecil adalah …",
        "opsi": {
          "A": "Cermin datar",
          "B": "Cermin cekung",
          "C": "Cermin cembung",
          "D": "Lensa cembung"
        },
        "kunci": "C",
        "pembahasan": "Cermin cembung selalu menghasilkan bayangan maya, tegak, dan diperkecil sehingga bidang pandang pengemudi di spion menjadi sangat luas."
      },
      {
        "id": "ipa_smp_b2_q5",
        "soal": "Level 3 · PG5. Rangkaian Listrik: Dua resistor identik $6\\ \\Omega$ dan $6\\ \\Omega$ dipasang secara paralel, kemudian diserikan dengan resistor $3\\ \\Omega$. Jika rangkaian dihubungkan ke sumber tegangan 18 V, kuat arus totalnya adalah …",
        "opsi": {
          "A": "1,5 A",
          "B": "2 A",
          "C": "3 A",
          "D": "6 A"
        },
        "kunci": "C",
        "pembahasan": "Trik paralel kembar: $6\\ \\Omega \\parallel 6\\ \\Omega = \\frac{6}{2} = 3\\ \\Omega$. Serikan dengan $3\\ \\Omega \\rightarrow R_{\\text{total}} = 3 + 3 = 6\\ \\Omega$. Sesuai Hukum Ohm: $I = \\frac{V}{R} = \\frac{18}{6} = 3\\text{ A}$."
      },
      {
        "id": "ipa_smp_b2_q6",
        "soal": "Level 3 · PGK MCMA6. Gelombang, Listrik & Magnet: Pilih dua pernyataan yang BENAR dari daftar berikut:\n(1) Penggaris plastik yang digosok dengan kain wol akan bermuatan negatif.\n(2) Bunyi dengan frekuensi 25.000 Hz dapat didengar dengan jelas oleh telinga manusia normal.\n(3) Transformator step-up memiliki jumlah lilitan sekunder ($N_s$) lebih banyak daripada lilitan primer ($N_p$).\n(4) Jika jarak antarmuatan diperbesar menjadi 2 kali lipat, gaya Coulomb bertambah 2 kali lebih besar.",
        "opsi": {
          "A": "(1) dan (3)",
          "B": "(1) dan (2)",
          "C": "(2) dan (3)",
          "D": "(3) dan (4)"
        },
        "kunci": "A",
        "pembahasan": "Analisis butir:\n• (1) BENAR: Trik 'Pla-Min' — elektron berpindah dari wol ke plastik sehingga plastik bermuatan negatif (−).\n• (2) SALAH: 25.000 Hz adalah gelombang ultrasonik (> 20.000 Hz), di luar batas pendengaran manusia.\n• (3) BENAR: Trafo step-up berfungsi menaikkan tegangan, cirinya $N_s > N_p$.\n• (4) SALAH: Gaya Coulomb berbanding terbalik kuadrat jarak ($F \\propto \\frac{1}{r^2}$). Jarak $2\\times$ membuat gaya menjadi $\\frac{1}{4}$ kali semula.\nJadi pernyataan yang benar adalah (1) dan (3)."
      }
    ]
  },
  {
    "id": "ipa_smp_bab_3",
    "subtestKode": "IPA_SMP",
    "subtestNama": "Ilmu Pengetahuan Alam (IPA CP Fase D)",
    "subtestSingkatan": "IPA",
    "subtestEmoji": "🔬",
    "subtestWarna": "#059669",
    "subtestBgLight": "#ecfdf5",
    "babNumber": 3,
    "slug": "makhluk-hidup-sel-sistem-organ-pewarisan-sifat",
    "judul": "Bab 3 · Makhluk Hidup, Sel, Sistem Organ & Pewarisan Sifat",
    "durasiBacaMenit": 16,
    "ringkasanSingkat": "Kunci dikotomi 5 kingdom, organel sel hewan vs tumbuhan, sistem pencernaan, peredaran darah, ekskresi, reproduksi, dan persilangan genetika Mendel.",
    "learningObjectives": [
      "Membaca kunci determinasi dikotomi dan membedakan ciri sel hewan vs sel tumbuhan.",
      "Menganalisis proses kimiawi pencernaan enzimatis, peredaran darah besar/kecil, dan filtrasi nefron ginjal.",
      "Menentukan rasio fenotipe dan genotipe persilangan monohibrid dominan penuh/intermediet (3:1 / 1:2:1)."
    ],
    "pdfUrl": "/modul-pdf/Modul_Master_TKA_SMP_IPA_2027.pdf",
    "pdfFilename": "Modul_Master_TKA_SMP_IPA_2027.pdf",
    "pdfTotalHalaman": 52,
    "isUtama": false,
    "units": [
      {
        "unitNumber": "3.1",
        "judul": "Klasifikasi & Kunci Dikotomi",
        "hook": "Cara cepat mengurutkan Takson, baca Kunci Dikotomi & beda 5 Kingdom!",
        "teori": "Ciri makhluk hidup: bernapas, butuh nutrisi, bergerak, peka rangsang (iritabilitas), tumbuh-kembang, berkembang biak, ekskresi, dan adaptasi. Pengelompokan (Taksonomi) berurutan dari terbesar ke terkecil: Kingdom → Filum/Divisi → Kelas → Ordo → Famili → Genus → Spesies (makin ke bawah, persamaan makin banyak!). 5 Kingdom: Monera (Bakteri) · Protista (Amoeba) · Fungi (Jamur) · Plantae (Tumbuhan) · Animalia (Hewan)",
        "pondasi": "Pondasi · Monokotil vs Dikotil (Sering Keluar!) Monokotil (biji 1 keping): Akar serabut, tulang daun sejajar, kelopak bunga kelipatan 3, batang tak bercabang/tak berkambium (jagung, padi, kelapa). Dikotil (biji 2 keping): Akar tunggang, tulang daun menyirip/menjari, kelopak kelipatan 4/5, batang berkambium (mangga, kacang, jambu).",
        "jebakanTka": "Kata 1 = Genus (huruf pertama KAPITAL); Kata 2 = Spesies (huruf kecil semua); dicetak miring atau digarisbawahi terpisah. Contoh benar: Oryza sativa (padi), Panthera tigris (harimau).",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 3.1",
          "soal": "1a. Bertulang belakang → 2 | 1b. Tak bertulang belakang → Invertebrata. 2a. Menyusui → Mamalia | 2b. Tidak menyusui → 3. 3a. Tubuh berbulu → Aves | 3b. Bersisik → 4. Urutan kunci determinasi untuk Burung Elang adalah... Pembahasan: Ikuti panahnya: Elang bertulang belakang (1a → ke 2) → tidak menyusui (2b → ke 3) → tubuh berbulu (3a → Aves). Jawaban: 1a – 2b – 3a.",
          "opsiString": "",
          "jawaban": "",
          "solusi": "Yuk Bahas · Membaca Kunci Determinasi (Dikotomi) Soal: 1a. Bertulang belakang → 2 | 1b. Tak bertulang belakang → Invertebrata. 2a. Menyusui → Mamalia | 2b. Tidak menyusui → 3. 3a. Tubuh berbulu → Aves | 3b. Bersisik → 4. Urutan kunci determinasi untuk Burung Elang adalah... Pembahasan: Ikuti panahnya: Elang bertulang belakang (1a → ke 2) → tidak menyusui (2b → ke 3) → tubuh berbulu (3a → Aves). Jawaban: 1a – 2b – 3a."
        },
        "trikCepat": "Trik Cepat · Jembatan Keledai Takson Hafal: “Ki-Fi-Ke-O-Fa-Ge-S” (Kingdom, Filum, Kelas, Ordo, Famili, Genus, Spesies). Makin dekat tingkatannya, makin dekat kekerabatannya!",
        "pageNumber": 28,
        "illustrationImg": "/modul-assets/illustrations/ipa_p28.jpeg",
        "illustrationCaption": "Kata 1 = Genus (huruf pertama KAPITAL); Kata 2 = Spesies (huruf kecil semua); dicetak miring atau digarisbawahi terpisah. Contoh benar: Oryza sativa (padi), Panthera tigris (harimau).",
        "slideImg": "/modul-assets/pages/ipa_p28.png"
      },
      {
        "unitNumber": "3.2",
        "judul": "Sel Hewan vs Tumbuhan & Mikroskop",
        "hook": "Bedakan organel khas sel tumbuhan vs sel hewan dalam 10 detik!",
        "teori": "Urutan organisasi kehidupan dari terkecil: Sel → Jaringan → Organ → Sistem Organ → Organisme. Baik sel hewan maupun tumbuhan punya membran sel, sitoplasma, inti sel (nukleus), mitokondria, dan ribosom—tapi ada 3 ciri khas yang membedakannya! Kiri: Sel Tumbuhan (Dinding sel kaku, Kloroplas hijau, Vakuola besar)  | Kanan: Sel Hewan (Lentur, Mitokondria, Lisosom)",
        "pondasi": "Pondasi · Mikroskop & Perbesaran Total Perbesaran Total = Perbesaran Lensa Okuler × Lensa Objektif. (Misal Okuler 10× dan Objektif 40× → Total 400×). Makrometer (pemutar kasar): cari bayangan cepat. Mikrometer (pemutar halus): memperjelas fokus bayangan. Diafragma: mengatur banyak- sedikitnya cahaya!",
        "jebakanTka": "Mitokondria = respirasi sel / penghasil energi (ATP). Ribosom = sintesis protein. Nukleus = pusat kendali sel & pewarisan sifat. Badan Golgi = sekresi/pengemasan zat.",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 3.2",
          "soal": "Saat mengamati sel bawang merah dengan lensa okuler 10× dan objektif 40×, bayangan sudah terlihat tapi masih kurang tajam (sedikit buram). Bagian mikroskop mana yang harus diputar dan berapa perbesaran totalnya? Pembahasan: Karena bayangan sudah muncul dan tinggal dipertajam, putar mikrometer (pemutar halus). Perbesaran total = 10 × 40 = 400×. Jawaban: Putar mikrometer; perbesaran total 400 kali.",
          "opsiString": "",
          "jawaban": "",
          "solusi": "Yuk Bahas · Mengatasi Bayangan Mikroskop Buram Soal: Saat mengamati sel bawang merah dengan lensa okuler 10× dan objektif 40×, bayangan sudah terlihat tapi masih kurang tajam (sedikit buram). Bagian mikroskop mana yang harus diputar dan berapa perbesaran totalnya? Pembahasan: Karena bayangan sudah muncul dan tinggal dipertajam, putar mikrometer (pemutar halus). Perbesaran total = 10 × 40 = 400×. Jawaban: Putar mikrometer; perbesaran total 400 kali."
        },
        "trikCepat": "",
        "pageNumber": 29,
        "illustrationImg": "/modul-assets/illustrations/ipa_p29.jpeg",
        "illustrationCaption": "Kiri: Sel Tumbuhan (Dinding sel kaku, Kloroplas hijau, Vakuola besar)  |",
        "slideImg": "/modul-assets/pages/ipa_p29.png"
      },
      {
        "unitNumber": "3.3",
        "judul": "Sistem Gerak Manusia",
        "hook": "Tulang = alat gerak PASIF; Otot = alat gerak AKTIF karena bisa kontraksi!",
        "teori": "Rangka manusia terdiri dari tulang pipa (paha, lengan), pipih (tengkorak, belikat), pendek (ruas jari, pergelangan), dan tak beraturan (tulang belakang). Hubungan antartulang disebut Sendi—yang paling sering diujikan adalah 5 jenis Sendi Gerak (Diartrosis): Kiri: Otot Antagonis (Bisep kontraksi, Trisep relaksasi saat menekuk)  | Kanan: Sendi Peluru (bahu) & Sendi Engsel (siku)",
        "pondasi": "Pondasi · Gerak Antagonis (Bisep & Trisep) Saat lengan ditekuk (Fleksi): Otot Bisep berkontraksi (menggembung/memendek), otot Trisep berelaksasi (memanjang). Saat lengan diluruskan (Ekstensi): Otot Bisep relaksasi, otot Trisep kontraksi!",
        "jebakanTka": "Kifosis = bungkuk ke belakang; Lordosis = terlalu melengkung ke depan; Skoliosis = melengkung ke samping (huruf S). Kekurangan vitamin D & kalsium pada anak menyebabkan Rakitis (kaki X/O), pada lansia menyebabkan Osteoporosis.",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 3.3",
          "soal": "Saat seorang atlet bulu tangkis melakukan smash, bahunya berputar bebas ke segala arah, lalu sikunya menekuk tajam. Sendi apa saja yang berperan pada bahu dan siku secara berurutan? Pembahasan: Bahu menghubungkan tulang lengan atas dan gelang bahu (gerak segala arah) → Sendi Peluru. Siku hanya bisa menekuk ke satu arah seperti pintu → Sendi Engsel. Jawaban: Bahu = Sendi Peluru; Siku = Sendi Engsel.",
          "opsiString": "",
          "jawaban": "Bahu = Sendi Peluru; Siku = Sendi Engsel",
          "solusi": "Yuk Bahas · Mengidentifikasi Sendi & Otot Soal: Saat seorang atlet bulu tangkis melakukan smash, bahunya berputar bebas ke segala arah, lalu sikunya menekuk tajam. Sendi apa saja yang berperan pada bahu dan siku secara berurutan? Pembahasan: Bahu menghubungkan tulang lengan atas dan gelang bahu (gerak segala arah) → Sendi Peluru. Siku hanya bisa menekuk ke satu arah seperti pintu → Sendi Engsel. Jawaban: Bahu = Sendi Peluru; Siku = Sendi Engsel."
        },
        "trikCepat": "Trik Cepat · “S-K-L” Tulang Belakang Skoliosis = bentuk S (samping); Kifosis = Kakek bungkuk; Lordosis = Lebih maju perutnya!",
        "pageNumber": 30,
        "illustrationImg": "/modul-assets/illustrations/ipa_p30.jpeg",
        "illustrationCaption": "Kiri: Otot Antagonis (Bisep kontraksi, Trisep relaksasi saat menekuk)  |",
        "slideImg": "/modul-assets/pages/ipa_p30.png"
      },
      {
        "unitNumber": "3.4",
        "judul": "Sistem Pencernaan & Enzim",
        "hook": "Peta lengkap 3 pos enzim (Mulut, Lambung, Pankreas) + 4 reagen uji",
        "teori": "makanan! Urutan saluran pencernaan: Mulut → Kerongkongan (gerak peristaltik) → Lambung → Usus Halus (pencernaan tuntas & penyerapan sari makanan oleh vili) → Usus Besar (penyerapan air & pembusukan oleh E. coli) → Anus. Anatomi Pencernaan: Mulut → Kerongkongan → Lambung (Pe-Re-H) → Hati/Empedu & Pankreas (A-L-T) → Usus Halus → Usus Besar",
        "pondasi": "Pondasi · Tabel Uji Makanan (Super Sering Keluar!) Amilum (Pati): Ditetesi Lugol / Iodium → berubah Biru Tua / Hitam. Glukosa (Gula): Ditetesi Benedict / Fehling A+B + dipanaskan → Merah Bata. Protein: Ditetesi Biuret → berubah Ungu. Lemak: Dioles di Kertas Buram → noda Transparan.",
        "jebakanTka": "Cairan Empedu (dihasilkan Hati, disimpan di Kantong Empedu) berfungsi mengemulsikan lemak menjadi butiran kecil—tapi ia bukan enzim!",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 3.4",
          "soal": "Bahan makanan X ditetesi Lugol menjadi biru kehitaman, ditetesi Biuret menjadi ungu, dan ditetesi Benedict tetap biru. Nutrisi apa yang terkandung pada makanan X? Pembahasan: Lugol → biru kehitaman = positif Amilum. Biuret → ungu = positif Protein. Benedict tetap biru = negatif glukosa. Jawaban: Mengandung Amilum dan Protein.",
          "opsiString": "",
          "jawaban": "",
          "solusi": "Yuk Bahas · Analisis Tabel Uji Nutrisi Soal: Bahan makanan X ditetesi Lugol menjadi biru kehitaman, ditetesi Biuret menjadi ungu, dan ditetesi Benedict tetap biru. Nutrisi apa yang terkandung pada makanan X? Pembahasan: Lugol → biru kehitaman = positif Amilum. Biuret → ungu = positif Protein. Benedict tetap biru = negatif glukosa. Jawaban: Mengandung Amilum dan Protein."
        },
        "trikCepat": "Trik Cepat · “Lu-Bi-Be” Lugol (Amilum → Biru tua), Biuret (Protein → Ungu), Benedict (Glukosa → Merah Bata). Enzim lambung = Pe-Re-H; Pankreas = A-L-T!",
        "pageNumber": 31,
        "illustrationImg": "/modul-assets/illustrations/ipa_p31.jpeg",
        "illustrationCaption": "Urutan saluran pencernaan: Mulut → Kerongkongan (gerak peristaltik) → Lambung → Usus Halus (pencernaan tuntas & penyerapan sari makanan oleh vili) → Usus Besar (penyerapan air & pembusukan oleh E. coli) → Anus.",
        "slideImg": "/modul-assets/pages/ipa_p31.png"
      },
      {
        "unitNumber": "3.5",
        "judul": "Sistem Peredaran Darah",
        "hook": "Ingat: Jantung bagian KIRI kaya Oksigen (O₂), bagian KANAN kaya CO₂!",
        "teori": "Jantung punya 4 ruang: Serambi (Atrium) di atas untuk menerima darah, dan Bilik (Ventrikel) di bawah untuk memompa darah. Dinding Bilik Kiri paling tebal karena harus memompa darah kaya O₂ ke seluruh tubuh! Anatomi Jantung 4 Ruang: Sisi Biru = Kanan (CO₂) pompa ke paru  |  Sisi Merah = Kiri (O₂), dinding Bilik Kiri paling tebal",
        "pondasi": "Pondasi · 3 Sel Darah & Pembuluh Darah Eritrosit (Sel Darah Merah): Punya hemoglobin → mengangkut O₂. Leukosit (Sel Darah Putih): Melawan kuman / imunitas. Trombosit (Keping Darah): Pembekuan darah saat luka (fibrinogen → fibrin). Arteri (Nadi): Keluar dari jantung, dinding tebal, denyut terasa, umumnya kaya O₂ (kecuali arteri pulmonalis!). Vena (Balik): Menuju jantung, punya banyak katup, umumnya kaya CO₂ (kecuali vena pulmonalis!).",
        "jebakanTka": "Pada gambar anatomi di kertas soal, sisi kiri gambarmu adalah KANAN jantung (CO₂), dan sisi kanan gambarmu adalah KIRI jantung (O₂)—seperti kamu sedang melihat dada temanmu di depanmu!",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 3.5",
          "soal": "Urutan aliran darah pada peredaran darah besar yang tepat dimulai dari jantung adalah... Pembahasan: Peredaran darah besar memompa darah bersih dari Bilik Kiri → Aorta → Seluruh Tubuh → Vena Kava → Serambi Kanan. Jawaban: Bilik Kiri → Aorta → Seluruh Tubuh → Vena Kava → Serambi Kanan.",
          "opsiString": "",
          "jawaban": "Bilik Kiri → Aorta → Seluruh Tubuh → Vena Kava → Serambi Kanan",
          "solusi": "Yuk Bahas · Mengurutkan Peredaran Darah Besar Soal: Urutan aliran darah pada peredaran darah besar yang tepat dimulai dari jantung adalah... Pembahasan: Peredaran darah besar memompa darah bersih dari Bilik Kiri → Aorta → Seluruh Tubuh → Vena Kava → Serambi Kanan. Jawaban: Bilik Kiri → Aorta → Seluruh Tubuh → Vena Kava → Serambi Kanan."
        },
        "trikCepat": "",
        "pageNumber": 32,
        "illustrationImg": "/modul-assets/illustrations/ipa_p32.jpeg",
        "illustrationCaption": "Ingat: Jantung bagian KIRI kaya Oksigen (O₂), bagian KANAN kaya CO₂!",
        "slideImg": "/modul-assets/pages/ipa_p32.png"
      },
      {
        "unitNumber": "3.6",
        "judul": "Sistem Pernapasan Manusia",
        "hook": "Urutan saluran napas, mekanisme diafragma, dan volume kapasitas vital!",
        "teori": "Urutan jalannya udara: Hidung (disaring rambut & dihangatkan lendir) → Faring → Laring (pita suara) → Trakea (tenggorokan, cincin tulang rawan & silia) → Bronkus → Bronkiolus → Alveolus (tempat pertukaran O₂ dan CO₂ secara difusi!). Kiri: Paru-paru, Trakea, Bronkus & Diafragma  |  Kanan: Alveolus dibungkus kapiler darah (difusi O₂ & CO₂)",
        "pondasi": "Pondasi · Volume Udara Paru-Paru & Penyakit Tidal (500 mL): Napas biasa. Komplementer (1.500 mL): Tarik sekuat- kuatnya. Suplementer (1.500 mL): Hembus sekuat-kuatnya. Residu (1.000 mL): Sisa di paru. Kapasitas Vital = Tidal + Komplementer + Suplementer = 3.500 mL. Penyakit: TBC (bakteri Mycobacterium tuberculosis), Asma (penyempitan bronkiolus), Pneumonia (radang alveolus terisi cairan), Emfisema (kerusakan alveolus).",
        "jebakanTka": "Saat tarik napas (inspirasi), diafragma kontraksi → mendatar (bukan melengkung!). Kalau kamu lupa, pegang perutmu saat tarik napas: perut maju karena diafragma menekan ke bawah (datar)!",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 3.6",
          "soal": "Pada alat peraga botol plastik dengan 2 balon di dalam dan membran karet di bawah: ketika membran karet bawah ditarik ke bawah, kedua balon di dalam botol mengembang. Proses ini memodelkan... Pembahasan: Membran karet = diafragma. Ditarik ke bawah = diafragma kontraksi/mendatar → volume botol besar → tekanan mengecil → udara masuk → Inspirasi pernapasan perut. Jawaban: Inspirasi pada pernapasan perut.",
          "opsiString": "",
          "jawaban": "",
          "solusi": "Yuk Bahas · Percobaan Model Paru-Paru di Botol Soal: Pada alat peraga botol plastik dengan 2 balon di dalam dan membran karet di bawah: ketika membran karet bawah ditarik ke bawah, kedua balon di dalam botol mengembang. Proses ini memodelkan... Pembahasan: Membran karet = diafragma. Ditarik ke bawah = diafragma kontraksi/mendatar → volume botol besar → tekanan mengecil → udara masuk → Inspirasi pernapasan perut. Jawaban: Inspirasi pada pernapasan perut."
        },
        "trikCepat": "",
        "pageNumber": 33,
        "illustrationImg": "/modul-assets/illustrations/ipa_p33.jpeg",
        "illustrationCaption": "Kiri: Paru-paru, Trakea, Bronkus & Diafragma  |  Kanan: Alveolus dibungkus",
        "slideImg": "/modul-assets/pages/ipa_p33.png"
      },
      {
        "unitNumber": "3.7",
        "judul": "Sistem Ekskresi (Ginjal–Nefron)",
        "hook": "Ekskresi = membuang sisa metabolisme (bukan feses!). Kuasai 3 tahap",
        "teori": "Nefron! Ada 4 organ ekskresi utama: (1) Ginjal (urine), (2) Kulit (keringat lewat kelenjar sudorifera), (3) Paru-paru (CO₂ & uap air), dan (4) Hati (cairan empedu dari perombakan eritrosit tua + urea). Proses utama pembentukan urine di Nefron Ginjal terjadi dalam 3 tahap wajib hafal: Kiri: Penampang Ginjal (Korteks, Medula, Ureter)  |  Kanan: Nefron (Glomerulus → TKP → Lengkung Henle → TKD)",
        "pondasi": "Pondasi · Penyakit Ginjal & Kulit Batu Ginjal: Endapan garam kalsium oksalat (kurang minum air putih). Nefritis: Radang nefron akibat infeksi bakteri Streptococcus. Gagal Ginjal: Ditangani dengan cuci darah (hemodialisis) atau transplantasi.",
        "jebakanTka": "Jika urine pasien diuji Biuret → Ungu (ada protein), berarti terjadi kerusakan Glomerulus (Albuminuria). Jika diuji Benedict → Merah Bata (ada glukosa), berarti gangguan TKP / Diabetes Melitus!",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 3.7",
          "soal": "Hasil tes urine Pak Budi menunjukkan perubahan warna menjadi merah bata saat dipanaskan dengan larutan Benedict. Bagian nefron manakah yang kemungkinan terganggu dan penyakit apa yang dialaminya? Pembahasan: Benedict merah bata = urine mengandung glukosa. Seharusnya glukosa diserap kembali (reabsorpsi) seluruhnya di Tubulus Kontortus Proksimal (TKP). Kondisi ini disebut Diabetes Melitus. Jawaban: Tubulus Kontortus Proksimal (TKP); Diabetes Melitus.",
          "opsiString": "",
          "jawaban": "",
          "solusi": "Yuk Bahas · Diagnosis Lab Urine Pasien Soal: Hasil tes urine Pak Budi menunjukkan perubahan warna menjadi merah bata saat dipanaskan dengan larutan Benedict. Bagian nefron manakah yang kemungkinan terganggu dan penyakit apa yang dialaminya? Pembahasan: Benedict merah bata = urine mengandung glukosa. Seharusnya glukosa diserap kembali (reabsorpsi) seluruhnya di Tubulus Kontortus Proksimal (TKP). Kondisi ini disebut Diabetes Melitus. Jawaban: Tubulus Kontortus Proksimal (TKP); Diabetes Melitus."
        },
        "trikCepat": "Trik Cepat · “Fi-Re-Au” → “Glo-Pro-Dis” Pasangkan langsung: Filtrasi = Glomerulus (Primer); Reabsorpsi = Proksimal (Sekunder); Augmentasi = Distal (Sesungguhnya)!",
        "pageNumber": 34,
        "illustrationImg": "/modul-assets/illustrations/ipa_p34.jpeg",
        "illustrationCaption": "Ada 4 organ ekskresi utama: (1) Ginjal (urine), (2) Kulit (keringat lewat kelenjar sudorifera), (3) Paru-paru (CO₂ & uap air), dan (4) Hati (cairan empedu dari perombakan eritrosit tua + urea). Proses utama pembentukan urine di Nefron Ginjal terjadi dalam 3 tahap wajib hafal:",
        "slideImg": "/modul-assets/pages/ipa_p34.png"
      },
      {
        "unitNumber": "3.8",
        "judul": "Sistem Koordinasi (Saraf, Indra & Hormon)",
        "hook": "Bedakan jalur gerak sadar (Otak) vs gerak refleks (Sumsum Tulang",
        "teori": "Belakang)! Sel Saraf (Neuron) terdiri dari Dendrit (menerima impuls), Badan Sel, dan Akson/Neurit (meneruskan impuls ke neuron lain). Sistem koordinasi terdiri dari Saraf (kerja cepat), Indra (reseptor), dan Hormon (kerja lambat lewat darah). Kiri: Sel Saraf (Neuron) (Dendrit, Badan Sel, Akson Bermielin)  |  Kanan: Lengkung Refleks (kulit → sumsum tulang belakang → otot)",
        "pondasi": "Pondasi · Hormon Penting yang Sering Diujikan Insulin (Pankreas): Menurunkan kadar gula darah (mengubah glukosa jadi glikogen). Kekurangan insulin → Diabetes Melitus. Adrenalin (Anak Ginjal): Memacu detak jantung & mengubah glikogen jadi glukosa saat panik/bahaya. Tiroksin (Tiroid): Mengatur metabolisme tubuh (kekurangan iodium → gondok).",
        "jebakanTka": "Mata: Iris (beri warna mata & atur besar pupil), Pupil (atur banyak cahaya masuk), Lensa (fokuskan bayangan), Retina (menangkap bayangan). Telinga: Koklea / Rumah Siput (reseptor bunyi), Saluran Eustachius (menyeimbangkan tekanan udara), 3 Saluran Setengah Lingkaran (keseimbangan tubuh).",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 3.8",
          "soal": "Tanpa sengaja kaki Raka menginjak paku payung dan seketika ia langsung mengangkat kakinya sebelum sempat berpikir. Pusat pengendali gerak tersebut adalah... Pembahasan: Gerak mendadak tanpa dipikir lebih dulu untuk melindungi tubuh adalah gerak refleks, yang pusatnya berada di Sumsum Tulang Belakang (medula spinalis), bukan otak besar! Jawaban: Sumsum tulang belakang.",
          "opsiString": "",
          "jawaban": "",
          "solusi": "Yuk Bahas · Jalur Refleks Saat Injak Duri Soal: Tanpa sengaja kaki Raka menginjak paku payung dan seketika ia langsung mengangkat kakinya sebelum sempat berpikir. Pusat pengendali gerak tersebut adalah... Pembahasan: Gerak mendadak tanpa dipikir lebih dulu untuk melindungi tubuh adalah gerak refleks, yang pusatnya berada di Sumsum Tulang Belakang (medula spinalis), bukan otak besar! Jawaban: Sumsum tulang belakang."
        },
        "trikCepat": "",
        "pageNumber": 35,
        "illustrationImg": "/modul-assets/illustrations/ipa_p35.jpeg",
        "illustrationCaption": "Kiri: Sel Saraf (Neuron) (Dendrit, Badan Sel, Akson Bermielin)  |  Kanan:",
        "slideImg": "/modul-assets/pages/ipa_p35.png"
      },
      {
        "unitNumber": "3.9",
        "judul": "Sistem Reproduksi Manusia & Tumbuhan",
        "hook": "Pahami beda Mitosis vs Meiosis, tempat fertilisasi, dan cara berkembang",
        "teori": "biak tumbuhan! Pembelahan Sel: Mitosis terjadi di sel tubuh (menghasilkan 2 sel anak identik, diploid 2n) untuk pertumbuhan & perbaikan jaringan. Meiosis terjadi di sel kelamin (menghasilkan 4 sel anak haploid n) untuk membentuk sperma dan ovum. Kiri: Bunga Sempurna (Mahkota, Benang Sari, Putik & Bakal Biji)  |  Kanan: Vegetatif Alami (Rizoma jahe & Stolon stroberi)",
        "pondasi": "Pondasi · Penyerbukan & Vegetatif Buatan Penyerbukan: Jatuhnya serbuk sari (jantan) ke kepala putik (betina). Perantara: angin (anemogami, ex: jagung), serangga (entomogami, bunga warna cerah & bernektar). Vegetatif Buatan: Mencangkok (hanya tanaman dikotil berkambium; cepat berbuah, sifat sama persis induk, tapi akar kurang kuat), Stek (singkong), Okulasi (tempel mata tunas).",
        "jebakanTka": "Banyak siswa tertipu memilih Rahim! Pembuahan (fertilisasi bertemunya sperma & ovum) terjadi di Tuba Fallopi (Oviduk), baru zigot menempel & tumbuh di Rahim (Uterus)!",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 3.9",
          "soal": "Pada pengamatan ujung akar bawang, tampak kromosom berjajar rapi tepat di bidang ekuator (tengah) sel. Fase pembelahan mitosis apakah itu? Pembahasan: Ingat urutan P-M-A-T: Profase (kromosom menebal), Metafase (berjajar di Middle/tengah), Anafase (menarik ke kutub berlawanan), Telofase (terbentuk 2 sel anak). Jawaban: Metafase.",
          "opsiString": "",
          "jawaban": "",
          "solusi": "Yuk Bahas · Fase Pembelahan Sel (P-M-A-T) Soal: Pada pengamatan ujung akar bawang, tampak kromosom berjajar rapi tepat di bidang ekuator (tengah) sel. Fase pembelahan mitosis apakah itu? Pembahasan: Ingat urutan P-M-A-T: Profase (kromosom menebal), Metafase (berjajar di Middle/tengah), Anafase (menarik ke kutub berlawanan), Telofase (terbentuk 2 sel anak). Jawaban: Metafase."
        },
        "trikCepat": "",
        "pageNumber": 36,
        "illustrationImg": "/modul-assets/illustrations/ipa_p36.jpeg",
        "illustrationCaption": "Kiri: Bunga Sempurna (Mahkota, Benang Sari, Putik & Bakal Biji)  |  Kanan:",
        "slideImg": "/modul-assets/pages/ipa_p36.png"
      },
      {
        "unitNumber": "3.10",
        "judul": "Fotosintesis & Jaringan Tumbuhan",
        "hook": "Kuasai bedanya Xilem vs Floem dan 2 percobaan klasik Sachs & Ingenhousz!",
        "teori": "Fotosintesis terjadi di kloroplas (terbanyak di jaringan palisade/tiang daun): 6 CO₂ + 6 H₂O + Cahaya → C₆H₁₂O₆ (Glukosa/Amilum) + 6 O₂. Transportasi zat di tumbuhan dilakukan oleh Xilem (angkut air & mineral dari akar ke daun) dan Floem (angkut hasil fotosintesis dari daun ke seluruh tubuh). Kiri: Penampang Daun (Epidermis, Palisade berkloroplas, Xilem–Floem, Stomata)  |  Kanan: Percobaan Ingenhousz (gelembung O₂)",
        "pondasi": "Pondasi · Anatomi Penampang Daun Epidermis: Pelindung terluar; punya Stomata (mulut daun) untuk keluar- masuk gas CO₂, O₂, dan uap air. Jaringan Palisade (Tiang): Kaya kloroplas → tempat utama fotosintesis. Jaringan Spons (Bunga Karang): Banyak rongga udara + menyimpan cadangan sementara.",
        "jebakanTka": "Pertanyaan wajib keluar: “Mengapa daun direbus dalam alkohol panas sebelum ditetesi lugol?” Jawabannya: untuk melarutkan klorofil agar perubahan warna biru tua mudah diamati!",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 3.10",
          "soal": "Tiga gelas berisi Hydrilla: (1) di tempat teduh, (2) di bawah sinar matahari, (3) di bawah sinar matahari + tambahan soda kue (NaHCO₃). Gelas mana menghasilkan gelembung O₂ terbanyak? Pembahasan: NaHCO₃ dalam air melepas CO₂ sebagai bahan baku fotosintesis. Ditambah cahaya matahari penuh, laju fotosintesis di gelas (3) paling cepat → gelembung O₂ terbanyak! Jawaban: Gelas (3) — cahaya matahari + tambahan NaHCO₃.",
          "opsiString": "",
          "jawaban": "",
          "solusi": "Yuk Bahas · Eksperimen Hydrilla + NaHCO₃ Soal: Tiga gelas berisi Hydrilla: (1) di tempat teduh, (2) di bawah sinar matahari, (3) di bawah sinar matahari + tambahan soda kue (NaHCO₃). Gelas mana menghasilkan gelembung O₂ terbanyak? Pembahasan: NaHCO₃ dalam air melepas CO₂ sebagai bahan baku fotosintesis. Ditambah cahaya matahari penuh, laju fotosintesis di gelas (3) paling cepat → gelembung O₂ terbanyak! Jawaban: Gelas (3) — cahaya matahari + tambahan NaHCO₃."
        },
        "trikCepat": "",
        "pageNumber": 37,
        "illustrationImg": "/modul-assets/illustrations/ipa_p37.jpeg",
        "illustrationCaption": "Kiri: Penampang Daun (Epidermis, Palisade berkloroplas, Xilem–Floem,",
        "slideImg": "/modul-assets/pages/ipa_p37.png"
      },
      {
        "unitNumber": "3.11",
        "judul": "Pewarisan Sifat (Hukum Mendel)",
        "hook": "Kuasai tabel Punnett dan rasio emas 3:1 serta 9:3:3:1 untuk skor penuh!",
        "teori": "Genotipe = susunan gen berupa huruf (MM, Mm, mm). Fenotipe = sifat yang tampak mata (Merah, Putih, Tinggi). Huruf kapital = Dominan (menutupi sifat resesif); huruf kecil = Resesif. Homozigot = huruf sama (MM, mm); Heterozigot = huruf beda (Mm). Monohibrid (Mm × Mm) × | M MM (M) Mm (M) m Mm (M) mm (P) Dominan: 3 Merah : 1 Putih Intermediet: 1 Merah : 2 Pink : 1 Putih Dihibrid (BbKk × BbKk) Rasio Fenotipe F2 = 9 : 3 : 3 : 1 • 9/16 : Bulat–Kuning (B_K_) • 3/16 : Bulat–Hijau (B_kk) • 3/16 : Kisut–Kuning (bbK_) • 1/16 : Kisut–Hijau (bbkk)",
        "pondasi": "Pondasi · Kromosom Manusia Sel tubuh manusia punya 46 kromosom (23 pasang): 22 pasang autosom + 1 pasang gonosom (XX = perempuan, XY = laki-laki). Kelainan genetik: Buta warna & Hemofilia (terpaut kromosom X), Albino (resesif autosom).",
        "jebakanTka": "Cek soalnya! Kalau tertulis “F1 semuanya berwarna merah muda (pink)”, itu Intermediet (1 : 2 : 1), bukan dominan penuh (3 : 1)! Bibit unggul homozigot dominan (BBKK) di F2 dihibrid jumlahnya cuma 1/16!",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 3.11",
          "soal": "Kacang ercis Bulat–Kuning (BBKK) disilangkan dengan Kisut–Hijau (bbkk) menghasilkan F1 BbKk. Jika sesama F1 disilangkan menghasilkan 320 tanaman F2, berapa banyak yang berfenotipe Bulat–Hijau? Pembahasan: Dari rasio emas 9 : 3 : 3 : 1 (total 16 bagian), fenotipe Bulat–Hijau (B_kk) porsinya adalah 3/16. Maka jumlahnya = (3/16) × 320 = 3 × 20 = 60 tanaman! Jawaban: 60 tanaman Bulat–Hijau.",
          "opsiString": "",
          "jawaban": "",
          "solusi": "Yuk Bahas · Menghitung Jumlah Tanaman Dihibrid F2 Soal: Kacang ercis Bulat–Kuning (BBKK) disilangkan dengan Kisut–Hijau (bbkk) menghasilkan F1 BbKk. Jika sesama F1 disilangkan menghasilkan 320 tanaman F2, berapa banyak yang berfenotipe Bulat–Hijau? Pembahasan: Dari rasio emas 9 : 3 : 3 : 1 (total 16 bagian), fenotipe Bulat–Hijau (B_kk) porsinya adalah 3/16. Maka jumlahnya = (3/16) × 320 = 3 × 20 = 60 tanaman! Jawaban: 60 tanaman Bulat–Hijau."
        },
        "trikCepat": "Trik Cepat · Jumlah Gamet = 2ⁿ n = jumlah pasangan huruf heterozigot! Contoh BbKk punya n = 2 → 2² = 4 gamet (BK, Bk, bK, bk). BBKk punya n = 1 → 2¹ = 2 gamet!",
        "pageNumber": 38,
        "illustrationImg": null,
        "illustrationCaption": "",
        "slideImg": "/modul-assets/pages/ipa_p38.png"
      },
      {
        "unitNumber": "3.12",
        "judul": "Bioteknologi Konvensional & Modern",
        "hook": "Pasangkan produk pangan fermentasi dengan mikroorganisme yang tepat!",
        "teori": "Bioteknologi Konvensional memanfaatkan mikroorganisme secara langsung melalui fermentasi tanpa mengubah DNA (biaya murah, alat sederhana). Bioteknologi Modern memakai prinsip rekayasa genetika (DNA rekombinan), kultur jaringan, dan kloning. 6 Pasangan Konvensional Wajib Hafal • Tempe: Rhizopus oryzae (jamur) • Tapai & Roti: Saccharomyces cerevisiae • Kecap: Aspergillus wentii • Yoghurt: Lactobacillus bulgaricus • Nata de Coco: Acetobacter xylinum • Oncom: Neurospora crassa Bioteknologi Modern • Insulin Buatan (DNA rekombinan di E. coli) • Tanaman Transgenik (Jagung Bt tahan hama) • Kultur Jaringan & Kloning",
        "pondasi": "Pondasi · Dampak Positif vs Negatif Bioteknologi Positif: Meningkatkan nilai gizi & rasa pangan, produksi massal hormon insulin, bibit seragam dalam waktu singkat (kultur jaringan). Negatif (Wajib waspada!): Berkurangnya plasma nutfah (keanekaragaman hayati), potensi alergi pangan transgenik, serbuk sari transgenik mencemari tanaman lokal.",
        "jebakanTka": "Saat membuat roti, ragi Saccharomyces cerevisiae melakukan fermentasi alkohol menghasilkan gas CO₂ yang terperangkap di dalam adonan sehingga roti mengembang empuk!",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 3.12",
          "soal": "Penderita diabetes kini terbantu oleh hormon insulin yang diproduksi massal menggunakan bakteri Escherichia coli yang disisipi gen manusia. Teknik ini disebut... Pembahasan: Menyisipkan gen penghasil insulin manusia ke plasmid bakteri E. coli disebut teknik DNA Rekombinan / Rekayasa Genetika (bioteknologi modern). Jawaban: Rekayasa genetika (teknik DNA rekombinan).",
          "opsiString": "",
          "jawaban": "",
          "solusi": "Yuk Bahas · Manfaat Rekayasa Insulin Soal: Penderita diabetes kini terbantu oleh hormon insulin yang diproduksi massal menggunakan bakteri Escherichia coli yang disisipi gen manusia. Teknik ini disebut... Pembahasan: Menyisipkan gen penghasil insulin manusia ke plasmid bakteri E. coli disebut teknik DNA Rekombinan / Rekayasa Genetika (bioteknologi modern). Jawaban: Rekayasa genetika (teknik DNA rekombinan)."
        },
        "trikCepat": "",
        "pageNumber": 39,
        "illustrationImg": null,
        "illustrationCaption": "",
        "slideImg": "/modul-assets/pages/ipa_p39.png"
      },
      {
        "unitNumber": "3.13",
        "judul": "Ekosistem, Simbiosis & Piramida Energi",
        "hook": "Prediksi dampak jika 1 populasi punah dalam jaring-jaring makanan!",
        "teori": "Ekosistem terdiri dari komponen Biotik (makhluk hidup: produsen, konsumen, dekomposer) dan Abiotik (cahaya, air, tanah, suhu). Interaksi antar-organisme meliputi Predasi (singa–rusa), Kompetisi (rebutan makanan), dan 3 Simbiosis: Mutualisme (+/+), Komensalisme (+/0), Parasitisme (+/−). Rantai Makanan Ekosistem Sawah: Padi (Produsen) → Belalang (K-I) → Katak (K-II) → Ular (K-III) → Elang (Puncak)",
        "pondasi": "Pondasi · Pola Dinamika Jaring Makanan Di rantai makanan Padi → Tikus → Ular → Elang: jika Ular diburu habis, maka populasi Tikus meledak (tidak ada pemangsa), akibatnya Padi gagal panen (menurun drastis) dan populasi Elang ikut menurun karena kekurangan makanan!",
        "jebakanTka": "Dekomposer (Pengurai): Bakteri & jamur yang mengurai zat organik secara kimia jadi anorganik. Detritivor: Cacing tanah, luwing, rayap yang memakan serpihan organik.",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 3.13",
          "soal": "Di suatu sawah terdapat rantai makanan: Padi → Belalang → Katak → Ular → Elang. Jika petani menyemprot pestisida berlebih hingga Katak mati massal, dampak langsung yang terjadi adalah... Pembahasan: Pemangsa belalang hilang → populasi belalang meningkat drastis (hama), sedangkan ular kehilangan mangsanya → populasi ular menurun. Jawaban: Populasi belalang meningkat, populasi ular menurun.",
          "opsiString": "",
          "jawaban": "",
          "solusi": "Yuk Bahas · Prediksi Ekosistem Sawah Soal: Di suatu sawah terdapat rantai makanan: Padi → Belalang → Katak → Ular → Elang. Jika petani menyemprot pestisida berlebih hingga Katak mati massal, dampak langsung yang terjadi adalah... Pembahasan: Pemangsa belalang hilang → populasi belalang meningkat drastis (hama), sedangkan ular kehilangan mangsanya → populasi ular menurun. Jawaban: Populasi belalang meningkat, populasi ular menurun."
        },
        "trikCepat": "",
        "pageNumber": 40,
        "illustrationImg": "/modul-assets/illustrations/ipa_p40.jpeg",
        "illustrationCaption": "Ekosistem terdiri dari komponen Biotik (makhluk hidup: produsen, konsumen, dekomposer) dan Abiotik (cahaya, air, tanah, suhu). Interaksi antar-organisme meliputi Predasi (singa–rusa), Kompetisi (rebutan makanan), dan 3 Simbiosis: Mutualisme (+/+), Komensalisme (+/0), Parasitisme (+/−).",
        "slideImg": "/modul-assets/pages/ipa_p40.png"
      }
    ],
    "cheatSheet": "Cheat Sheet 1 Halaman · Rumus Fisika–Kimia & Skema Biologi SMP\nCHEAT SHEET MASTER · 1 Halaman\nCheat Sheet Fisika & Kimia (Bab 1–2)\nSemua rumus hitungan paling sering keluar dalam 1 tabel padat!\nTopik Rumus Utama Kunci Satuan\nMassa Jenis ρ = m / V 1 g/cm³ = 1.000\nkg/m³\nSuhu C : R : (F−32) = 5 : 4 : 9 K = C + 273\nKalor Q = m·c·ΔT | Q = m·L m (kg), 1 kJ = 1.000\nJ\nEnergi Ep = m·g·h | Ek = $\\frac{1}{2}$mv² Em = Ep + Ek\n(kekal)\nGerak & Gaya a = (vt−v₀)/t | ΣF = m·a Jarak = Luas grafik\nv–t\nPesawat Sed. w·Lb = F·Lk | KM = s/h Tuas: Tu-Be-Ku (1-\n2-3)\nTekanan P = F/A | Ph = ρ·g·h F₁/A₁ = F₂/A₂\nGelombang v = λ·f | Sonar: s = v·t/2 f = n/t, T = 1/f\nOptik 1/f = 1/s + 1/s' | M =\n|s'/s|\nMiopi: P =\n−100/PR\nListrik & Trafo V = I·R | W = P·t (kWh) Vp/Vs = Np/Ns =\nIs/Ip\nCheat Sheet Biologi & Kimia (Bab 1 & 3)\nJembatan keledai super cepat untuk soal hafalan & identifikasi!\nMateri Kata Kunci & Jembatan Keledai\nAsam–Basa A-M (Asam→Merah, pH<7) · B-B (Basa→Biru, pH>7)\nUji Makanan Lugol (Amilum→Biru tua) · Biuret (Protein→Ungu) ·\nBenedict (Glukosa→Merah bata)\nEnzim Mulut: Ptialin · Lambung: Pe-Re-H · Pankreas: A-L-T\nJantung Kiri = O₂ (Bilik kiri pompa ke tubuh) · Kanan = CO₂\nNefron Fi-Re-Au → Glomerulus (Primer) · Proksimal (Sekunder)\n· Distal (Sesungguhnya)\nFotosintesis Sachs = Amilum (alkohol larutkan klorofil) · Ingenhousz\n= O₂\nMendel F2 Monohibrid: 3 : 1 (Intermediet 1:2:1) · Dihibrid: 9 : 3 : 3 : 1\nBioteknologi Tempe (Rhizopus) · Tapai/Roti (Saccharomyces) ·\nYoghurt (Lactobacillus)",
    "cheatSheetImg": "/modul-assets/cheatsheet/cheatsheet_ipa.png",
    "miniTryout": "",
    "tryoutImg": null,
    "petaBelajarImg": null,
    "konsepTeori": [
      {
        "subjudul": "Unit 3.1: Klasifikasi & Kunci Dikotomi",
        "isi": "Ciri makhluk hidup: bernapas, butuh nutrisi, bergerak, peka rangsang (iritabilitas), tumbuh-kembang, berkembang biak, ekskresi, dan adaptasi. Pengelompokan (Taksonomi) berurutan dari terbesar ke terkecil: Kingdom → Filum/Divisi → Kelas → Ordo → Famili → Genus → Spesies (makin ke bawah, persamaan makin banyak!). 5 Kingdom: Monera (Bakteri) · Protista (Amoeba) · Fungi (Jamur) · Plantae (Tumbuhan) · Animalia (Hewan)",
        "poinPenting": [
          "Cara cepat mengurutkan Takson, baca Kunci Dikotomi & beda 5 Kingdom!",
          "Pondasi · Monokotil vs Dikotil (Sering Keluar!) Monokotil (biji 1 keping): Akar serabut, tulang daun sejajar, kelopak bunga kelipatan 3, batang tak bercabang/tak berkambium (jagung, padi, kelapa). Dikotil (biji 2 keping): Akar tunggang, tulang daun menyirip/menjari, kelopak kelipatan 4/5, batang berkambium (mangga, kacang, jambu)."
        ]
      },
      {
        "subjudul": "Unit 3.2: Sel Hewan vs Tumbuhan & Mikroskop",
        "isi": "Urutan organisasi kehidupan dari terkecil: Sel → Jaringan → Organ → Sistem Organ → Organisme. Baik sel hewan maupun tumbuhan punya membran sel, sitoplasma, inti sel (nukleus), mitokondria, dan ribosom—tapi ada 3 ciri khas yang membedakannya! Kiri: Sel Tumbuhan (Dinding sel kaku, Kloroplas hijau, Vakuola besar)  | Kanan: Sel Hewan (Lentur, Mitokondria, Lisosom)",
        "poinPenting": [
          "Bedakan organel khas sel tumbuhan vs sel hewan dalam 10 detik!",
          "Pondasi · Mikroskop & Perbesaran Total Perbesaran Total = Perbesaran Lensa Okuler × Lensa Objektif. (Misal Okuler 10× dan Objektif 40× → Total 400×). Makrometer (pemutar kasar): cari bayangan cepat. Mikrometer (pemutar halus): memperjelas fokus bayangan. Diafragma: mengatur banyak- sedikitnya cahaya!"
        ]
      },
      {
        "subjudul": "Unit 3.3: Sistem Gerak Manusia",
        "isi": "Rangka manusia terdiri dari tulang pipa (paha, lengan), pipih (tengkorak, belikat), pendek (ruas jari, pergelangan), dan tak beraturan (tulang belakang). Hubungan antartulang disebut Sendi—yang paling sering diujikan adalah 5 jenis Sendi Gerak (Diartrosis): Kiri: Otot Antagonis (Bisep kontraksi, Trisep relaksasi saat menekuk)  | Kanan: Sendi Peluru (bahu) & Sendi Engsel (siku)",
        "poinPenting": [
          "Tulang = alat gerak PASIF; Otot = alat gerak AKTIF karena bisa kontraksi!",
          "Pondasi · Gerak Antagonis (Bisep & Trisep) Saat lengan ditekuk (Fleksi): Otot Bisep berkontraksi (menggembung/memendek), otot Trisep berelaksasi (memanjang). Saat lengan diluruskan (Ekstensi): Otot Bisep relaksasi, otot Trisep kontraksi!"
        ]
      },
      {
        "subjudul": "Unit 3.4: Sistem Pencernaan & Enzim",
        "isi": "makanan! Urutan saluran pencernaan: Mulut → Kerongkongan (gerak peristaltik) → Lambung → Usus Halus (pencernaan tuntas & penyerapan sari makanan oleh vili) → Usus Besar (penyerapan air & pembusukan oleh E. coli) → Anus. Anatomi Pencernaan: Mulut → Kerongkongan → Lambung (Pe-Re-H) → Hati/Empedu & Pankreas (A-L-T) → Usus Halus → Usus Besar",
        "poinPenting": [
          "Peta lengkap 3 pos enzim (Mulut, Lambung, Pankreas) + 4 reagen uji",
          "Pondasi · Tabel Uji Makanan (Super Sering Keluar!) Amilum (Pati): Ditetesi Lugol / Iodium → berubah Biru Tua / Hitam. Glukosa (Gula): Ditetesi Benedict / Fehling A+B + dipanaskan → Merah Bata. Protein: Ditetesi Biuret → berubah Ungu. Lemak: Dioles di Kertas Buram → noda Transparan."
        ]
      },
      {
        "subjudul": "Unit 3.5: Sistem Peredaran Darah",
        "isi": "Jantung punya 4 ruang: Serambi (Atrium) di atas untuk menerima darah, dan Bilik (Ventrikel) di bawah untuk memompa darah. Dinding Bilik Kiri paling tebal karena harus memompa darah kaya O₂ ke seluruh tubuh! Anatomi Jantung 4 Ruang: Sisi Biru = Kanan (CO₂) pompa ke paru  |  Sisi Merah = Kiri (O₂), dinding Bilik Kiri paling tebal",
        "poinPenting": [
          "Ingat: Jantung bagian KIRI kaya Oksigen (O₂), bagian KANAN kaya CO₂!",
          "Pondasi · 3 Sel Darah & Pembuluh Darah Eritrosit (Sel Darah Merah): Punya hemoglobin → mengangkut O₂. Leukosit (Sel Darah Putih): Melawan kuman / imunitas. Trombosit (Keping Darah): Pembekuan darah saat luka (fibrinogen → fibrin). Arteri (Nadi): Keluar dari jantung, dinding tebal, denyut terasa, umumnya kaya O₂ (kecuali arteri pulmonalis!). Vena (Balik): Menuju jantung, punya banyak katup, umumnya kaya CO₂ (kecuali vena pulmonalis!)."
        ]
      },
      {
        "subjudul": "Unit 3.6: Sistem Pernapasan Manusia",
        "isi": "Urutan jalannya udara: Hidung (disaring rambut & dihangatkan lendir) → Faring → Laring (pita suara) → Trakea (tenggorokan, cincin tulang rawan & silia) → Bronkus → Bronkiolus → Alveolus (tempat pertukaran O₂ dan CO₂ secara difusi!). Kiri: Paru-paru, Trakea, Bronkus & Diafragma  |  Kanan: Alveolus dibungkus kapiler darah (difusi O₂ & CO₂)",
        "poinPenting": [
          "Urutan saluran napas, mekanisme diafragma, dan volume kapasitas vital!",
          "Pondasi · Volume Udara Paru-Paru & Penyakit Tidal (500 mL): Napas biasa. Komplementer (1.500 mL): Tarik sekuat- kuatnya. Suplementer (1.500 mL): Hembus sekuat-kuatnya. Residu (1.000 mL): Sisa di paru. Kapasitas Vital = Tidal + Komplementer + Suplementer = 3.500 mL. Penyakit: TBC (bakteri Mycobacterium tuberculosis), Asma (penyempitan bronkiolus), Pneumonia (radang alveolus terisi cairan), Emfisema (kerusakan alveolus)."
        ]
      },
      {
        "subjudul": "Unit 3.7: Sistem Ekskresi (Ginjal–Nefron)",
        "isi": "Nefron! Ada 4 organ ekskresi utama: (1) Ginjal (urine), (2) Kulit (keringat lewat kelenjar sudorifera), (3) Paru-paru (CO₂ & uap air), dan (4) Hati (cairan empedu dari perombakan eritrosit tua + urea). Proses utama pembentukan urine di Nefron Ginjal terjadi dalam 3 tahap wajib hafal: Kiri: Penampang Ginjal (Korteks, Medula, Ureter)  |  Kanan: Nefron (Glomerulus → TKP → Lengkung Henle → TKD)",
        "poinPenting": [
          "Ekskresi = membuang sisa metabolisme (bukan feses!). Kuasai 3 tahap",
          "Pondasi · Penyakit Ginjal & Kulit Batu Ginjal: Endapan garam kalsium oksalat (kurang minum air putih). Nefritis: Radang nefron akibat infeksi bakteri Streptococcus. Gagal Ginjal: Ditangani dengan cuci darah (hemodialisis) atau transplantasi."
        ]
      },
      {
        "subjudul": "Unit 3.8: Sistem Koordinasi (Saraf, Indra & Hormon)",
        "isi": "Belakang)! Sel Saraf (Neuron) terdiri dari Dendrit (menerima impuls), Badan Sel, dan Akson/Neurit (meneruskan impuls ke neuron lain). Sistem koordinasi terdiri dari Saraf (kerja cepat), Indra (reseptor), dan Hormon (kerja lambat lewat darah). Kiri: Sel Saraf (Neuron) (Dendrit, Badan Sel, Akson Bermielin)  |  Kanan: Lengkung Refleks (kulit → sumsum tulang belakang → otot)",
        "poinPenting": [
          "Bedakan jalur gerak sadar (Otak) vs gerak refleks (Sumsum Tulang",
          "Pondasi · Hormon Penting yang Sering Diujikan Insulin (Pankreas): Menurunkan kadar gula darah (mengubah glukosa jadi glikogen). Kekurangan insulin → Diabetes Melitus. Adrenalin (Anak Ginjal): Memacu detak jantung & mengubah glikogen jadi glukosa saat panik/bahaya. Tiroksin (Tiroid): Mengatur metabolisme tubuh (kekurangan iodium → gondok)."
        ]
      },
      {
        "subjudul": "Unit 3.9: Sistem Reproduksi Manusia & Tumbuhan",
        "isi": "biak tumbuhan! Pembelahan Sel: Mitosis terjadi di sel tubuh (menghasilkan 2 sel anak identik, diploid 2n) untuk pertumbuhan & perbaikan jaringan. Meiosis terjadi di sel kelamin (menghasilkan 4 sel anak haploid n) untuk membentuk sperma dan ovum. Kiri: Bunga Sempurna (Mahkota, Benang Sari, Putik & Bakal Biji)  |  Kanan: Vegetatif Alami (Rizoma jahe & Stolon stroberi)",
        "poinPenting": [
          "Pahami beda Mitosis vs Meiosis, tempat fertilisasi, dan cara berkembang",
          "Pondasi · Penyerbukan & Vegetatif Buatan Penyerbukan: Jatuhnya serbuk sari (jantan) ke kepala putik (betina). Perantara: angin (anemogami, ex: jagung), serangga (entomogami, bunga warna cerah & bernektar). Vegetatif Buatan: Mencangkok (hanya tanaman dikotil berkambium; cepat berbuah, sifat sama persis induk, tapi akar kurang kuat), Stek (singkong), Okulasi (tempel mata tunas)."
        ]
      },
      {
        "subjudul": "Unit 3.10: Fotosintesis & Jaringan Tumbuhan",
        "isi": "Fotosintesis terjadi di kloroplas (terbanyak di jaringan palisade/tiang daun): 6 CO₂ + 6 H₂O + Cahaya → C₆H₁₂O₆ (Glukosa/Amilum) + 6 O₂. Transportasi zat di tumbuhan dilakukan oleh Xilem (angkut air & mineral dari akar ke daun) dan Floem (angkut hasil fotosintesis dari daun ke seluruh tubuh). Kiri: Penampang Daun (Epidermis, Palisade berkloroplas, Xilem–Floem, Stomata)  |  Kanan: Percobaan Ingenhousz (gelembung O₂)",
        "poinPenting": [
          "Kuasai bedanya Xilem vs Floem dan 2 percobaan klasik Sachs & Ingenhousz!",
          "Pondasi · Anatomi Penampang Daun Epidermis: Pelindung terluar; punya Stomata (mulut daun) untuk keluar- masuk gas CO₂, O₂, dan uap air. Jaringan Palisade (Tiang): Kaya kloroplas → tempat utama fotosintesis. Jaringan Spons (Bunga Karang): Banyak rongga udara + menyimpan cadangan sementara."
        ]
      },
      {
        "subjudul": "Unit 3.11: Pewarisan Sifat (Hukum Mendel)",
        "isi": "Genotipe = susunan gen berupa huruf (MM, Mm, mm). Fenotipe = sifat yang tampak mata (Merah, Putih, Tinggi). Huruf kapital = Dominan (menutupi sifat resesif); huruf kecil = Resesif. Homozigot = huruf sama (MM, mm); Heterozigot = huruf beda (Mm). Monohibrid (Mm × Mm) × | M MM (M) Mm (M) m Mm (M) mm (P) Dominan: 3 Merah : 1 Putih Intermediet: 1 Merah : 2 Pink : 1 Putih Dihibrid (BbKk × BbKk) Rasio Fenotipe F2 = 9 : 3 : 3 : 1 • 9/16 : Bulat–Kuning (B_K_) • 3/16 : Bulat–Hijau (B_kk) • 3/16 : Kisut–Kuning (bbK_) • 1/16 : Kisut–Hijau (bbkk)",
        "poinPenting": [
          "Kuasai tabel Punnett dan rasio emas 3:1 serta 9:3:3:1 untuk skor penuh!",
          "Pondasi · Kromosom Manusia Sel tubuh manusia punya 46 kromosom (23 pasang): 22 pasang autosom + 1 pasang gonosom (XX = perempuan, XY = laki-laki). Kelainan genetik: Buta warna & Hemofilia (terpaut kromosom X), Albino (resesif autosom)."
        ]
      },
      {
        "subjudul": "Unit 3.12: Bioteknologi Konvensional & Modern",
        "isi": "Bioteknologi Konvensional memanfaatkan mikroorganisme secara langsung melalui fermentasi tanpa mengubah DNA (biaya murah, alat sederhana). Bioteknologi Modern memakai prinsip rekayasa genetika (DNA rekombinan), kultur jaringan, dan kloning. 6 Pasangan Konvensional Wajib Hafal • Tempe: Rhizopus oryzae (jamur) • Tapai & Roti: Saccharomyces cerevisiae • Kecap: Aspergillus wentii • Yoghurt: Lactobacillus bulgaricus • Nata de Coco: Acetobacter xylinum • Oncom: Neurospora crassa Bioteknologi Modern • Insulin Buatan (DNA rekombinan di E. coli) • Tanaman Transgenik (Jagung Bt tahan hama) • Kultur Jaringan & Kloning",
        "poinPenting": [
          "Pasangkan produk pangan fermentasi dengan mikroorganisme yang tepat!",
          "Pondasi · Dampak Positif vs Negatif Bioteknologi Positif: Meningkatkan nilai gizi & rasa pangan, produksi massal hormon insulin, bibit seragam dalam waktu singkat (kultur jaringan). Negatif (Wajib waspada!): Berkurangnya plasma nutfah (keanekaragaman hayati), potensi alergi pangan transgenik, serbuk sari transgenik mencemari tanaman lokal."
        ]
      },
      {
        "subjudul": "Unit 3.13: Ekosistem, Simbiosis & Piramida Energi",
        "isi": "Ekosistem terdiri dari komponen Biotik (makhluk hidup: produsen, konsumen, dekomposer) dan Abiotik (cahaya, air, tanah, suhu). Interaksi antar-organisme meliputi Predasi (singa–rusa), Kompetisi (rebutan makanan), dan 3 Simbiosis: Mutualisme (+/+), Komensalisme (+/0), Parasitisme (+/−). Rantai Makanan Ekosistem Sawah: Padi (Produsen) → Belalang (K-I) → Katak (K-II) → Ular (K-III) → Elang (Puncak)",
        "poinPenting": [
          "Prediksi dampak jika 1 populasi punah dalam jaring-jaring makanan!",
          "Pondasi · Pola Dinamika Jaring Makanan Di rantai makanan Padi → Tikus → Ular → Elang: jika Ular diburu habis, maka populasi Tikus meledak (tidak ada pemangsa), akibatnya Padi gagal panen (menurun drastis) dan populasi Elang ikut menurun karena kekurangan makanan!"
        ]
      }
    ],
    "trikCepat": "Trik Cepat · Jembatan Keledai Takson Hafal: “Ki-Fi-Ke-O-Fa-Ge-S” (Kingdom, Filum, Kelas, Ordo, Famili, Genus, Spesies). Makin dekat tingkatannya, makin dekat kekerabatannya!",
    "jebakanUmum": "Kata 1 = Genus (huruf pertama KAPITAL); Kata 2 = Spesies (huruf kecil semua); dicetak miring atau digarisbawahi terpisah. Contoh benar: Oryza sativa (padi), Panthera tigris (harimau).",
    "contohSoal": [
      {
        "soal": "1a. Bertulang belakang → 2 | 1b. Tak bertulang belakang → Invertebrata. 2a. Menyusui → Mamalia | 2b. Tidak menyusui → 3. 3a. Tubuh berbulu → Aves | 3b. Bersisik → 4. Urutan kunci determinasi untuk Burung Elang adalah... Pembahasan: Ikuti panahnya: Elang bertulang belakang (1a → ke 2) → tidak menyusui (2b → ke 3) → tubuh berbulu (3a → Aves). Jawaban: 1a – 2b – 3a.",
        "opsi": {
          "A": "Opsi A",
          "B": "Opsi B",
          "C": "Opsi C",
          "D": "Opsi D"
        },
        "kunci": "C",
        "pembahasanLangkah": [
          "Yuk Bahas · Membaca Kunci Determinasi (Dikotomi) Soal: 1a. Bertulang belakang → 2 | 1b. Tak bertulang belakang → Invertebrata. 2a. Menyusui → Mamalia | 2b. Tidak menyusui → 3. 3a. Tubuh berbulu → Aves | 3b. Bersisik → 4. Urutan kunci determinasi untuk Burung Elang adalah... Pembahasan: Ikuti panahnya: Elang bertulang belakang (1a → ke 2) → tidak menyusui (2b → ke 3) → tubuh berbulu (3a → Aves). Jawaban: 1a – 2b – 3a."
        ]
      },
      {
        "soal": "Saat mengamati sel bawang merah dengan lensa okuler 10× dan objektif 40×, bayangan sudah terlihat tapi masih kurang tajam (sedikit buram). Bagian mikroskop mana yang harus diputar dan berapa perbesaran totalnya? Pembahasan: Karena bayangan sudah muncul dan tinggal dipertajam, putar mikrometer (pemutar halus). Perbesaran total = 10 × 40 = 400×. Jawaban: Putar mikrometer; perbesaran total 400 kali.",
        "opsi": {
          "A": "Opsi A",
          "B": "Opsi B",
          "C": "Opsi C",
          "D": "Opsi D"
        },
        "kunci": "C",
        "pembahasanLangkah": [
          "Yuk Bahas · Mengatasi Bayangan Mikroskop Buram Soal: Saat mengamati sel bawang merah dengan lensa okuler 10× dan objektif 40×, bayangan sudah terlihat tapi masih kurang tajam (sedikit buram). Bagian mikroskop mana yang harus diputar dan berapa perbesaran totalnya? Pembahasan: Karena bayangan sudah muncul dan tinggal dipertajam, putar mikrometer (pemutar halus). Perbesaran total = 10 × 40 = 400×. Jawaban: Putar mikrometer; perbesaran total 400 kali."
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "ipa_smp_b3_q1",
        "soal": "Level 1 · PG1. Organel Sel: Organel yang berfungsi sebagai tempat respirasi sel untuk menghasilkan energi (ATP) dan dimiliki oleh sel hewan maupun sel tumbuhan adalah …",
        "opsi": {
          "A": "Kloroplas",
          "B": "Dinding sel",
          "C": "Mitokondria",
          "D": "Sentriol"
        },
        "kunci": "C",
        "pembahasan": "Mitokondria adalah “the powerhouse of cell” (tempat respirasi sel dan pembentukan ATP) yang dimiliki baik sel hewan maupun tumbuhan. Kloroplas dan dinding sel hanya ada pada tumbuhan, sedangkan sentriol hanya ada pada hewan."
      },
      {
        "id": "ipa_smp_b3_q2",
        "soal": "Level 1 · PG2. Pencernaan: Enzim pencernaan yang dihasilkan oleh kelenjar pankreas dan berfungsi mengubah lemak menjadi asam lemak serta gliserol adalah …",
        "opsi": {
          "A": "Pepsin",
          "B": "Ptialin",
          "C": "Lipase",
          "D": "Renin"
        },
        "kunci": "C",
        "pembahasan": "Jembatan keledai enzim getah pankreas A-L-T:\n• Amilase: mengubah zat tepung (amilum) menjadi glukosa\n• Lipase: mengubah lemak menjadi asam lemak + gliserol\n• Tripsin: mengubah pepton menjadi asam amino."
      },
      {
        "id": "ipa_smp_b3_q3",
        "soal": "Level 2 · PG3. Sistem Ekskresi: Hasil uji laboratorium menunjukkan sampel urine seorang pasien berwarna ungu saat ditetesi reagen Biuret. Bagian nefron ginjal yang mengalami kerusakan adalah …",
        "opsi": {
          "A": "Glomerulus",
          "B": "Tubulus proksimal",
          "C": "Tubulus distal",
          "D": "Ureter"
        },
        "kunci": "A",
        "pembahasan": "Uji Biuret menghasilkan warna ungu menandakan adanya protein dalam urine (Albuminuria). Hal ini membuktikan bahwa membran saringan pada tahap filtrasi di Glomerulus mengalami kebocoran."
      },
      {
        "id": "ipa_smp_b3_q4",
        "soal": "Level 2 · PG4. Reproduksi: Tempat terjadinya proses fertilisasi (peleburan sel sperma dan sel ovum) pada sistem reproduksi wanita adalah …",
        "opsi": {
          "A": "Ovarium",
          "B": "Tuba Fallopi",
          "C": "Uterus",
          "D": "Serviks"
        },
        "kunci": "B",
        "pembahasan": "Fertilisasi selalu berlangsung di Tuba Fallopi (oviduk). Setelah terbentuk zigot dan berkembang menjadi embrio, barulah embrio menempel dan tumbuh di dinding uterus (rahim)."
      },
      {
        "id": "ipa_smp_b3_q5",
        "soal": "Level 3 · PG5. Hukum Mendel: Tanaman mangga berbuah Besar–Manis (BBMM) disilangkan dengan Kecil–Masam (bbmm) menghasilkan keturunan F1 BbMm. Jika F1 disilangkan sesamanya dan menghasilkan 160 pohon keturunan F2, berapa banyak pohon yang berbuah Besar–Manis?",
        "opsi": {
          "A": "10 pohon",
          "B": "30 pohon",
          "C": "90 pohon",
          "D": "120 pohon"
        },
        "kunci": "C",
        "pembahasan": "Pada persilangan dihibrid heterozigot $BbMm \\times BbMm$, rasio fenotipe F2 adalah $9 : 3 : 3 : 1$. Porsi fenotipe dominan ganda Besar–Manis ($B\\_M\\_$) adalah $\\frac{9}{16}$. Jumlah tanaman $= \\frac{9}{16} \\times 160 = 90$ pohon."
      },
      {
        "id": "ipa_smp_b3_q6",
        "soal": "Level 3 · PGK MCMA6. Biologi Terpadu: Pilih dua pernyataan yang BENAR dari pernyataan di bawah ini:\n(1) Bilik kiri jantung memiliki dinding otot paling tebal untuk memompa darah kaya O₂ ke seluruh tubuh.\n(2) Jamur Rhizopus oryzae berperan utama dalam proses fermentasi susu menjadi yoghurt.\n(3) Percobaan Ingenhousz menggunakan tanaman Hydrilla membuktikan fotosintesis menghasilkan gas O₂.\n(4) Gerak refleks menghindar dikendalikan langsung oleh pusat kesadaran otak besar.",
        "opsi": {
          "A": "(1) dan (3)",
          "B": "(1) dan (2)",
          "C": "(2) dan (3)",
          "D": "(3) dan (4)"
        },
        "kunci": "A",
        "pembahasan": "Analisis butir:\n• (1) BENAR: Bilik kiri berdinding paling tebal karena harus memompa darah ke sirkulasi sistemik tubuh.\n• (2) SALAH: Rhizopus oryzae adalah jamur pembuat tempe; yoghurt menggunakan bakteri Lactobacillus bulgaricus.\n• (3) BENAR: Percobaan Ingenhousz membuktikan terbentuknya gelembung gas oksigen ($O_2$) saat terkena sinar matahari.\n• (4) SALAH: Gerak refleks berpangkal di sumsum tulang belakang (medula spinalis), bukan otak besar.\nJadi pernyataan yang benar adalah (1) dan (3)."
      }
    ]
  },
  {
    "id": "ipa_smp_bab_4",
    "subtestKode": "IPA_SMP",
    "subtestNama": "Ilmu Pengetahuan Alam (IPA CP Fase D)",
    "subtestSingkatan": "IPA",
    "subtestEmoji": "🔬",
    "subtestWarna": "#059669",
    "subtestBgLight": "#ecfdf5",
    "babNumber": 4,
    "slug": "lingkungan-bumi-tata-surya-ekologi",
    "judul": "Bab 4 · Lingkungan, Bumi–Tata Surya & Simulasi Tryout",
    "durasiBacaMenit": 14,
    "ringkasanSingkat": "Interaksi rantai makanan ekosistem, pencemaran lingkungan (efek rumah kaca & eutrofikasi), struktur lapisan bumi (litosfer/atmosfer), dan rotasi-revolusi bumi.",
    "learningObjectives": [
      "Memprediksi dampak kepunahan populasi tertentu pada jaring-jaring makanan ekosistem.",
      "Menjelaskan penyebab dan penanggulangan pemanasan global, penipisan ozon, serta hujan asam.",
      "Menganalisis fenomena gerhana, pasang surut air laut, dan pergantian musim akibat revolusi bumi."
    ],
    "pdfUrl": "/modul-pdf/Modul_Master_TKA_SMP_IPA_2027.pdf",
    "pdfFilename": "Modul_Master_TKA_SMP_IPA_2027.pdf",
    "pdfTotalHalaman": 52,
    "isUtama": false,
    "units": [
      {
        "unitNumber": "4.1",
        "judul": "Pencemaran & Pemanasan Global",
        "hook": "Pahami mekanisme Efek Rumah Kaca, Eutrofikasi, dan Hujan Asam!",
        "teori": "Pencemaran Lingkungan terjadi saat zat polutan melebihi ambang batas: Air (limbah deterjen & pupuk memicu Eutrofikasi / Blooming Algae sehingga ikan mati kekurangan O₂), Udara (gas CO, CO₂, SO₂, NO₂, CFC), dan Tanah (plastik non-biodegradable, pestisida). Efek Rumah Kaca: Sinar matahari masuk, lalu radiasi panas inframerah terperangkap gas CO₂/CH₄ di atmosfer → suhu naik & es mencair",
        "pondasi": "Pondasi · Solusi 3R & Pengendalian Pencemaran Reduce (kurangi sampah: bawa tumbler/tas kain), Reuse (pakai ulang botol), Recycle (daur ulang plastik/kertas). Bioremediasi: Menggunakan bakteri/jamur untuk menguraikan tumpahan minyak atau limbah beracun secara ramah lingkungan.",
        "jebakanTka": "Pemanasan global = CO₂ & CH₄. Lubang Ozon = CFC. Hujan Asam = SO₂ & NO₂. Soal PGK sering menukar pasangan gas dan dampaknya!",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 4.1",
          "soal": "Limbah pupuk urea dari sawah mengalir ke danau hingga permukaan air tertutup rapat oleh eceng gondok dan alga hijau. Tak lama kemudian banyak ikan mati. Mengapa hal itu terjadi? Pembahasan: Pupuk berlebih memicu eutrofikasi (ledakan populasi alga/eceng gondok). Permukaan tertutup → cahaya tak masuk → tumbuhan air mati & membusuk → bakteri pengurai menghabiskan Oksigen terlarut (O₂) sehingga ikan mati lemas! Jawaban: Terjadi eutrofikasi yang menurunkan kadar oksigen terlarut di air.",
          "opsiString": "",
          "jawaban": "",
          "solusi": "Yuk Bahas · Fenomena Ikan Mati di Danau Dekat Sawah Soal: Limbah pupuk urea dari sawah mengalir ke danau hingga permukaan air tertutup rapat oleh eceng gondok dan alga hijau. Tak lama kemudian banyak ikan mati. Mengapa hal itu terjadi? Pembahasan: Pupuk berlebih memicu eutrofikasi (ledakan populasi alga/eceng gondok). Permukaan tertutup → cahaya tak masuk → tumbuhan air mati & membusuk → bakteri pengurai menghabiskan Oksigen terlarut (O₂) sehingga ikan mati lemas! Jawaban: Terjadi eutrofikasi yang menurunkan kadar oksigen terlarut di air."
        },
        "trikCepat": "",
        "pageNumber": 44,
        "illustrationImg": "/modul-assets/illustrations/ipa_p44.jpeg",
        "illustrationCaption": "",
        "slideImg": "/modul-assets/pages/ipa_p44.png"
      },
      {
        "unitNumber": "4.2",
        "judul": "Tanah & Pelestarian Lingkungan",
        "hook": "Kenapa lapisan atas tanah (Horizon A) paling subur dan wajib dijaga dari",
        "teori": "erosi? Tanah terbentuk dari pelapukan batuan secara fisika (suhu, air, angin), kimia (hujan asam), dan biologi (lumut kerak, akar tumbuhan). Tanah berperan sebagai tempat hidup organisme, penyedia nutrisi tumbuhan, serta penyaring dan penyimpan air tanah! Profil Tanah: Horizon O/A (Topsoil kaya humus & cacing) → Horizon B (Liat) → Horizon C (Batuan lapuk) → Horizon R (Batuan induk)",
        "pondasi": "Pondasi · Jenis Tanah & Daya Serap Air Tanah Pasir: Pori besar → air sangat cepat lolos, kurang cocok untuk padi. Tanah Liat (Lempung): Pori sangat halus → menahan air kuat tapi mudah becek/padat. Tanah Humus / Lempung Berpasir: Paling ideal untuk pertanian (subur + gembur).",
        "jebakanTka": "Saat hujan deras, tanah gundul langsung tergerus air (erosi) dan kehilangan lapisan humus (Horizon A) sehingga jadi tandus. Akar pohon menahan butiran tanah sekaligus memperbesar penyerapan air!",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 4.2",
          "soal": "Di lahan pertanian organik banyak ditemukan cacing tanah, sedangkan di lahan yang sering disemprot pestisida kimia jumlah cacing sangat sedikit. Apa dampak hilangnya cacing tanah bagi tanaman? Pembahasan: Cacing tanah menggemburkan tanah dan membuat rongga udara/air (aerasi) serta membantu penguraian bahan organik. Tanpa cacing, tanah menjadi padat, miskin udara, dan kurang subur. Jawaban: Tanah menjadi padat, kurang oksigen, dan kesuburannya menurun.",
          "opsiString": "",
          "jawaban": "",
          "solusi": "Yuk Bahas · Mengapa Cacing Tanah Tanda Tanah Subur? Soal: Di lahan pertanian organik banyak ditemukan cacing tanah, sedangkan di lahan yang sering disemprot pestisida kimia jumlah cacing sangat sedikit. Apa dampak hilangnya cacing tanah bagi tanaman? Pembahasan: Cacing tanah menggemburkan tanah dan membuat rongga udara/air (aerasi) serta membantu penguraian bahan organik. Tanpa cacing, tanah menjadi padat, miskin udara, dan kurang subur. Jawaban: Tanah menjadi padat, kurang oksigen, dan kesuburannya menurun."
        },
        "trikCepat": "",
        "pageNumber": 45,
        "illustrationImg": "/modul-assets/illustrations/ipa_p45.jpeg",
        "illustrationCaption": "Pembahasan: Cacing tanah menggemburkan tanah dan membuat rongga udara/air (aerasi) serta membantu penguraian bahan organik. Tanpa cacing, tanah menjadi padat, miskin udara, dan kurang subur.",
        "slideImg": "/modul-assets/pages/ipa_p45.png"
      },
      {
        "unitNumber": "4.3",
        "judul": "Struktur Bumi, Lempeng & Mitigasi",
        "hook": "Indonesia berada di pertemuan 3 lempeng besar—wajib tahu jenis gerakan &",
        "teori": "mitigasinya! Lapisan Bumi: Kerak Bumi (Litosfer) → Mantel (arus konveksi penggerak lempeng!) → Inti Luar (cair) → Inti Dalam (padat). Lapisan Atmosfer dari bawah ke atas: Troposfer (cuaca, hujan, awan) → Stratosfer (lapisan Ozon O₃ & jalur pesawat) → Mesosfer (membakar meteor!) → Termosfer (aurora & ionosfer radio) → Eksosfer (satelit). Kiri: Lapisan Bumi (Kerak, Mantel konveksi, Inti Luar & Dalam)  |  Kanan: Lempeng Divergen, Konvergen (Subduksi), & Transform",
        "pondasi": "Pondasi · Tindakan Mitigasi Gempa & Tsunami Saat di dalam kelas/gedung: Lindungi kepala, berlindung di bawah meja kokoh (Drop, Cover, Hold On), jauhi kaca/lemari, jangan naik lift! Saat di pantai & gempa kuat/air laut surut tiba-tiba: Segera lari ke dataran tinggi menjauhi pantai (waspada tsunami!).",
        "jebakanTka": "Hiposentrum = titik pusat gempa di dalam perut bumi. Episentrum = titik di permukaan bumi tepat di atas hiposentrum! Alat pencatat gempa = Seismograf.",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 4.3",
          "soal": "Jutaan batuan luar angkasa mengarah ke Bumi setiap hari, namun sebagian besar habis terbakar sebelum menyentuh tanah. Lapisan atmosfer manakah yang membakar meteor tersebut? Pembahasan: Ingat jembatan keledai “Tro-Stra-Me-Ter-Ek”: Mesosfer = membakar Meteor! (Stratosfer = Ozon; Troposfer = cuaca.) Jawaban: Mesosfer.",
          "opsiString": "",
          "jawaban": "",
          "solusi": "Yuk Bahas · Lapisan Pelindung Bumi dari Meteor Soal: Jutaan batuan luar angkasa mengarah ke Bumi setiap hari, namun sebagian besar habis terbakar sebelum menyentuh tanah. Lapisan atmosfer manakah yang membakar meteor tersebut? Pembahasan: Ingat jembatan keledai “Tro-Stra-Me-Ter-Ek”: Mesosfer = membakar Meteor! (Stratosfer = Ozon; Troposfer = cuaca.) Jawaban: Mesosfer."
        },
        "trikCepat": "",
        "pageNumber": 46,
        "illustrationImg": "/modul-assets/illustrations/ipa_p46.jpeg",
        "illustrationCaption": "Kiri: Lapisan Bumi (Kerak, Mantel konveksi, Inti Luar & Dalam)  |  Kanan:",
        "slideImg": "/modul-assets/pages/ipa_p46.png"
      },
      {
        "unitNumber": "4.4",
        "judul": "Sistem Tata Surya & Planet",
        "hook": "Urutan 8 planet, beda Planet Dalam vs Luar, dan arah ekor komet!",
        "teori": "Tata surya berpusat pada Matahari (bintang yang memancarkan cahaya sendiri melalui reaksi fusi hidrogen). Di antara Mars dan Jupiter terdapat Sabuk Asteroid yang memisahkan Planet Dalam (Terestrial/Berbatu) dan Planet Luar (Jovian/Gas Raksasa): Tata Surya: Matahari · Merkurius, Venus, Bumi, Mars | Sabuk Asteroid | Jupiter, Saturnus, Uranus, Neptunus",
        "pondasi": "Pondasi · Komet & 3 Istilah Meteor Komet (Bintang Berekor): Tersusun es & debu; orbit sangat lonjong. Ekor komet SELALU MENJAUHI Matahari karena dorongan angin matahari! Meteoroid = batuan masih di luar angkasa. Meteor = terbakar bercahaya di atmosfer. Meteorit = sisa batuan yang jatuh sampai ke permukaan Bumi!",
        "jebakanTka": "Meskipun Merkurius paling dekat Matahari, planet TERPANAS adalah VENUS karena atmosfernya sangat tebal oleh gas CO₂ yang menyebabkan efek rumah kaca ekstrem! Venus juga berotasi dari Timur ke Barat (matahari terbit dari Barat).",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 4.4",
          "soal": "Sebuah planet memiliki ciri: (1) termasuk planet luar/Jovian, (2) memiliki cincin paling tebal dan jelas dari es/batuan, dan (3) merupakan planet terbesar kedua. Planet apakah itu? Pembahasan: Planet terbesar pertama = Jupiter; terbesar kedua sekaligus pemilik cincin es paling mencolok adalah Saturnus. Jawaban: Saturnus.",
          "opsiString": "",
          "jawaban": "",
          "solusi": "Yuk Bahas · Ciri Planet Berdasarkan Deskripsi Soal: Sebuah planet memiliki ciri: (1) termasuk planet luar/Jovian, (2) memiliki cincin paling tebal dan jelas dari es/batuan, dan (3) merupakan planet terbesar kedua. Planet apakah itu? Pembahasan: Planet terbesar pertama = Jupiter; terbesar kedua sekaligus pemilik cincin es paling mencolok adalah Saturnus. Jawaban: Saturnus."
        },
        "trikCepat": "Trik Cepat · “Me-Ve-Bu-Ma Ju-Sa-U-Ne” Hafal urutan 8 planet: Me-Ve-Bu-Ma (dalam) | Asteroid | Ju-Sa-U-Ne (luar). Pluto sejak 2006 dikategorikan planet kerdil (dwarf planet).",
        "pageNumber": 47,
        "illustrationImg": "/modul-assets/illustrations/ipa_p47.jpeg",
        "illustrationCaption": "",
        "slideImg": "/modul-assets/pages/ipa_p47.png"
      },
      {
        "unitNumber": "4.5",
        "judul": "Rotasi, Revolusi & Fase Bulan",
        "hook": "Jangan sampai ketukar antara akibat Rotasi Bumi (24 jam) vs Revolusi Bumi",
        "teori": "(365$\\frac{1}{4}$ hari)! Bumi berputar pada porosnya (Rotasi, 23 jam 56 menit, dari Barat ke Timur) sekaligus mengelilingi Matahari dengan sumbu miring 23,5° (Revolusi, 365$\\frac{1}{4}$ hari). Kemiringan poros 23,5° inilah biang kerok terjadinya 4 musim di belahan Utara & Selatan! Akibat ROTASI Bumi (24 Jam) 1. Pergantian siang dan malam 2. Gerak semu harian matahari 3. Perbedaan waktu (WIB, WITA, WIT) 4. Pembelokan arah angin & arus laut 5. Bumi pepat di kutub Akibat REVOLUSI Bumi (1 Tahun) 1. Pergantian 4 musim (Panas–Dingin) 2. Gerak semu tahunan matahari 3. Perbedaan lama siang & malam 4. Terlihatnya rasi bintang berbeda 5. Dasar Kalender Masehi (Syamsiah)",
        "pondasi": "Pondasi · Pergantian Musim & Kalender Hijriah 21 Juni: Matahari di Utara → Belahan Utara Musim Panas, Selatan Musim Dingin. 22 Desember: Kebalikannya (Utara Dingin, Selatan Panas)! Kalender Hijriah (Komariah): Berdasarkan revolusi Bulan (29,5 hari × 12 = 354 hari). Wajah Bulan yang menghadap Bumi selalu sama karena periode rotasi = periode revolusi Bulan!",
        "jebakanTka": "Perhatikan satu kata kecil: “Pergantian siang & malam” = Rotasi. Tapi “Perbedaan LAMA siang & malam” (siang di Eropa lebih lama saat Juni) = Revolusi!",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 4.5",
          "soal": "Pertandingan sepak bola di Banyuwangi (WIB) dimulai pukul 19.00 WIB. Pukul berapakah siaran langsung tersebut disaksikan di Makassar (WITA) dan Jayapura (WIT)? Pembahasan: Bumi berotasi 360° dalam 24 jam → tiap 15° bujur = selisih 1 jam, makin ke Timur makin cepat. WITA (+1 jam) = 20.00 WITA; WIT (+2 jam) = 21.00 WIT. Jawaban: 20.00 WITA dan 21.00 WIT.",
          "opsiString": "",
          "jawaban": "",
          "solusi": "Yuk Bahas · Zona Waktu Indonesia (15° = 1 Jam) Soal: Pertandingan sepak bola di Banyuwangi (WIB) dimulai pukul 19.00 WIB. Pukul berapakah siaran langsung tersebut disaksikan di Makassar (WITA) dan Jayapura (WIT)? Pembahasan: Bumi berotasi 360° dalam 24 jam → tiap 15° bujur = selisih 1 jam, makin ke Timur makin cepat. WITA (+1 jam) = 20.00 WITA; WIT (+2 jam) = 21.00 WIT. Jawaban: 20.00 WITA dan 21.00 WIT."
        },
        "trikCepat": "",
        "pageNumber": 48,
        "illustrationImg": null,
        "illustrationCaption": "",
        "slideImg": "/modul-assets/pages/ipa_p48.png"
      },
      {
        "unitNumber": "4.6",
        "judul": "Gerhana & Pasang Surut Air Laut",
        "hook": "Cukup lihat siapa yang berdiri di TENGAH: Bulan atau Bumi?",
        "teori": "Gerhana terjadi ketika Matahari, Bumi, dan Bulan berada pada satu garis lurus. Daerah bayangan inti yang sangat gelap disebut Umbra (gerhana total), sedangkan bayangan kabur di sekitarnya disebut Penumbra (gerhana sebagian). Atas: Gerhana Matahari (M–Bulan–Bumi, Bulan Baru)  |  Bawah: Gerhana Bulan (M–Bumi–Bulan, Bulan Purnama)",
        "pondasi": "Pondasi · Gerhana Matahari Cincin Gerhana Matahari Cincin terjadi saat posisi Bulan berada pada titik terjauh dari Bumi (apogee) sehingga bayangan umbra Bulan tidak sampai menyentuh permukaan Bumi—tampak tepian Matahari bersinar seperti cincin!",
        "jebakanTka": "Air laut mengalami pasang surut terutama karena gaya gravitasi Bulan! Pasang Purnama (tertinggi/maksimum): Matahari–Bumi–Bulan segaris lurus (fase Bulan Baru & Purnama). Pasang Perbani (terendah/minimum): membentuk sudut siku-siku 90° (kuartir I & III)!",
        "contohSoal": {
          "judul": "Yuk Bahas Unit 4.6",
          "soal": "Saat malam Bulan Purnama, Bulan masuk seluruhnya ke dalam bayangan inti (umbra) Bumi sehingga tampak kemerahan. Peristiwa apakah ini dan bagaimana kondisi pasang air laut saat itu? Pembahasan: Bumi di tengah & Bulan masuk penuh ke umbra → Gerhana Bulan Total. Karena posisi Matahari–Bumi–Bulan segaris lurus, air laut mengalami Pasang Purnama (maksimum)! Jawaban: Gerhana Bulan Total dan Pasang Purnama (tertinggi).",
          "opsiString": "",
          "jawaban": "",
          "solusi": "Yuk Bahas · Menentukan Gerhana & Pasang Laut Soal: Saat malam Bulan Purnama, Bulan masuk seluruhnya ke dalam bayangan inti (umbra) Bumi sehingga tampak kemerahan. Peristiwa apakah ini dan bagaimana kondisi pasang air laut saat itu? Pembahasan: Bumi di tengah & Bulan masuk penuh ke umbra → Gerhana Bulan Total. Karena posisi Matahari–Bumi–Bulan segaris lurus, air laut mengalami Pasang Purnama (maksimum)! Jawaban: Gerhana Bulan Total dan Pasang Purnama (tertinggi)."
        },
        "trikCepat": "Trik Cepat · “Ma-Bu-B” vs “Ma-B-Bu” Yang ditutupi selalu yang disebut namanya! Matahari ketutupan Bulan → Gerhana Matahari. Bulan ketutupan Bumi → Gerhana Bulan!",
        "pageNumber": 49,
        "illustrationImg": "/modul-assets/illustrations/ipa_p49.jpeg",
        "illustrationCaption": "",
        "slideImg": "/modul-assets/pages/ipa_p49.png"
      }
    ],
    "cheatSheet": "",
    "cheatSheetImg": null,
    "miniTryout": "Simulasi Mini Tryout · IPA SMP 2027 (Lintas 4 Bab)\nSimulasi Mini Tryout · 15 Menit\nSimulasi Tryout IPA SMP (No. 1–3)\nPasang timer 15 menit! Soal menguji penalaran lintas Bab 1 & Bab 2.\nTO 1 · Kalor (Bab 1)Sebanyak 0,5 kg air bersuhu 20°C dipanaskan hingga\n80°C (c_air = 4.200 J/kg°C). Kalor yang diserap air tersebut adalah...\nA. 42 kJ    B. 84 kJ    C. 126 kJ    D. 252 kJ\nTO 2 · Pesawat Sederhana (Bab 2)Sebuah peti 800 N diangkat memakai\ntuas dengan lengan beban 0,4 m dan lengan kuasa 1,6 m. Gaya kuasa\nminimal yang dibutuhkan adalah...\nA. 100 N    B. 200 N    C. 320 N    D. 400 N\nTO 3 · Listrik kWh (Bab 2)Sebuah AC berdaya 500 W dinyalakan 6\njam/hari. Jika tarif listrik Rp1.500/kWh, biaya listrik khusus AC tersebut\nselama 30 hari adalah...\nA. Rp45.000    B. Rp90.000    C. Rp135.000    D. Rp180.000\nSimulasi Tryout IPA SMP (No. 4–6)\nSoal Biologi, Genetika Mendel & Kebumian–Tata Surya (Bab 3–4).\nTO 4 · Sistem Organ (Bab 3)Urutan jalannya darah pada peredaran darah\nkecil yang benar adalah...\nA. Bilik kiri → seluruh tubuh → serambi kanan\nB. Bilik kanan → paru-paru → serambi kiri\nC. Serambi kanan → paru-paru → bilik kiri\nD. Bilik kanan → seluruh tubuh → serambi kiri\nTO 5 · Hukum Mendel (Bab 3)Persilangan bunga mawar Merah dominan (MM)\ndengan Putih (mm) menghasilkan F1 Mm. Jika sesama F1 disilangkan\nmenghasilkan 40 tanaman F2, berapa banyak yang berwarna Putih (mm)?\nA. 10 tanaman    B. 20 tanaman    C. 30 tanaman    D. 40 tanaman\nTO 6 · PGK Kategori (Bab 1–4)Tentukan BENAR (B) atau SALAH (S):\n(1) Larutan obat maag bersifat basa untuk menetralkan asam lambung.\n(2) Cermin cekung selalu menghasilkan bayangan maya & diperkecil.\n(3) Pada 21 Juni, belahan Bumi Utara mengalami musim panas.\n\nKunci Tryout & Peta Belajar IPA SMP 2027\nKunci Tryout & Jadwal Belajar\nKunci & Pembahasan Mini Tryout\nHitung skormu! Tiap soal bernilai ~16,7 poin (maksimal 100).\nPembahasan Cepat TO 1 – TO 6\nTO 1 · C (126 kJ): Q = 0,5 × 4.200 × (80 − 20) = 2.100 × 60 =\n126.000 J = 126 kJ.\nTO 2 · B (200 N): KM = 1,6 / 0,4 = 4 → F = 800 / 4 = 200 N.\nTO 3 · C (Rp135.000): Harian = 500 × 6 = 3.000 Wh = 3 kWh. 30 hari\n= 90 kWh × Rp1.500 = Rp135.000.\nTO 4 · B: Peredaran kecil: Bilik kanan → Paru-paru → Serambi kiri.\nTO 5 · A (10 tanaman): Rasio Mm × Mm = 3 Merah : 1 Putih → (1/4)\n× 40 = 10 tanaman putih.\nTO 6 · B – S – B: (1) Benar; (2) Salah (itu ciri cermin cembung); (3) Benar.\nPeta Belajar 8 Minggu IPA SMP 2027\nCukup 25 menit/hari, seluruh 39 Unit tuntas sebelum Ujian!\nMinggu Target Unit & Aktivitas\nMinggu 1–2 Tuntaskan Bab 1 (Unit 1.1–1.10) + Latihan Bab 1\nMinggu 3–4 Tuntaskan Bab 2 (Unit 2.1–2.10) + Latihan Bab 2\nMinggu 5–6 Tuntaskan Bab 3 (Unit 3.1–3.13) + Kuasai Cheat Sheet Hal\n43\nMinggu 7 Tuntaskan Bab 4 (Unit 4.1–4.6) + Latihan Bab 4\nMinggu 8 Ulang Simulasi Tryout Hal 51 & drill soal grafik/eksperimen\nPesan Mentor Bimbel Gemilang\nSains bukan tentang menghafal rumus mati, melainkan mengerti bagaimana\nalam bekerja. Kamu sudah menamatkan 52 Halaman (4 Bab · 39 Unit) IPA\nSMP Fase D. Gaspol terus, kamu pasti bisa tembus nilai terbaik 2027!",
    "tryoutImg": "/modul-assets/tryout/tryout_ipa_p51.png",
    "petaBelajarImg": "/modul-assets/tryout/tryout_ipa_p52.png",
    "konsepTeori": [
      {
        "subjudul": "Unit 4.1: Pencemaran & Pemanasan Global",
        "isi": "Pencemaran Lingkungan terjadi saat zat polutan melebihi ambang batas: Air (limbah deterjen & pupuk memicu Eutrofikasi / Blooming Algae sehingga ikan mati kekurangan O₂), Udara (gas CO, CO₂, SO₂, NO₂, CFC), dan Tanah (plastik non-biodegradable, pestisida). Efek Rumah Kaca: Sinar matahari masuk, lalu radiasi panas inframerah terperangkap gas CO₂/CH₄ di atmosfer → suhu naik & es mencair",
        "poinPenting": [
          "Pahami mekanisme Efek Rumah Kaca, Eutrofikasi, dan Hujan Asam!",
          "Pondasi · Solusi 3R & Pengendalian Pencemaran Reduce (kurangi sampah: bawa tumbler/tas kain), Reuse (pakai ulang botol), Recycle (daur ulang plastik/kertas). Bioremediasi: Menggunakan bakteri/jamur untuk menguraikan tumpahan minyak atau limbah beracun secara ramah lingkungan."
        ]
      },
      {
        "subjudul": "Unit 4.2: Tanah & Pelestarian Lingkungan",
        "isi": "erosi? Tanah terbentuk dari pelapukan batuan secara fisika (suhu, air, angin), kimia (hujan asam), dan biologi (lumut kerak, akar tumbuhan). Tanah berperan sebagai tempat hidup organisme, penyedia nutrisi tumbuhan, serta penyaring dan penyimpan air tanah! Profil Tanah: Horizon O/A (Topsoil kaya humus & cacing) → Horizon B (Liat) → Horizon C (Batuan lapuk) → Horizon R (Batuan induk)",
        "poinPenting": [
          "Kenapa lapisan atas tanah (Horizon A) paling subur dan wajib dijaga dari",
          "Pondasi · Jenis Tanah & Daya Serap Air Tanah Pasir: Pori besar → air sangat cepat lolos, kurang cocok untuk padi. Tanah Liat (Lempung): Pori sangat halus → menahan air kuat tapi mudah becek/padat. Tanah Humus / Lempung Berpasir: Paling ideal untuk pertanian (subur + gembur)."
        ]
      },
      {
        "subjudul": "Unit 4.3: Struktur Bumi, Lempeng & Mitigasi",
        "isi": "mitigasinya! Lapisan Bumi: Kerak Bumi (Litosfer) → Mantel (arus konveksi penggerak lempeng!) → Inti Luar (cair) → Inti Dalam (padat). Lapisan Atmosfer dari bawah ke atas: Troposfer (cuaca, hujan, awan) → Stratosfer (lapisan Ozon O₃ & jalur pesawat) → Mesosfer (membakar meteor!) → Termosfer (aurora & ionosfer radio) → Eksosfer (satelit). Kiri: Lapisan Bumi (Kerak, Mantel konveksi, Inti Luar & Dalam)  |  Kanan: Lempeng Divergen, Konvergen (Subduksi), & Transform",
        "poinPenting": [
          "Indonesia berada di pertemuan 3 lempeng besar—wajib tahu jenis gerakan &",
          "Pondasi · Tindakan Mitigasi Gempa & Tsunami Saat di dalam kelas/gedung: Lindungi kepala, berlindung di bawah meja kokoh (Drop, Cover, Hold On), jauhi kaca/lemari, jangan naik lift! Saat di pantai & gempa kuat/air laut surut tiba-tiba: Segera lari ke dataran tinggi menjauhi pantai (waspada tsunami!)."
        ]
      },
      {
        "subjudul": "Unit 4.4: Sistem Tata Surya & Planet",
        "isi": "Tata surya berpusat pada Matahari (bintang yang memancarkan cahaya sendiri melalui reaksi fusi hidrogen). Di antara Mars dan Jupiter terdapat Sabuk Asteroid yang memisahkan Planet Dalam (Terestrial/Berbatu) dan Planet Luar (Jovian/Gas Raksasa): Tata Surya: Matahari · Merkurius, Venus, Bumi, Mars | Sabuk Asteroid | Jupiter, Saturnus, Uranus, Neptunus",
        "poinPenting": [
          "Urutan 8 planet, beda Planet Dalam vs Luar, dan arah ekor komet!",
          "Pondasi · Komet & 3 Istilah Meteor Komet (Bintang Berekor): Tersusun es & debu; orbit sangat lonjong. Ekor komet SELALU MENJAUHI Matahari karena dorongan angin matahari! Meteoroid = batuan masih di luar angkasa. Meteor = terbakar bercahaya di atmosfer. Meteorit = sisa batuan yang jatuh sampai ke permukaan Bumi!"
        ]
      },
      {
        "subjudul": "Unit 4.5: Rotasi, Revolusi & Fase Bulan",
        "isi": "(365$\\frac{1}{4}$ hari)! Bumi berputar pada porosnya (Rotasi, 23 jam 56 menit, dari Barat ke Timur) sekaligus mengelilingi Matahari dengan sumbu miring 23,5° (Revolusi, 365$\\frac{1}{4}$ hari). Kemiringan poros 23,5° inilah biang kerok terjadinya 4 musim di belahan Utara & Selatan! Akibat ROTASI Bumi (24 Jam) 1. Pergantian siang dan malam 2. Gerak semu harian matahari 3. Perbedaan waktu (WIB, WITA, WIT) 4. Pembelokan arah angin & arus laut 5. Bumi pepat di kutub Akibat REVOLUSI Bumi (1 Tahun) 1. Pergantian 4 musim (Panas–Dingin) 2. Gerak semu tahunan matahari 3. Perbedaan lama siang & malam 4. Terlihatnya rasi bintang berbeda 5. Dasar Kalender Masehi (Syamsiah)",
        "poinPenting": [
          "Jangan sampai ketukar antara akibat Rotasi Bumi (24 jam) vs Revolusi Bumi",
          "Pondasi · Pergantian Musim & Kalender Hijriah 21 Juni: Matahari di Utara → Belahan Utara Musim Panas, Selatan Musim Dingin. 22 Desember: Kebalikannya (Utara Dingin, Selatan Panas)! Kalender Hijriah (Komariah): Berdasarkan revolusi Bulan (29,5 hari × 12 = 354 hari). Wajah Bulan yang menghadap Bumi selalu sama karena periode rotasi = periode revolusi Bulan!"
        ]
      },
      {
        "subjudul": "Unit 4.6: Gerhana & Pasang Surut Air Laut",
        "isi": "Gerhana terjadi ketika Matahari, Bumi, dan Bulan berada pada satu garis lurus. Daerah bayangan inti yang sangat gelap disebut Umbra (gerhana total), sedangkan bayangan kabur di sekitarnya disebut Penumbra (gerhana sebagian). Atas: Gerhana Matahari (M–Bulan–Bumi, Bulan Baru)  |  Bawah: Gerhana Bulan (M–Bumi–Bulan, Bulan Purnama)",
        "poinPenting": [
          "Cukup lihat siapa yang berdiri di TENGAH: Bulan atau Bumi?",
          "Pondasi · Gerhana Matahari Cincin Gerhana Matahari Cincin terjadi saat posisi Bulan berada pada titik terjauh dari Bumi (apogee) sehingga bayangan umbra Bulan tidak sampai menyentuh permukaan Bumi—tampak tepian Matahari bersinar seperti cincin!"
        ]
      }
    ],
    "trikCepat": "Trik Cepat · “Me-Ve-Bu-Ma Ju-Sa-U-Ne” Hafal urutan 8 planet: Me-Ve-Bu-Ma (dalam) | Asteroid | Ju-Sa-U-Ne (luar). Pluto sejak 2006 dikategorikan planet kerdil (dwarf planet).",
    "jebakanUmum": "Pemanasan global = CO₂ & CH₄. Lubang Ozon = CFC. Hujan Asam = SO₂ & NO₂. Soal PGK sering menukar pasangan gas dan dampaknya!",
    "contohSoal": [
      {
        "soal": "Limbah pupuk urea dari sawah mengalir ke danau hingga permukaan air tertutup rapat oleh eceng gondok dan alga hijau. Tak lama kemudian banyak ikan mati. Mengapa hal itu terjadi? Pembahasan: Pupuk berlebih memicu eutrofikasi (ledakan populasi alga/eceng gondok). Permukaan tertutup → cahaya tak masuk → tumbuhan air mati & membusuk → bakteri pengurai menghabiskan Oksigen terlarut (O₂) sehingga ikan mati lemas! Jawaban: Terjadi eutrofikasi yang menurunkan kadar oksigen terlarut di air.",
        "opsi": {
          "A": "Opsi A",
          "B": "Opsi B",
          "C": "Opsi C",
          "D": "Opsi D"
        },
        "kunci": "C",
        "pembahasanLangkah": [
          "Yuk Bahas · Fenomena Ikan Mati di Danau Dekat Sawah Soal: Limbah pupuk urea dari sawah mengalir ke danau hingga permukaan air tertutup rapat oleh eceng gondok dan alga hijau. Tak lama kemudian banyak ikan mati. Mengapa hal itu terjadi? Pembahasan: Pupuk berlebih memicu eutrofikasi (ledakan populasi alga/eceng gondok). Permukaan tertutup → cahaya tak masuk → tumbuhan air mati & membusuk → bakteri pengurai menghabiskan Oksigen terlarut (O₂) sehingga ikan mati lemas! Jawaban: Terjadi eutrofikasi yang menurunkan kadar oksigen terlarut di air."
        ]
      },
      {
        "soal": "Di lahan pertanian organik banyak ditemukan cacing tanah, sedangkan di lahan yang sering disemprot pestisida kimia jumlah cacing sangat sedikit. Apa dampak hilangnya cacing tanah bagi tanaman? Pembahasan: Cacing tanah menggemburkan tanah dan membuat rongga udara/air (aerasi) serta membantu penguraian bahan organik. Tanpa cacing, tanah menjadi padat, miskin udara, dan kurang subur. Jawaban: Tanah menjadi padat, kurang oksigen, dan kesuburannya menurun.",
        "opsi": {
          "A": "Opsi A",
          "B": "Opsi B",
          "C": "Opsi C",
          "D": "Opsi D"
        },
        "kunci": "C",
        "pembahasanLangkah": [
          "Yuk Bahas · Mengapa Cacing Tanah Tanda Tanah Subur? Soal: Di lahan pertanian organik banyak ditemukan cacing tanah, sedangkan di lahan yang sering disemprot pestisida kimia jumlah cacing sangat sedikit. Apa dampak hilangnya cacing tanah bagi tanaman? Pembahasan: Cacing tanah menggemburkan tanah dan membuat rongga udara/air (aerasi) serta membantu penguraian bahan organik. Tanpa cacing, tanah menjadi padat, miskin udara, dan kurang subur. Jawaban: Tanah menjadi padat, kurang oksigen, dan kesuburannya menurun."
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "ipa_smp_b4_q1",
        "soal": "No. 1 · PGPencemaran: Gas polutan sintetis dari kulkas dan pendingin ruangan (AC) generasi lama yang menyebabkan menipisnya lapisan Ozon ($O_3$) di lapisan stratosfer bumi adalah …",
        "opsi": {
          "A": "$\\text{CO}_2$",
          "B": "$\\text{CH}_4$",
          "C": "CFC (Klorofluorokarbon)",
          "D": "$\\text{SO}_2$"
        },
        "kunci": "C",
        "pembahasan": "CFC (Chlorofluorocarbon) melepaskan radikal klorin yang memecah molekul ozon ($O_3$). $\\text{CO}_2$ dan $\\text{CH}_4$ adalah gas rumah kaca pemicu pemanasan global; $\\text{SO}_2$ pemicu hujan asam."
      },
      {
        "id": "ipa_smp_b4_q2",
        "soal": "No. 2 · PGLempeng & Atmosfer: Tumbukan lempeng saling mendekat (konvergen) di dasar samudra berpotensi membentuk palung laut dalam dan tsunami. Lapisan atmosfer bumi tempat meteoroid terbakar habis adalah …",
        "opsi": {
          "A": "Troposfer",
          "B": "Stratosfer",
          "C": "Mesosfer",
          "D": "Termosfer"
        },
        "kunci": "C",
        "pembahasan": "Lapisan Mesosfer berfungsi membakar dan menghancurkan meteoroid yang masuk ke atmosfer bumi karena kepadatan dan gesekan udara yang intens."
      },
      {
        "id": "ipa_smp_b4_q3",
        "soal": "No. 3 · PGTata Surya: Planet terpanas di Tata Surya kita yang berotasi terbalik dari Timur ke Barat akibat selimut atmosfer gas $\\text{CO}_2$ yang sangat tebal adalah …",
        "opsi": {
          "A": "Merkurius",
          "B": "Venus",
          "C": "Mars",
          "D": "Jupiter"
        },
        "kunci": "B",
        "pembahasan": "Venus adalah planet terpanas (suhu permukaan $\\approx 460^\\circ\\text{C}$), lebih panas dari Merkurius, karena mengalami efek rumah kaca ekstrem dari atmosfer $\\text{CO}_2$ yang sangat tebal."
      },
      {
        "id": "ipa_smp_b4_q4",
        "soal": "No. 4 · PGK MCMABumi–Bulan: Tentukan dua pernyataan yang BENAR terkait fenomena kebumian dan antariksa:\n(1) Pergantian 4 musim di belahan bumi utara dan selatan disebabkan oleh revolusi Bumi dan kemiringan poros $23,5^\\circ$.\n(2) Perbedaan zona waktu WIB, WITA, dan WIT disebabkan oleh revolusi tahunan Bumi.\n(3) Pasang purnama (pasang air laut tertinggi) terjadi saat posisi Matahari, Bumi, dan Bulan membentuk garis lurus.\n(4) Gerhana Matahari total terjadi pada saat fase Bulan berada dalam kondisi Bulan Purnama.",
        "opsi": {
          "A": "(1) dan (3)",
          "B": "(1) dan (2)",
          "C": "(2) dan (3)",
          "D": "(3) dan (4)"
        },
        "kunci": "A",
        "pembahasan": "Analisis butir:\n• (1) & (3) BENAR: Revolusi bumi menyebabkan musim; pasang purnama terjadi saat syzygy (garis lurus).\n• (2) SALAH: Pembagian zona waktu disebabkan oleh rotasi Bumi pada porosnya.\n• (4) SALAH: Gerhana Matahari terjadi pada fase Bulan Baru (Bulan Mati), bukan Bulan Purnama.\nJadi pernyataan yang benar adalah (1) dan (3)."
      }
    ]
  }
];

export const ipaSmpData = IPA_SMP_MODUL;
export default IPA_SMP_MODUL;
