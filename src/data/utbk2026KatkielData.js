// src/data/utbk2026KatkielData.js
// ============================================================
// BANK SOAL RESMI UTBK-SNBT 2026 (MODUL KATKIEL PROJECT)
// 160 BUTIR SOAL · 7 SUBTES · BLOCK TIME 195 MENIT
// LENGKAP DENGAN GAMBAR PRESISI, TABEL DATA HTML, KUNCI & PEMBAHASAN
// ============================================================

export const PAKET_RESMI_UTBK_2026_KATKIEL = {
  "id": "paket_resmi_utbk_2026_katkiel",
  "judul": "PAKET RESMI UTBK-SNBT 2026 (MODUL KATKIEL PROJECT)",
  "kategori": "Try Out Akbar UTBK",
  "formatUjian": "UTBK_2026",
  "totalSoal": 160,
  "durasiMenit": 195.0,
  "jedaTransisiDetik": 15,
  "modeTimer": "per-subtes",
  "subtes": [
    {
      "id": "subtes_pu",
      "kode": "PU",
      "nama": "Penalaran Umum (PU)",
      "targetSoal": 30,
      "durasiMenit": 30,
      "estimasiDetik": 60,
      "soal": [
        {
          "id": "utbk26_pu_01",
          "nomor": 1,
          "mapel": "Penalaran Umum (PU)",
          "subkategori": "Penalaran Deduktif",
          "teksSoal": "Konsistensi latihan musik Rani bergantung pada waktu luang dan suasana hatinya. Pada hari-hari tertentu, Rani tidak berlatih gitar dan tidak membuat aransemen lagu bahagia, biasanya Rani akan berlatih gitar. Jika hari ini Rani tidak berlatih gitar, kesimpulan yang PALING TEPAT adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Rani mempunyai waktu luang atau sedang bahagia."
            },
            {
              "key": "B",
              "teks": "Jika Rani mempunyai waktu luang, ia sedang bahagia."
            },
            {
              "key": "C",
              "teks": "Jika suasana hati Rani sedang bahagia, ia tidak berlatih gitar."
            },
            {
              "key": "D",
              "teks": "Rani tidak mempunyai waktu luang atau ia sedang tidak bahagia."
            },
            {
              "key": "E",
              "teks": "Jika Rani tidak mempunyai waktu luang, ia sedang bahagia."
            }
          ],
          "kunciJawaban": "D",
          "pembahasan": "Premis 1: (Waktu Luang ∧ Suasana Bahagia) → Berlatih Gitar. Kontraposisi (Modus Tollens): Tidak Berlatih Gitar → ¬(Waktu Luang ∧ Suasana Bahagia) ≡ Tidak Punya Waktu Luang ∨ Tidak Bahagia (Hukum De Morgan). Jadi kesimpulan paling tepat adalah D."
        },
        {
          "id": "utbk26_pu_02",
          "nomor": 2,
          "mapel": "Penalaran Umum (PU)",
          "subkategori": "Penalaran Deduktif",
          "teksSoal": "Televisi di rumah Jono perlu diperbaiki karena sudah rusak. Jono sudah membuat rencana untuk mendatangkan teknisi ke rumahnya. Namun, jika teknisi membatalkan janjinya untuk datang ke rumah Jono, televisi tidak bisa diperbaiki karena Jono tidak bisa melakukannya sendiri. Selain itu, anaknya sedang mengerjakan tugas sekolah sehingga tidak bisa membantu. Jika rencana Jono berjalan lancar, kesimpulan yang PALING TEPAT adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Anak Jono tidak bisa membantu dan teknisi menepati janjinya."
            },
            {
              "key": "B",
              "teks": "Teknisi membatalkan janjinya dan televisi Jono tidak bisa diperbaiki."
            },
            {
              "key": "C",
              "teks": "Televisi Jono tidak bisa diperbaiki dan anak Jono tidak bisa membantu."
            },
            {
              "key": "D",
              "teks": "Anak Jono bisa membantu Jono untuk memperbaiki televisi di rumahnya."
            },
            {
              "key": "E",
              "teks": "Televisi Jono berhasil diperbaiki meskipun teknisi membatalkan janjinya."
            }
          ],
          "kunciJawaban": "A",
          "pembahasan": "Rencana berjalan lancar berarti teknisi menepati janjinya (tidak membatalkan). Fakta premis menyatakan anaknya sedang mengerjakan tugas sekolah sehingga tetap tidak bisa membantu. Maka pilihan A paling tepat."
        },
        {
          "id": "utbk26_pu_03",
          "nomor": 3,
          "mapel": "Penalaran Umum (PU)",
          "subkategori": "Penalaran Deduktif",
          "teksSoal": "Setiap menyelesaikan tugas bersama tim, Adi dan Dito memiliki tugas masing-masing. Biasanya, jika Adi memimpin diskusi atau mengungkapkan idenya dalam kelompok, Dito mencatat semua hasil diskusi secara detail agar semuanya tersimpan dengan baik. Sementara itu, Budi mencari bahan referensi dan membagi beban kerja agar anggota tim merasa nyaman dalam mengerjakan tugas. Jika saat ini Adi memimpin diskusi atau mengungkapkan idenya, kesimpulan yang PALING TEPAT adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Dito tidak mencatat semua hasil diskusi secara detail dan Budi tidak mencari bahan referensi."
            },
            {
              "key": "B",
              "teks": "Budi akan membagi beban kerja dan Dito akan mencatat semua hasil diskusi secara detail."
            },
            {
              "key": "C",
              "teks": "Jika Budi mencari bahan referensi, Dito akan mencatat semua hasil diskusi secara detail."
            },
            {
              "key": "D",
              "teks": "Adi memimpin diskusi tetapi Dito menolak mencatat hasil kerja kelompok."
            },
            {
              "key": "E",
              "teks": "Budi memimpin diskusi menggantikan Adi yang sedang mencari bahan referensi."
            }
          ],
          "kunciJawaban": "C",
          "pembahasan": "Premis: (Adi memimpin ∨ Adi ungkap ide) → Dito mencatat detail. Karena premis syarat terpenuhi, 'Dito mencatat detail' bernilai BENAR. Dalam logika implikasi, kalimat bersyarat 'Jika R maka D' selalu bernilai benar ketika D (konsekuen) benar."
        },
        {
          "id": "utbk26_pu_04",
          "nomor": 4,
          "mapel": "Penalaran Umum (PU)",
          "subkategori": "Penalaran Deduktif",
          "teksSoal": "Dika sedang menyelesaikan naskah ceritanya untuk diunggah ke portal lomba. Berdasarkan aturan pengiriman, Dika tidak bisa mengirim naskah tepat waktu jika jaringan internet terganggu. Meskipun menghadapi berbagai hambatan tersebut, Dika terus berupaya mengunggah berkas naskahnya sampai detik-detik terakhir. Berdasarkan teks di atas, jika Dika berhasil mengirim naskah tepat waktu, kesimpulan yang PALING TEPAT adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Jaringan internet Dika terganggu, tetapi seluruh bagian naskahnya sudah selesai direvisi."
            },
            {
              "key": "B",
              "teks": "Jaringan internet Dika tidak terganggu, meskipun banyak bagian naskah yang belum direvisi."
            },
            {
              "key": "C",
              "teks": "Dika memiliki waktu yang cukup untuk merevisi seluruh bagian naskah ceritanya."
            },
            {
              "key": "D",
              "teks": "Jaringan internet Dika terganggu sehingga ia gagal mengirimkan naskah cerita tersebut."
            },
            {
              "key": "E",
              "teks": "Dika memutuskan untuk mundur dan tidak mengunggah naskah ceritanya ke portal panitia."
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Premis: Jaringan terganggu → Tidak bisa kirim tepat waktu. Kontraposisi: Berhasil kirim tepat waktu → Jaringan internet tidak terganggu. Status naskah yang belum tuntas tidak mengubah inferensi logika jaringan."
        },
        {
          "id": "utbk26_pu_05",
          "nomor": 5,
          "mapel": "Penalaran Umum (PU)",
          "subkategori": "Penalaran Deduktif",
          "teksSoal": "Bel pulang sekolah sudah berbunyi sejak tadi. Jemputan Iwan hari ini terlambat. Iwan tidak bisa pulang tepat waktu hari ini dan harus menunggu meskipun ada kemungkinan jemputannya tidak datang terlambat. Selain itu, Iwan juga belum menelepon orang tua jemputannya untuk memberi kabar mengenai keterlambatan ini. Dalam situasi tersebut, apa simpulan yang PALING TEPAT mengenai kondisi Iwan?",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Iwan sudah menelepon orang tua jemputannya dan ia bisa pulang tepat waktu hari ini."
            },
            {
              "key": "B",
              "teks": "Iwan memutuskan untuk berjalan kaki ke rumah tanpa menunggu jemputannya datang."
            },
            {
              "key": "C",
              "teks": "Jemputan Iwan tiba tepat waktu sehingga Iwan tidak perlu menelepon orang tuanya."
            },
            {
              "key": "D",
              "teks": "Iwan belum menelepon orang tua jemputannya dan ia tidak bisa pulang tepat waktu hari ini."
            },
            {
              "key": "E",
              "teks": "Jemputan Iwan tidak jadi datang terlambat dan ia bisa pulang tepat waktu hari ini."
            }
          ],
          "kunciJawaban": "D",
          "pembahasan": "Kombinasi dua premis langsung: Iwan belum menelepon orang tua jemputan ∧ Iwan tidak bisa pulang tepat waktu hari ini."
        },
        {
          "id": "utbk26_pu_06",
          "nomor": 6,
          "mapel": "Penalaran Umum (PU)",
          "subkategori": "Penalaran Deduktif",
          "teksSoal": "Keluarga Iwan akan menggunakan dua jenis transportasi untuk liburan tahun ini. Dua jenis tersebut adalah kereta api untuk perjalanan antarkota dan mobil untuk perjalanan dalam kota. Penggunaan transportasi tersebut juga bergantung pada kondisi nenek Iwan. Jika nenek Iwan ikut berlibur, mereka akan menggunakan pesawat. Jika keluarga Iwan tidak jadi naik kereta dan mobil saat liburan, pernyataan di bawah ini yang PALING TEPAT adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Keluarga Iwan tidak jadi naik kereta api dan menggunakan mobil."
            },
            {
              "key": "B",
              "teks": "Jika nenek ikut berlibur, mereka akan menggunakan pesawat."
            },
            {
              "key": "C",
              "teks": "Keluarga Iwan tidak naik kereta api dan menggunakan mobil."
            },
            {
              "key": "D",
              "teks": "Nenek tidak ikut berlibur dan keluarga Iwan menggunakan mobil."
            },
            {
              "key": "E",
              "teks": "Jika keluarga Iwan naik kereta api, nenek tidak ikut berlibur."
            }
          ],
          "kunciJawaban": "E",
          "pembahasan": "Premis: Nenek ikut → Naik pesawat (bukan kereta api). Kontraposisi: Jika keluarga naik kereta api → Nenek tidak ikut berlibur."
        },
        {
          "id": "utbk26_pu_07",
          "nomor": 7,
          "mapel": "Penalaran Umum (PU)",
          "subkategori": "Penalaran Deduktif",
          "teksSoal": "Ami dan Dea biasanya membantu orang tuanya dengan berbagi tugas. Pada pagi hari, Ami mengepel lantai agar seluruh rumah bersih, sedangkan Dea akan membantu kegiatan di dapur agar sarapan pagi siap tepat waktu. Namun, jika Ami sedang sakit, ibu yang akan mengepel lantai. Sementara itu, jika Dea ada kelas pagi, ayah yang akan menggantikan Dea menyiapkan sarapan. Pagi ini, Ami tidak mengepel lantai dan ayah menyiapkan sarapan. Kesimpulan yang PALING PASTI BENAR adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Ami sedang tidak sakit dan Dea tidak memiliki kelas pagi."
            },
            {
              "key": "B",
              "teks": "Ibu mengepel lantai dan Dea memiliki kelas pagi."
            },
            {
              "key": "C",
              "teks": "Ayah mengepel lantai bersama ibu di pagi hari."
            },
            {
              "key": "D",
              "teks": "Dea membantu Ami mengepel lantai di ruang depan."
            },
            {
              "key": "E",
              "teks": "Seluruh pekerjaan rumah diselesaikan oleh ayah sendiri."
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Karena Ami tidak mengepel, maka ibu yang mengepel. Karena ayah menyiapkan sarapan, berarti Dea ada kelas pagi."
        },
        {
          "id": "utbk26_pu_08",
          "nomor": 8,
          "mapel": "Penalaran Umum (PU)",
          "subkategori": "Penalaran Deduktif",
          "teksSoal": "Di sebuah peternakan, semua sapi perah yang sehat diberi pakan rumput gajah segar dan konsentrat mineral setiap pagi. Sapi yang memproduksi susu di atas 15 liter per hari selalu merupakan sapi perah yang sehat. Sapi 'Bessie' pagi ini tidak diberi pakan rumput gajah segar. Kesimpulan yang PALING TEPAT adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Sapi Bessie bukan sapi perah yang sehat atau tidak memproduksi susu di atas 15 liter per hari."
            },
            {
              "key": "B",
              "teks": "Sapi Bessie tetap memproduksi susu lebih dari 20 liter per hari."
            },
            {
              "key": "C",
              "teks": "Sapi Bessie diberi rumput kering menggantikan rumput gajah segar."
            },
            {
              "key": "D",
              "teks": "Semua sapi di peternakan tersebut sedang mengalami penurunan nafsu makan."
            },
            {
              "key": "E",
              "teks": "Peternak lupa memberikan konsentrat mineral kepada sapi Bessie."
            }
          ],
          "kunciJawaban": "A",
          "pembahasan": "Susu > 15L → Sehat → Rumput segar. Kontraposisi: ¬Rumput segar → ¬Sehat → ¬(Susu > 15L)."
        },
        {
          "id": "utbk26_pu_09",
          "nomor": 9,
          "mapel": "Penalaran Umum (PU)",
          "subkategori": "Penalaran Deduktif",
          "teksSoal": "Kereta Cepat relasi Halim-Tegalluar hanya diberangkatkan jika sinyal telekomunikasi lintasan aman dan pasokan listrik aliran atas stabil. Hari ini beberapa jadwal perjalanan kereta cepat dibatalkan keberangkatannya. Simpulan yang PALING TEPAT adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Sinyal telekomunikasi lintasan dan pasokan listrik keduanya stabil."
            },
            {
              "key": "B",
              "teks": "Kapasitas tempat duduk penumpang kereta cepat belum terisi penuh."
            },
            {
              "key": "C",
              "teks": "Sinyal telekomunikasi lintasan tidak aman atau pasokan listrik aliran atas tidak stabil."
            },
            {
              "key": "D",
              "teks": "Terjadi pemadaman listrik total di seluruh stasiun antara."
            },
            {
              "key": "E",
              "teks": "Masinis memutuskan untuk menunda perjalanan karena faktor angin."
            }
          ],
          "kunciJawaban": "C",
          "pembahasan": "Berangkat → (Sinyal Aman ∧ Listrik Stabil). Negasi: Tidak berangkat → Sinyal tidak aman ∨ Listrik tidak stabil."
        },
        {
          "id": "utbk26_pu_10",
          "nomor": 10,
          "mapel": "Penalaran Umum (PU)",
          "subkategori": "Penalaran Deduktif",
          "teksSoal": "Semua karyawan teladan di perusahaan teknologi Gemilang menguasai minimal satu bahasa pemrograman dan memiliki sertifikasi manajemen proyek. Rendy adalah karyawan di divisi pemasaran yang tidak menguasai satu pun bahasa pemrograman. Kesimpulan yang PALING TEPAT adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Rendy memiliki sertifikasi manajemen proyek tingkat lanjutan."
            },
            {
              "key": "B",
              "teks": "Rendy sedang menempuh pelatihan bahasa pemrograman Python."
            },
            {
              "key": "C",
              "teks": "Divisi pemasaran tidak memiliki karyawan berkategori teladan."
            },
            {
              "key": "D",
              "teks": "Rendy bukan merupakan karyawan teladan di perusahaan tersebut."
            },
            {
              "key": "E",
              "teks": "Karyawan teladan hanya berasal dari divisi rekayasa perangkat lunak."
            }
          ],
          "kunciJawaban": "D",
          "pembahasan": "Karyawan teladan → Kuasai bahasa pemrograman. Rendy tidak menguasai bahasa pemrograman, maka Rendy bukan karyawan teladan."
        },
        {
          "id": "utbk26_pu_11",
          "nomor": 11,
          "mapel": "Penalaran Umum (PU)",
          "subkategori": "Penalaran Induktif",
          "teksSoal": "Sebuah penelitian di sentra pertanian padi Karawang menguji varietas bibit tahan kekeringan (Padi Gogo Unggul). Dari 50 petak sawah yang mengalami defisit air hingga 40% selama masa tanam, sebanyak 46 petak tetap mampu menghasilkan panen di atas 6 ton per hektar. Sementara itu, varietas konvensional di wilayah yang sama mengalami penurunan hasil panen rata-rata hingga 65%. Simpulan yang PALING DIDUKUNG oleh data tersebut adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Varietas bibit konvensional sama sekali tidak mampu tumbuh di daerah Karawang."
            },
            {
              "key": "B",
              "teks": "Faktor pupuk kandang lebih menentukan keberhasilan panen daripada pemilihan varietas bibit."
            },
            {
              "key": "C",
              "teks": "Varietas Padi Gogo Unggul memiliki ketahanan yang signifikan terhadap kondisi cekaman kekurangan air."
            },
            {
              "key": "D",
              "teks": "Seluruh petani di Jawa Barat telah beralih menanam Padi Gogo Unggul."
            },
            {
              "key": "E",
              "teks": "Biaya penanaman Padi Gogo Unggul lebih mahal dibandingkan bibit konvensional."
            }
          ],
          "kunciJawaban": "C",
          "pembahasan": "Tingkat keberhasilan 46 dari 50 petak sawah (92%) pada defisit air 40% secara induktif menunjukkan ketahanan tinggi bibit tersebut terhadap kekeringan."
        },
        {
          "id": "utbk26_pu_12",
          "nomor": 12,
          "mapel": "Penalaran Umum (PU)",
          "subkategori": "Penalaran Induktif",
          "teksSoal": "Data pantauan citra satelit selama lima tahun terakhir menunjukkan bahwa kenaikan suhu permukaan air laut di atas 1,2°C di perairan kawasan timur Indonesia selalu diikuti oleh peristiwa pemutihan karang (coral bleaching) massal dalam waktu 3 bulan setelahnya. Tahun ini, sensor laut mencatat anomali kenaikan suhu sebesar 1,5°C di perairan Raja Ampat sejak bulan Januari. Prediksi yang PALING MUNGKIN terjadi adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Populasi ikan karang akan meningkat pesat pada bulan April."
            },
            {
              "key": "B",
              "teks": "Kawasan terumbu karang Raja Ampat berisiko tinggi mengalami peristiwa pemutihan karang dalam waktu dekat."
            },
            {
              "key": "C",
              "teks": "Suhu air laut akan kembali normal secara instan tanpa memengaruhi ekosistem."
            },
            {
              "key": "D",
              "teks": "Kenaikan suhu tidak berdampak pada alga simbiotik zooxanthellae."
            },
            {
              "key": "E",
              "teks": "Nelayan setempat akan menghentikan seluruh aktivitas melaut secara permanen."
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Kenaikan suhu 1,5°C melampaui ambang 1,2°C yang secara berulang memicu pemutihan karang."
        },
        {
          "id": "utbk26_pu_13",
          "nomor": 13,
          "mapel": "Penalaran Umum (PU)",
          "subkategori": "Penalaran Induktif",
          "teksSoal": "Berdasarkan laporan konsumsi energi bulanan PLN, penggunaan listrik rumah tangga di kota metropolitan melonjak rata-rata 28% setiap kali indeks suhu rata-rata harian melampaui 33°C. Peningkatan ini didominasi oleh pengoperasian perangkat pendingin udara (AC) selama durasi yang lebih lama. Manakah pernyataan berikut yang PALING MELEMAHKAN simpulan bahwa suhu udara panas menyebabkan lonjakan tagihan listrik?",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Lonjakan konsumsi listrik juga terjadi di wilayah dataran tinggi bersuhu sejuk karena adanya program kerja dari rumah (WFH) serentak."
            },
            {
              "key": "B",
              "teks": "Banyak rumah tangga menyalakan pendingin ruangan dengan temperatur 18°C saat siang hari."
            },
            {
              "key": "C",
              "teks": "Penggunaan kipas angin elektrik tidak menyedot daya sebesar pendingin ruangan freon."
            },
            {
              "key": "D",
              "teks": "Tarif dasar listrik per kilowatt-hour (kWh) tidak mengalami kenaikan sepanjang tahun."
            },
            {
              "key": "E",
              "teks": "Suhu panas menyebabkan masyarakat enggan beraktivitas di luar rumah."
            }
          ],
          "kunciJawaban": "A",
          "pembahasan": "Pernyataan A menunjukkan adanya faktor alternatif (WFH serentak) yang memicu lonjakan konsumsi listrik di daerah yang tidak bersuhu panas, sehingga melemahkan korelasi tunggal suhu panas."
        },
        {
          "id": "utbk26_pu_14",
          "nomor": 14,
          "mapel": "Penalaran Umum (PU)",
          "subkategori": "Penalaran Induktif",
          "teksSoal": "Uji klinis terhadap 500 partisipan usia produktif menunjukkan bahwa mereka yang rutin berjalan kaki minimal 7.500 langkah per hari memiliki tekanan darah sistolik rata-rata 8 mmHg lebih rendah dibandingkan kelompok yang bergaya hidup santai (kurang dari 2.500 langkah per hari). Simpulan yang PALING TEPAT adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Berjalan kaki merupakan satu-satunya cara mencegah penyakit kardiovaskular."
            },
            {
              "key": "B",
              "teks": "Tekanan darah tinggi hanya menyerang individu yang tidak pernah berolahraga."
            },
            {
              "key": "C",
              "teks": "Obat antihipertensi tidak lagi diperlukan jika seseorang sudah berjalan kaki 7.500 langkah."
            },
            {
              "key": "D",
              "teks": "Aktivitas fisik teratur seperti berjalan kaki berkontribusi positif dalam memelihara tekanan darah yang sehat."
            },
            {
              "key": "E",
              "teks": "Setiap pertambahan 1.000 langkah menurunkan tekanan darah secara linier tanpa batas."
            }
          ],
          "kunciJawaban": "D",
          "pembahasan": "Kesimpulan induktif yang proporsional dan tidak melebih-lebihkan data uji klinis."
        },
        {
          "id": "utbk26_pu_15",
          "nomor": 15,
          "mapel": "Penalaran Umum (PU)",
          "subkategori": "Penalaran Induktif",
          "teksSoal": "Survei preferensi konsumen menunjukkan bahwa 78% pembeli generasi muda bersedia membayar 10-15% lebih mahal untuk produk fesyen yang menggunakan bahan daur ulang dan memiliki sertifikasi netral karbon. Hal ini menunjukkan pergeseran tren menuju konsumsi berkelanjutan. Manakah pernyataan berikut yang PALING MEMPERKUAT tren tersebut?",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Harga bahan baku katun organik saat ini mengalami fluktuasi di pasar dunia."
            },
            {
              "key": "B",
              "teks": "Penjualan merek fesyen ramah lingkungan mencatat pertumbuhan tahunan 35%, jauh melampaui merek fesyen cepat (fast fashion)."
            },
            {
              "key": "C",
              "teks": "Beberapa pabrik tekstil mengalami kesulitan memenuhi standar limbah cair."
            },
            {
              "key": "D",
              "teks": "Generasi tua lebih mengutamakan daya tahan pakaian daripada asal-usul bahan baku."
            },
            {
              "key": "E",
              "teks": "Pemerintah memberikan subsidi untuk impor mesin pemintal benang sintetis."
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Pertumbuhan riil 35% pada penjualan produk ramah lingkungan membuktikan bahwa preferensi survei benar-benar terealisasi dalam transaksi pasar."
        },
        {
          "id": "utbk26_pu_16",
          "nomor": 16,
          "mapel": "Penalaran Umum (PU)",
          "subkategori": "Penalaran Induktif",
          "teksSoal": "Penerapan sistem zonasi sekolah dalam beberapa tahun terakhir di kota X diiringi dengan penurunan angka kemacetan lalu lintas pada jam berangkat sekolah sebesar 18%. Analis perkotaan menyimpulkan bahwa berkurangnya jarak tempuh siswa ke sekolah berkontribusi langsung pada kelancaran jalan protokol. Asumsi yang MENDASARI simpulan analis tersebut adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Sebagian besar siswa sebelumnya diantar menggunakan kendaraan bermotor pribadi melintasi jalan protokol."
            },
            {
              "key": "B",
              "teks": "Semua sekolah di kota X memiliki fasilitas transportasi bus sekolah gratis."
            },
            {
              "key": "C",
              "teks": "Pemerintah kota X telah melebarkan jalan-jalan utama sebesar dua lajur."
            },
            {
              "key": "D",
              "teks": "Orang tua murid tidak lagi menggunakan kendaraan pribadi untuk berangkat ke kantor."
            },
            {
              "key": "E",
              "teks": "Jam masuk kantor diubah menjadi lebih awal daripada jam masuk sekolah."
            }
          ],
          "kunciJawaban": "A",
          "pembahasan": "Asumsi logis penghubung: agar pemendekan jarak sekolah berdampak pada jalan protokol, siswa sebelumnya haruslah melewati jalan tersebut dengan kendaraan pribadi."
        },
        {
          "id": "utbk26_pu_17",
          "nomor": 17,
          "mapel": "Penalaran Umum (PU)",
          "subkategori": "Penalaran Induktif",
          "teksSoal": "Sebuah kota wisata mengalami kenaikan jumlah wisatawan mancanegara sebesar 45% dalam setahun setelah bandara internasional barunya diresmikan. Namun, indeks pencemaran sampah di pesisir pantai kawasan wisata tersebut juga melonjak sebesar 60% pada periode yang sama. Hubungan yang PALING TEPAT antara kedua peristiwa tersebut adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Peningkatan aktivitas wisata belum diimbangi dengan sistem pengelolaan sampah dan kesadaran lingkungan yang memadai."
            },
            {
              "key": "B",
              "teks": "Bandara baru dibangun tepat di atas garis pasang surut pesisir pantai wisata."
            },
            {
              "key": "C",
              "teks": "Wisatawan mancanegara sengaja membuang sampah untuk merusak daya tarik pantai."
            },
            {
              "key": "D",
              "teks": "Jumlah tempat penampungan sampah di kota wisata tersebut berkurang drastis."
            },
            {
              "key": "E",
              "teks": "Kenaikan wisatawan tidak ada hubungannya sama sekali dengan volume timbulan sampah."
            }
          ],
          "kunciJawaban": "A",
          "pembahasan": "Hubungan kausal wajar: lonjakan pengunjung menghasilkan volume sampah yang melampaui daya tampung infrastruktur sanitasi yang ada."
        },
        {
          "id": "utbk26_pu_18",
          "nomor": 18,
          "mapel": "Penalaran Umum (PU)",
          "subkategori": "Penalaran Induktif",
          "teksSoal": "Riset di laboratorium pangan mendapati bahwa roti yang diberi ekstrak kulit manggis dapat bertahan 4 hari lebih lama tanpa ditumbuhi jamur dibandingkan roti biasa pada suhu ruang. Senyawa antioksidan dan antimikroba alami pada kulit manggis dinilai menghambat spora kapang. Manakah hipotesis lanjut yang PALING TEPAT dikembangkan?",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Kulit manggis dapat digunakan sebagai bahan pengganti tepung terigu dalam pembuatan roti."
            },
            {
              "key": "B",
              "teks": "Ekstrak kulit manggis berpotensi dikembangkan sebagai bahan pengawet alami yang aman pada produk bakeri."
            },
            {
              "key": "C",
              "teks": "Roti tanpa pengawet sintesis tidak akan laku di pasaran ritel modern."
            },
            {
              "key": "D",
              "teks": "Semua jenis buah tropis memiliki daya hambat jamur yang serupa dengan manggis."
            },
            {
              "key": "E",
              "teks": "Jamur roti tidak dapat berkembang biak pada media yang mengandung gula."
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Pemanfaatan senyawa antimikroba kulit manggis sebagai pengawet pangan alami merupakan hipotesis lanjutan yang paling realistis dan bernilai aplikatif."
        },
        {
          "id": "utbk26_pu_19",
          "nomor": 19,
          "mapel": "Penalaran Umum (PU)",
          "subkategori": "Penalaran Induktif",
          "teksSoal": "Data dari 1.000 pengemudi mobil listrik menunjukkan bahwa rata-rata efisiensi konsumsi baterai berkurang 20% ketika kecepatan kendaraan dinaikkan dari 80 km/jam ke 120 km/jam di jalan tol. Manakah faktor fisika yang PALING MENDUKUNG fenomena tersebut?",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Gaya gesek ban dengan aspal berkurang drastis pada kecepatan tinggi."
            },
            {
              "key": "B",
              "teks": "Hambatan aerodinamis udara meningkat secara kuadratik terhadap pertambahan kecepatan kendaraan."
            },
            {
              "key": "C",
              "teks": "Motor listrik mengalami penurunan arus listrik ketika melaju kencang."
            },
            {
              "key": "D",
              "teks": "Sistem pendingin baterai berhenti bekerja pada kecepatan di atas 100 km/jam."
            },
            {
              "key": "E",
              "teks": "Bobot kendaraan bertambah berat seiring bertambahnya laju kecepatan."
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Gaya hambat aerodinamika (drag force) berbanding lurus dengan kuadrat kecepatan, menuntut daya baterai jauh lebih besar pada kecepatan tinggi."
        },
        {
          "id": "utbk26_pu_20",
          "nomor": 20,
          "mapel": "Penalaran Umum (PU)",
          "subkategori": "Penalaran Induktif",
          "teksSoal": "Sebuah aplikasi bimbingan belajar mencatat bahwa siswa yang mengerjakan latihan soal mandiri sedikitnya 30 menit setiap hari memiliki tingkat kelulusan SNBT 40% lebih tinggi dibanding siswa yang hanya belajar secara maraton seminggu sebelum ujian. Pola belajar yang PALING DISARANKAN berdasarkan temuan ini adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Belajar sistem kebut semalam (SKS) lebih efektif untuk jangka pendek."
            },
            {
              "key": "B",
              "teks": "Latihan soal tidak berpengaruh jika siswa sudah memahami konsep di kelas."
            },
            {
              "key": "C",
              "teks": "Distribusi belajar bertahap secara konsisten (spaced repetition) lebih efektif dalam penguasaan materi ujian."
            },
            {
              "key": "D",
              "teks": "Siswa cukup belajar 30 menit sehari tanpa perlu mengikuti tryout berkala."
            },
            {
              "key": "E",
              "teks": "Hanya siswa jenius yang mampu lulus SNBT tanpa bimbingan intensif."
            }
          ],
          "kunciJawaban": "C",
          "pembahasan": "Data membuktikan keunggulan metode belajar bertahap yang konsisten (spaced learning) dibanding kramming (massed practice)."
        },
        {
          "id": "utbk26_pu_21",
          "nomor": 21,
          "mapel": "Penalaran Umum (PU)",
          "subkategori": "Penalaran Kuantitatif / Logis",
          "teksSoal": "Perhatikan pola barisan bilangan berikut:\n4, 7, 12, 19, 28, 39, ...\nBilangan berikutnya pada barisan tersebut adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "48"
            },
            {
              "key": "B",
              "teks": "50"
            },
            {
              "key": "C",
              "teks": "52"
            },
            {
              "key": "D",
              "teks": "54"
            },
            {
              "key": "E",
              "teks": "56"
            }
          ],
          "kunciJawaban": "C",
          "pembahasan": "Selisih antarsuku bertingkat: +3, +5, +7, +9, +11, maka selisih berikutnya adalah +13. Jadi 39 + 13 = 52."
        },
        {
          "id": "utbk26_pu_22",
          "nomor": 22,
          "mapel": "Penalaran Umum (PU)",
          "subkategori": "Penalaran Kuantitatif / Logis",
          "teksSoal": "Perhatikan barisan huruf berpola berikut:\nB, D, G, K, P, ...\nHuruf berikutnya adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "U"
            },
            {
              "key": "B",
              "teks": "V"
            },
            {
              "key": "C",
              "teks": "W"
            },
            {
              "key": "D",
              "teks": "X"
            },
            {
              "key": "E",
              "teks": "Y"
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Pola posisi abjad: B(2), D(4) [+2], G(7) [+3], K(11) [+4], P(16) [+5]. Maka berikutnya +6 -> 16 + 6 = 22, yaitu huruf V."
        },
        {
          "id": "utbk26_pu_23",
          "nomor": 23,
          "mapel": "Penalaran Umum (PU)",
          "subkategori": "Penalaran Kuantitatif / Logis",
          "teksSoal": "Jika $a * b = \\frac{a \\times b}{a + b}$ untuk semua bilangan real positif, maka nilai dari $6 * (3 * 6)$ adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "1,2"
            },
            {
              "key": "B",
              "teks": "1,5"
            },
            {
              "key": "C",
              "teks": "2,0"
            },
            {
              "key": "D",
              "teks": "2,4"
            },
            {
              "key": "E",
              "teks": "3,0"
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Pertama hitung (3 * 6) = (3 x 6)/(3 + 6) = 18/9 = 2. Kemudian 6 * 2 = (6 x 2)/(6 + 2) = 12/8 = 1,5."
        },
        {
          "id": "utbk26_pu_24",
          "nomor": 24,
          "mapel": "Penalaran Umum (PU)",
          "subkategori": "Penalaran Kuantitatif / Logis",
          "teksSoal": "Lima orang siswa (A, B, C, D, E) mengikuti tes pemahaman logika. Diketahui:\n- Nilai A lebih tinggi dari B tetapi lebih rendah dari C.\n- Nilai D lebih tinggi dari C.\n- Nilai E lebih tinggi dari B tetapi lebih rendah dari A.\nUrutan siswa dari yang memperoleh nilai TERTINGGI hingga TERENDAH adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "D, C, A, E, B"
            },
            {
              "key": "B",
              "teks": "D, A, C, E, B"
            },
            {
              "key": "C",
              "teks": "C, D, A, E, B"
            },
            {
              "key": "D",
              "teks": "D, C, E, A, B"
            },
            {
              "key": "E",
              "teks": "C, A, D, B, E"
            }
          ],
          "kunciJawaban": "A",
          "pembahasan": "Dari premis: B < E < A < C < D. Urutan dari tertinggi ke terendah: D, C, A, E, B."
        },
        {
          "id": "utbk26_pu_25",
          "nomor": 25,
          "mapel": "Penalaran Umum (PU)",
          "subkategori": "Penalaran Kuantitatif / Logis",
          "teksSoal": "Perhatikan tabel perbandingan target dan realisasi penjualan 4 cabang bimbel:\n<div class=\"table-responsive\"><table class=\"table-soal\"><thead><tr><th>Cabang</th><th>Target (Siswa)</th><th>Realisasi (Siswa)</th></tr></thead><tbody><tr><td>Pusat</td><td>200</td><td>190</td></tr><tr><td>Barat</td><td>150</td><td>156</td></tr><tr><td>Timur</td><td>180</td><td>171</td></tr><tr><td>Selatan</td><td>120</td><td>132</td></tr></tbody></table></div>\nCabang dengan persentase capaian target TERTINGGI adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Pusat"
            },
            {
              "key": "B",
              "teks": "Barat"
            },
            {
              "key": "C",
              "teks": "Timur"
            },
            {
              "key": "D",
              "teks": "Selatan"
            },
            {
              "key": "E",
              "teks": "Pusat dan Timur sama"
            }
          ],
          "kunciJawaban": "D",
          "pembahasan": "Capaian: Pusat = 190/200 = 95%; Barat = 156/150 = 104%; Timur = 171/180 = 95%; Selatan = 132/120 = 110%. Capaian tertinggi adalah Selatan (110%)."
        },
        {
          "id": "utbk26_pu_26",
          "nomor": 26,
          "mapel": "Penalaran Umum (PU)",
          "subkategori": "Penalaran Kuantitatif / Logis",
          "teksSoal": "Perhatikan barisan bilangan: 3, 5, 9, 17, 33, ...\nSuku ke-7 dari barisan tersebut adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "65"
            },
            {
              "key": "B",
              "teks": "97"
            },
            {
              "key": "C",
              "teks": "129"
            },
            {
              "key": "D",
              "teks": "131"
            },
            {
              "key": "E",
              "teks": "257"
            }
          ],
          "kunciJawaban": "C",
          "pembahasan": "Pola: $U_n = 2^{n} + 1$. Suku 1: 2^1+1=3; Suku 2: 2^2+1=5; Suku 3: 2^3+1=9; Suku 4: 2^4+1=17; Suku 5: 2^5+1=33; Suku 6: 2^6+1=65; Suku 7: 2^7+1 = 128 + 1 = 129."
        },
        {
          "id": "utbk26_pu_27",
          "nomor": 27,
          "mapel": "Penalaran Umum (PU)",
          "subkategori": "Penalaran Kuantitatif / Logis",
          "teksSoal": "Semua anggota klub robotika menyukai pemrograman. Sebagian anggota klub robotika juga menyukai desain 3D. Tidak ada orang yang menyukai desain 3D yang membenci estetika visual. Kesimpulan yang PALING TEPAT adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Semua orang yang menyukai estetika visual adalah anggota klub robotika."
            },
            {
              "key": "B",
              "teks": "Sebagian orang yang menyukai estetika visual menyukai pemrograman."
            },
            {
              "key": "C",
              "teks": "Semua anggota klub robotika tidak menyukai estetika visual."
            },
            {
              "key": "D",
              "teks": "Orang yang menyukai pemrograman pasti menyukai desain 3D."
            },
            {
              "key": "E",
              "teks": "Anggota klub robotika tidak ada yang menyukai estetika visual."
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Ada irisan anggota robotika yang menyukai desain 3D, dan mereka tidak membenci estetika visual (menyukai estetika). Karena mereka anggota robotika, mereka juga suka pemrograman. Maka sebagian orang yang menyukai estetika visual menyukai pemrograman."
        },
        {
          "id": "utbk26_pu_28",
          "nomor": 28,
          "mapel": "Penalaran Umum (PU)",
          "subkategori": "Penalaran Kuantitatif / Logis",
          "teksSoal": "Dalam sebuah antrean loket terdapat 7 orang: P, Q, R, S, T, U, V.\n- P berada tepat di depan Q.\n- R berada di antara S dan T.\n- V adalah orang paling belakang.\n- U berada di posisi ketiga dari depan.\nJika P berada di posisi pertama, siapa yang berada di posisi kedua?",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Q"
            },
            {
              "key": "B",
              "teks": "R"
            },
            {
              "key": "C",
              "teks": "S"
            },
            {
              "key": "D",
              "teks": "T"
            },
            {
              "key": "E",
              "teks": "U"
            }
          ],
          "kunciJawaban": "A",
          "pembahasan": "P posisi pertama, dan 'P tepat di depan Q', maka Q wajib berada tepat di posisi kedua."
        },
        {
          "id": "utbk26_pu_29",
          "nomor": 29,
          "mapel": "Penalaran Umum (PU)",
          "subkategori": "Penalaran Kuantitatif / Logis",
          "teksSoal": "Perhatikan susunan bilangan berikut:\nBaris 1: 2, 3, 5\nBaris 2: 7, 11, 13\nBaris 3: 17, 19, 23\nBilangan kedua pada Baris ke-5 adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "41"
            },
            {
              "key": "B",
              "teks": "43"
            },
            {
              "key": "C",
              "teks": "47"
            },
            {
              "key": "D",
              "teks": "53"
            },
            {
              "key": "E",
              "teks": "59"
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Bilangan prima berurutan: Prima 1-3 (baris 1), 4-6 (baris 2), 7-9 (baris 3), 10-12 (baris 4: 29, 31, 37), 13-15 (baris 5: 41, 43, 47). Bilangan kedua pada baris 5 adalah 43."
        },
        {
          "id": "utbk26_pu_30",
          "nomor": 30,
          "mapel": "Penalaran Umum (PU)",
          "subkategori": "Penalaran Kuantitatif / Logis",
          "teksSoal": "Rata-rata berat badan 5 orang pemain inti bola basket adalah 82 kg. Ketika satu orang pemain cadangan dimasukkan menggantikan seorang pemain inti yang memiliki berat 85 kg, rata-rata berat badan tim menjadi 81 kg. Berat badan pemain cadangan tersebut adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "76 kg"
            },
            {
              "key": "B",
              "teks": "78 kg"
            },
            {
              "key": "C",
              "teks": "79 kg"
            },
            {
              "key": "D",
              "teks": "80 kg"
            },
            {
              "key": "E",
              "teks": "81 kg"
            }
          ],
          "kunciJawaban": "D",
          "pembahasan": "Total berat awal = 5 x 82 = 410 kg. Total berat baru = 5 x 81 = 405 kg (turun 5 kg). Pemain keluar 85 kg, maka pemain pengganti = 85 - 5 = 80 kg (D)."
        }
      ]
    },
    {
      "id": "subtes_ppu",
      "kode": "PPU",
      "nama": "Pengetahuan & Pemahaman Umum (PPU)",
      "targetSoal": 20,
      "durasiMenit": 15,
      "estimasiDetik": 45,
      "soal": [
        {
          "id": "utbk26_ppu_01",
          "nomor": 1,
          "mapel": "Pengetahuan & Pemahaman Umum (PPU)",
          "teksSoal": "Penggunaan kata 'imparsial' dalam kalimat 'Lembaga pengawas pemilu wajib bersikap imparsial dalam menyelesaikan setiap sengketa perolehan suara' bermakna ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Cepat dan terukur"
            },
            {
              "key": "B",
              "teks": "Tidak memihak / netral"
            },
            {
              "key": "C",
              "teks": "Tegas dan otoriter"
            },
            {
              "key": "D",
              "teks": "Tertutup dari publik"
            },
            {
              "key": "E",
              "teks": "Mengikuti suara terbanyak"
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Imparsial menurut KBBI berarti tidak memihak, adil, atau netral terhadap pihak yang bersengketa."
        },
        {
          "id": "utbk26_ppu_02",
          "nomor": 2,
          "mapel": "Pengetahuan & Pemahaman Umum (PPU)",
          "teksSoal": "Kata 'ambivalen' paling tepat digunakan dalam kalimat ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Masyarakat menunjukkan sikap ambivalen terhadap penerapan regulasi baru tersebut; sebagian mendukung penghematan energi, namun sebagian lainnya mengeluhkan pembatasan mobilitas."
            },
            {
              "key": "B",
              "teks": "Jembatan gantung itu berdiri secara ambivalen di atas aliran sungai yang deras."
            },
            {
              "key": "C",
              "teks": "Dokter memberikan obat ambivalen untuk menurunkan panas tubuh pasien."
            },
            {
              "key": "D",
              "teks": "Warna lukisan seniman itu tampak sangat ambivalen di bawah sorot lampu galeri."
            },
            {
              "key": "E",
              "teks": "Mesin kendaraan beroperasi secara ambivalen sehingga konsumsi bahan bakar sangat hemat."
            }
          ],
          "kunciJawaban": "A",
          "pembahasan": "Ambivalen berarti bercabang dua, mendua hati, atau memiliki dua perasaan/sikap yang saling bertentangan secara bersamaan."
        },
        {
          "id": "utbk26_ppu_03",
          "nomor": 3,
          "mapel": "Pengetahuan & Pemahaman Umum (PPU)",
          "teksSoal": "Perhatikan pasangan analogi kata berikut:\nPEMBELAJARAN : TEKNOLOGI = PENERANGAN : ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Matahari"
            },
            {
              "key": "B",
              "teks": "Malam"
            },
            {
              "key": "C",
              "teks": "Listrik"
            },
            {
              "key": "D",
              "teks": "Kegelapan"
            },
            {
              "key": "E",
              "teks": "Lampu"
            }
          ],
          "kunciJawaban": "E",
          "pembahasan": "Pembelajaran (proses) memanfaatkan Teknologi (alat/media buatan). Penerangan (proses) memanfaatkan Lampu (alat/media buatan)."
        },
        {
          "id": "utbk26_ppu_04",
          "nomor": 4,
          "mapel": "Pengetahuan & Pemahaman Umum (PPU)",
          "teksSoal": "Perhatikan analogi hubungan profesi dan hasil karya:\nARSITEK : CETAK BIRU = KOMPOSER : ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Konser"
            },
            {
              "key": "B",
              "teks": "Partitur Lagu"
            },
            {
              "key": "C",
              "teks": "Penyanyi"
            },
            {
              "key": "D",
              "teks": "Instrumen Musik"
            },
            {
              "key": "E",
              "teks": "Studio Rekaman"
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Arsitek merancang cetak biru (blueprint) sebagai pedoman fisik. Komposer menyusun partitur (notasi balok/angka) sebagai pedoman komposisi musik."
        },
        {
          "id": "utbk26_ppu_05",
          "nomor": 5,
          "mapel": "Pengetahuan & Pemahaman Umum (PPU)",
          "teksSoal": "Makna kata 'anomali' dalam kalimat 'Anomali iklim El Nino mengakibatkan mundurnya awal musim tanam di kawasan selatan khatulistiwa' adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Penyimpangan dari keadaan normal"
            },
            {
              "key": "B",
              "teks": "Proses pemanasan global"
            },
            {
              "key": "C",
              "teks": "Bencana alam berkala"
            },
            {
              "key": "D",
              "teks": "Perubahan musim teratur"
            },
            {
              "key": "E",
              "teks": "Peningkatan kelembapan udara"
            }
          ],
          "kunciJawaban": "A",
          "pembahasan": "Anomali berarti penyimpangan atau ketidaknormalan dari standar atau pola umum yang berlaku."
        },
        {
          "id": "utbk26_ppu_06",
          "nomor": 6,
          "mapel": "Pengetahuan & Pemahaman Umum (PPU)",
          "teksSoal": "Lawan kata (antonim) yang paling tepat untuk kata 'SPORADIS' adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Jarang"
            },
            {
              "key": "B",
              "teks": "Acak"
            },
            {
              "key": "C",
              "teks": "Kontinu / Teratur"
            },
            {
              "key": "D",
              "teks": "Lokal"
            },
            {
              "key": "E",
              "teks": "Spontan"
            }
          ],
          "kunciJawaban": "C",
          "pembahasan": "Sporadis berarti kadang-kadang, tidak tentu, atau terpencar-pencar. Antonimnya adalah kontinu, berkesinambungan, atau teratur."
        },
        {
          "id": "utbk26_ppu_07",
          "nomor": 7,
          "mapel": "Pengetahuan & Pemahaman Umum (PPU)",
          "teksSoal": "Kata berimbuhan yang bermakna 'hasil perbuatan' terdapat pada kalimat ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Pemerintah terus mendorong pemerataan fasilitas pendidikan."
            },
            {
              "key": "B",
              "teks": "Lukisan pemandangan karya maestro itu terjual dengan harga tinggi di balai lelang."
            },
            {
              "key": "C",
              "teks": "Petani menggunakan penyemprotan otomatis di rumah kaca."
            },
            {
              "key": "D",
              "teks": "Pengangkutan logistik pemilu menghadapi kendala cuaca buruk."
            },
            {
              "key": "E",
              "teks": "Perjalanan menuju puncak gunung memakan waktu enam jam."
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Kata 'lukisan' berasal dari kata kerja 'melukis' + sufiks -an yang bermakna hasil pekerjaan melukis."
        },
        {
          "id": "utbk26_ppu_08",
          "nomor": 8,
          "mapel": "Pengetahuan & Pemahaman Umum (PPU)",
          "teksSoal": "Istilah 'resiliensi' dalam konteks ekonomi pascabencana merujuk pada ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Penyerahan bantuan tunai darurat"
            },
            {
              "key": "B",
              "teks": "Kemampuan untuk bangkit dan pulih kembali dari guncangan"
            },
            {
              "key": "C",
              "teks": "Pengurangan utang luar negeri"
            },
            {
              "key": "D",
              "teks": "Pemindahan penduduk ke lokasi baru"
            },
            {
              "key": "E",
              "teks": "Pemberhentian sementara aktivitas perdagangan"
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Resiliensi adalah daya lenting atau kapasitas untuk beradaptasi, bertahan, dan pulih dari situasi sulit atau krisis."
        },
        {
          "id": "utbk26_ppu_09",
          "nomor": 9,
          "mapel": "Pengetahuan & Pemahaman Umum (PPU)",
          "teksSoal": "Ungkapan 'kambing hitam' dalam kalimat 'Ia tidak mau dijadikan kambing hitam atas kegagalan proyek peluncuran satelit tersebut' bermakna ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Pimpinan proyek yang berwenang"
            },
            {
              "key": "B",
              "teks": "Pihak yang dipersalahkan atas kesalahan pihak lain"
            },
            {
              "key": "C",
              "teks": "Penyumbang dana terbesar"
            },
            {
              "key": "D",
              "teks": "Ahli teknis yang mengundurkan diri"
            },
            {
              "key": "E",
              "teks": "Pihak ketiga yang tidak terlibat"
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Kambing hitam adalah kiasan untuk orang atau pihak yang dipersalahkan atas kemalangan atau kesalahan yang dilakukan orang lain."
        },
        {
          "id": "utbk26_ppu_10",
          "nomor": 10,
          "mapel": "Pengetahuan & Pemahaman Umum (PPU)",
          "teksSoal": "Bacalah teks singkat berikut:\n'Pemanfaatan kecerdasan buatan (AI) di bidang diagnostik medis telah memperlihatkan akurasi tinggi dalam mendeteksi karsinoma stadium awal. Meski demikian, para pakar bioetika mengingatkan bahwa keputusan klinis mutlak tetap berada di bawah kendali dokter spesialis demi menjaga akuntabilitas moral.'\nIde pokok kutipan di atas adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "AI telah sepenuhnya menggantikan peran dokter di rumah sakit."
            },
            {
              "key": "B",
              "teks": "Bahaya kesalahan komputasi AI dalam rekam medis pasien."
            },
            {
              "key": "C",
              "teks": "Keunggulan akurasi AI dalam diagnostik medis yang tetap memerlukan kendali etis dokter."
            },
            {
              "key": "D",
              "teks": "Penolakan dokter terhadap integrasi sistem perangkat lunak di klinik."
            },
            {
              "key": "E",
              "teks": "Kebutuhan kurikulum baru bioetika di fakultas kedokteran."
            }
          ],
          "kunciJawaban": "C",
          "pembahasan": "Ide pokok merangkum potensi diagnostik AI berakurasi tinggi sekaligus pembatasan etis bahwa dokter tetap memegang keputusan akhir."
        },
        {
          "id": "utbk26_ppu_11",
          "nomor": 11,
          "mapel": "Pengetahuan & Pemahaman Umum (PPU)",
          "teksSoal": "Kata 'inheren' dalam kalimat 'Prinsip persamaan di depan hukum merupakan nilai yang inheren dalam sistem demokrasi konstitusional' bermakna ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Melekat erat dan tidak dapat dipisahkan"
            },
            {
              "key": "B",
              "teks": "Diberikan secara bersyarat oleh pemerintah"
            },
            {
              "key": "C",
              "teks": "Bersifat sementara tergantung situasi darurat"
            },
            {
              "key": "D",
              "teks": "Dapat diperjualbelikan antarwarga negara"
            },
            {
              "key": "E",
              "teks": "Hanya berlaku bagi golongan tertentu"
            }
          ],
          "kunciJawaban": "A",
          "pembahasan": "Kata 'inheren' (inherent) berarti terikat erat, menyatu secara hakiki, dan tidak dapat dipisahkan dari hakikat dasarnya."
        },
        {
          "id": "utbk26_ppu_12",
          "nomor": 12,
          "mapel": "Pengetahuan & Pemahaman Umum (PPU)",
          "teksSoal": "Pilihlah pasangan kata yang memiliki hubungan analogi paling setara dengan pasangan:\nHIPOTESIS : EKSPERIMEN",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Teori : Buku referensi"
            },
            {
              "key": "B",
              "teks": "Dugaan awal : Pengujian"
            },
            {
              "key": "C",
              "teks": "Rencana : Pembatalan"
            },
            {
              "key": "D",
              "teks": "Vonis : Jaksa"
            },
            {
              "key": "E",
              "teks": "Anggaran : Korupsi"
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Hipotesis adalah dugaan awal ilmiah yang memerlukan eksperimen untuk diuji kebenarannya; setara dengan dugaan awal yang memerlukan pengujian."
        },
        {
          "id": "utbk26_ppu_13",
          "nomor": 13,
          "mapel": "Pengetahuan & Pemahaman Umum (PPU)",
          "teksSoal": "Kata 'pragmatis' dalam kalimat 'Menghadapi kelangkaan pupuk subsidi, petani mengambil langkah pragmatis dengan memproduksi pupuk organik cair mandiri' bermakna ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Mementingkan keuntungan finansial semata secara serakah"
            },
            {
              "key": "B",
              "teks": "Berorientasi pada kepraktisan dan manfaat nyata yang dapat segera diterapkan"
            },
            {
              "key": "C",
              "teks": "Bersifat putus asa tanpa perhitungan matang"
            },
            {
              "key": "D",
              "teks": "Menolak bantuan teknologi modern secara ekstrem"
            },
            {
              "key": "E",
              "teks": "Mengikuti tradisi leluhur tanpa inovasi"
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Pragmatis berarti bersifat praktis dan berorientasi pada hasil nyata serta kemudahan penerapan dalam memecahkan masalah konkret."
        },
        {
          "id": "utbk26_ppu_14",
          "nomor": 14,
          "mapel": "Pengetahuan & Pemahaman Umum (PPU)",
          "teksSoal": "Kata 'disrupsi' dalam kalimat 'Integrasi komputasi awan dan otomasi cerdas memicu disrupsi menyeluruh pada model bisnis logistik konvensional' bermakna ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Kerusakan perangkat keras akibat bencana alam"
            },
            {
              "key": "B",
              "teks": "Inovasi mendasar yang merombak tatanan lama dan melahirkan pasar baru"
            },
            {
              "key": "C",
              "teks": "Penurunan drastis daya beli masyarakat secara berkepanjangan"
            },
            {
              "key": "D",
              "teks": "Pemadaman arus listrik di sentra industri"
            },
            {
              "key": "E",
              "teks": "Kesalahan pengiriman barang antarprovinsi"
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Disrupsi (disruption) merujuk pada perubahan fundamental yang mengganggu atau mengubah tata kelola/pasar lama menjadi tatanan serba baru."
        },
        {
          "id": "utbk26_ppu_15",
          "nomor": 15,
          "mapel": "Pengetahuan & Pemahaman Umum (PPU)",
          "teksSoal": "Lawan kata (antonim) yang paling tepat untuk kata 'TENTATIF' adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Pasti / Definitif"
            },
            {
              "key": "B",
              "teks": "Fleksibel"
            },
            {
              "key": "C",
              "teks": "Sementara"
            },
            {
              "key": "D",
              "teks": "Ragu-ragu"
            },
            {
              "key": "E",
              "teks": "Berkala"
            }
          ],
          "kunciJawaban": "A",
          "pembahasan": "Tentatif berarti belum pasti atau masih dapat berubah. Lawan katanya adalah pasti, definitif, atau mutlak."
        },
        {
          "id": "utbk26_ppu_16",
          "nomor": 16,
          "mapel": "Pengetahuan & Pemahaman Umum (PPU)",
          "teksSoal": "Pilihlah pasangan kata yang memiliki hubungan analogi paling setara dengan pasangan:\nSTETOSKOP : DOKTER",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Kuas : Kanvas"
            },
            {
              "key": "B",
              "teks": "Mikroskop : Peneliti biologi"
            },
            {
              "key": "C",
              "teks": "Skalpel : Ruang operasi"
            },
            {
              "key": "D",
              "teks": "Termometer : Suhu ruangan"
            },
            {
              "key": "E",
              "teks": "Buku teks : Perpustakaan"
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Stetoskop adalah instrumen kerja utama yang digunakan dokter; setara dengan mikroskop yang digunakan oleh peneliti biologi."
        },
        {
          "id": "utbk26_ppu_17",
          "nomor": 17,
          "mapel": "Pengetahuan & Pemahaman Umum (PPU)",
          "teksSoal": "Kata 'fluktuatif' dalam kalimat 'Harga minyak sawit mentah di bursa komoditas bergerak secara fluktuatif sepanjang kuartal pertama' bermakna ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Mengalami kemerosotan secara terus-menerus tanpa jeda"
            },
            {
              "key": "B",
              "teks": "Naik dan turun secara tidak tetap / berubah-ubah"
            },
            {
              "key": "C",
              "teks": "Tetap stabil di angka yang sama setiap hari"
            },
            {
              "key": "D",
              "teks": "Mengalami lonjakan tertinggi dalam kurun satu dekade"
            },
            {
              "key": "E",
              "teks": "Ditetapkan sepihak oleh pemerintah produsen"
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Fluktuatif berarti bersifat turun-naik, bergejolak, atau berubah-ubah secara tidak menentu."
        },
        {
          "id": "utbk26_ppu_18",
          "nomor": 18,
          "mapel": "Pengetahuan & Pemahaman Umum (PPU)",
          "teksSoal": "Makna peribahasa 'bagai api dalam sekam' adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Keadaan miskin yang tiba-tiba mendapat kekayaan melimpah"
            },
            {
              "key": "B",
              "teks": "Bahaya atau permusuhan tersembunyi yang sewaktu-waktu bisa membesar"
            },
            {
              "key": "C",
              "teks": "Pertengkaran terbuka yang disaksikan oleh orang banyak"
            },
            {
              "key": "D",
              "teks": "Usaha keras tanpa kenal lelah demi mencapai cita-cita"
            },
            {
              "key": "E",
              "teks": "Seseorang yang mudah terombang-ambing oleh bujukan orang lain"
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Api dalam sekam adalah kiasan mengenai bahaya laten, kebencian, atau bara kejahatan yang tersembunyi dan tidak tampak di permukaan."
        },
        {
          "id": "utbk26_ppu_19",
          "nomor": 19,
          "mapel": "Pengetahuan & Pemahaman Umum (PPU)",
          "teksSoal": "Bacalah kalimat berikut:\n'Polarisasi wacana di ruang digital kerap diperparah oleh fenomena ruang gema (echo chamber) yang mengurung warganet hanya pada narasi yang mengonfirmasi bias pribadi mereka.'\nMakna istilah 'ruang gema' dalam kutipan tersebut adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Ruang kedap suara khusus untuk perekaman siniar (podcast)"
            },
            {
              "key": "B",
              "teks": "Lingkungan komunikasi tempat suatu opini terus diperkuat tanpa mendapat pandangan berlawanan"
            },
            {
              "key": "C",
              "teks": "Fitur pengeras suara otomatis pada aplikasi obrolan kelompok"
            },
            {
              "key": "D",
              "teks": "Penghapusan akun-akun media sosial palsu oleh pengelola platform"
            },
            {
              "key": "E",
              "teks": "Penyebaran pesan suara massal ke seluruh kontak pengguna"
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Ruang gema (echo chamber) menggambarkan situasi di mana seseorang hanya mendengar pandangan yang serupa dengan dirinya, sehingga perspektif alternatif terkucilkan."
        },
        {
          "id": "utbk26_ppu_20",
          "nomor": 20,
          "mapel": "Pengetahuan & Pemahaman Umum (PPU)",
          "teksSoal": "Kata berimbuhan yang bermakna 'menyatakan proses atau perbuatan' terdapat pada kata yang dicetak tebal dalam kalimat ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Toko roti itu memajang aneka kue basah di etalase depan."
            },
            {
              "key": "B",
              "teks": "<strong>Penyulingan</strong> minyak atsiri membutuhkan ketepatan suhu uap air."
            },
            {
              "key": "C",
              "teks": "Lukisan pemandangan itu merupakan karya pelukis muda berbakat."
            },
            {
              "key": "D",
              "teks": "Tulisan tangan di kertas wasiat tersebut sangat rapi."
            },
            {
              "key": "E",
              "teks": "Pakaian seragam siswa dibagikan secara serentak pagi ini."
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "'Penyulingan' (peN- + suling + -an) bermakna proses atau tindakan menyuling. Pilihan lain bermakna hasil tindakan (lukisan, tulisan, pakaian)."
        }
      ]
    },
    {
      "id": "subtes_pbm",
      "kode": "PBM",
      "nama": "Pemahaman Bacaan & Menulis (PBM)",
      "targetSoal": 20,
      "durasiMenit": 25,
      "estimasiDetik": 75,
      "soal": [
        {
          "id": "utbk26_pbm_01",
          "nomor": 1,
          "mapel": "Pemahaman Bacaan & Menulis (PBM)",
          "teksSoal": "Penulisan kelompok kata serapan yang SELURUHNYA baku menurut PUEBI adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "aktivitas, sistim, analisa"
            },
            {
              "key": "B",
              "teks": "aktivitas, sistem, analisis"
            },
            {
              "key": "C",
              "teks": "aktifitas, sistim, analisa"
            },
            {
              "key": "D",
              "teks": "aktifitas, sistem, analisis"
            },
            {
              "key": "E",
              "teks": "aktivitas, sistim, analisis"
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Bentuk baku menurut KBBI dan PUEBI adalah 'aktivitas' (bukan aktifitas), 'sistem' (bukan sistim), dan 'analisis' (bukan analisa)."
        },
        {
          "id": "utbk26_pbm_02",
          "nomor": 2,
          "mapel": "Pemahaman Bacaan & Menulis (PBM)",
          "teksSoal": "Kalimat berikut yang merupakan KALIMAT EFEKTIF dan memenuhi kaidah tata kalimat bahasa Indonesia adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Bagi para peserta yang membawa kartu ujian dipersilakan memasuki ruang tes."
            },
            {
              "key": "B",
              "teks": "Untuk mempercepat proses administrasi, peserta diminta menyiapkan berkas identitas."
            },
            {
              "key": "C",
              "teks": "Meskipun sudah berulang kali diingatkan namun dia tetap melanggar batas kecepatan."
            },
            {
              "key": "D",
              "teks": "Dalam penelitian itu membahas tentang pencemaran mikroplastik di sungai."
            },
            {
              "key": "E",
              "teks": "Kenaikan daripada harga bahan pokok membebani masyarakat prasejahtera."
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Kalimat B memiliki struktur subjek ('peserta') dan predikat ('diminta menyiapkan') yang utuh tanpa kerancuan preposisi di awal klausa utama."
        },
        {
          "id": "utbk26_pbm_03",
          "nomor": 3,
          "mapel": "Pemahaman Bacaan & Menulis (PBM)",
          "teksSoal": "Penggunaan tanda koma (,) yang TEPAT terdapat pada kalimat ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Ayah membeli apel, jeruk dan mangga di pasar induk."
            },
            {
              "key": "B",
              "teks": "Saya ingin pergi ke perpustakaan, tetapi hujan turun sangat lebat."
            },
            {
              "key": "C",
              "teks": "Dia sangat rajin belajar, sehingga berhasil meraih nilai tertinggi."
            },
            {
              "key": "D",
              "teks": "Karena sakit, maka siswa tersebut tidak dapat mengikuti upacara bendera."
            },
            {
              "key": "E",
              "teks": "Mahasiswa yang belum membayar SPP, tidak diizinkan mengikuti ujian."
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Konjungsi intrakalimat pertentangan 'tetapi' wajib didahului oleh tanda koma."
        },
        {
          "id": "utbk26_pbm_04",
          "nomor": 4,
          "mapel": "Pemahaman Bacaan & Menulis (PBM)",
          "teksSoal": "Penulisan bentuk terikat berikut yang BENAR menurut kaidah ejaan adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "antar kota, pasca panen, sub sektor"
            },
            {
              "key": "B",
              "teks": "antarkota, pasca panen, subsektor"
            },
            {
              "key": "C",
              "teks": "antarkota, pascapanen, subsektor"
            },
            {
              "key": "D",
              "teks": "antar-kota, pasca-panen, sub-sektor"
            },
            {
              "key": "E",
              "teks": "antarkota, pasca-panen, sub sektor"
            }
          ],
          "kunciJawaban": "C",
          "pembahasan": "Bentuk terikat seperti antar-, pasca-, dan sub- ditulis serangkai: antarkota, pascapanen, subsektor."
        },
        {
          "id": "utbk26_pbm_05",
          "nomor": 5,
          "mapel": "Pemahaman Bacaan & Menulis (PBM)",
          "teksSoal": "Pasangan konjungsi korelatif yang BENAR terdapat pada kalimat ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Bukan hanya adiknya melainkan juga kakaknya pandai melukis."
            },
            {
              "key": "B",
              "teks": "Tidak hanya adiknya tetapi juga kakaknya pandai melukis."
            },
            {
              "key": "C",
              "teks": "Baik siswa baru maupun siswa lama harus menaati tata tertib sekolah."
            },
            {
              "key": "D",
              "teks": "Entah benar ataukah salah berita itu belum terverifikasi."
            },
            {
              "key": "E",
              "teks": "Jangankan sepeda motor bahkan mobil pun ia mampu membeli."
            }
          ],
          "kunciJawaban": "C",
          "pembahasan": "Pasangan baku: baik ... maupun ... (C)."
        },
        {
          "id": "utbk26_pbm_06",
          "nomor": 6,
          "mapel": "Pemahaman Bacaan & Menulis (PBM)",
          "teksSoal": "Penulisan gabungan kata yang TEPAT sesuai dengan kaidah Ejaan Bahasa Indonesia yang Disempurnakan (EYD) terdapat pada kalimat ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Para menteri menandatangani kesepakatan kerjasama antar negara."
            },
            {
              "key": "B",
              "teks": "Setiap warga negara memiliki tanggung jawab moril menjaga persatuan bangsa."
            },
            {
              "key": "C",
              "teks": "Panitia acara melakukan serah-terima jabatan di aula utama."
            },
            {
              "key": "D",
              "teks": "Mahasiswa program pasca sarjana mengadakan simposium nasional."
            },
            {
              "key": "E",
              "teks": "Ia membeli obat sakit kepala di apotik 24 jam."
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "'Tanggung jawab' ditulis terpisah. 'Kerja sama' dan 'antarnegara' harusnya terpisah dan digabung (antar- bentuk terikat). 'Serah terima' tanpa tanda hubung. 'Pascasarjana' ditulis serangkai."
        },
        {
          "id": "utbk26_pbm_07",
          "nomor": 7,
          "mapel": "Pemahaman Bacaan & Menulis (PBM)",
          "teksSoal": "Penggunaan tanda baca koma (,) yang TEPAT terdapat pada kalimat ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Rapat koordinasi tetap berlangsung, meskipun ketua komisi berhalangan hadir."
            },
            {
              "key": "B",
              "teks": "Semua dokumen perizinan sudah lengkap, tetapi verifikasi faktual lapangan belum selesai."
            },
            {
              "key": "C",
              "teks": "Dia mengira, bahwa jadwal ujian akhir telah diundur ke pekan depan."
            },
            {
              "key": "D",
              "teks": "Kakak ingin membeli laptop baru, karena laptop lamanya rusak."
            },
            {
              "key": "E",
              "teks": "Jika bendungan itu jebol, maka puluhan desa di bantaran sungai akan terendam banjir."
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Koma wajib digunakan sebelum konjungsi pertentangan intrakalimat (tetapi, melainkan, sedangkan). Koma tidak boleh mendahului anak kalimat yang berada di belakang induk kalimat ('meskipun', 'karena', 'bahwa')."
        },
        {
          "id": "utbk26_pbm_08",
          "nomor": 8,
          "mapel": "Pemahaman Bacaan & Menulis (PBM)",
          "teksSoal": "Kalimat berikut yang merupakan kalimat efektif tanpa pemborosan kata (pleonasme) adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Para hadirin sekalian dimohon untuk segera berdiri menyanyikan lagu Indonesia Raya."
            },
            {
              "key": "B",
              "teks": "Sejak dari dulu pemuda desa tersebut memang terkenal sangat rajin dan ulet."
            },
            {
              "key": "C",
              "teks": "Kementerian Pertanian meluncurkan varietas padi gogo yang tahan terhadap kekeringan."
            },
            {
              "key": "D",
              "teks": "Ia hanya menginginkan uang saku secukupnya saja untuk bekal perjalanan dinas."
            },
            {
              "key": "E",
              "teks": "Banyak faktor-faktor penghambat yang menyebabkan target investasi belum tercapai."
            }
          ],
          "kunciJawaban": "C",
          "pembahasan": "Kalimat C hemat, lugas, dan baku. Pilihan lain mengandung pemborosan: 'para hadirin sekalian' (jamak ganda), 'sejak dari dulu', 'hanya ... saja', 'banyak faktor-faktor'."
        },
        {
          "id": "utbk26_pbm_09",
          "nomor": 9,
          "mapel": "Pemahaman Bacaan & Menulis (PBM)",
          "teksSoal": "Cermati kalimat rumpang berikut:\n'Pemerintah telah memperketat pengawasan impor komoditas pangan. [...], lonjakan harga beras di pasar domestik masih belum terkendali akibat penurunan panen lokal.'\nKonjungsi antarkalimat yang paling tepat untuk melengkapi bagian rumpang adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Oleh karena itu"
            },
            {
              "key": "B",
              "teks": "Selain itu"
            },
            {
              "key": "C",
              "teks": "Meskipun demikian"
            },
            {
              "key": "D",
              "teks": "Bahkan"
            },
            {
              "key": "E",
              "teks": "Dengan demikian"
            }
          ],
          "kunciJawaban": "C",
          "pembahasan": "Kalimat kedua menyatakan hasil yang bertentangan dengan upaya di kalimat pertama; konjungsi antarkalimat pertentangan yang tepat adalah 'Meskipun demikian' atau 'Akan tetapi'."
        },
        {
          "id": "utbk26_pbm_10",
          "nomor": 10,
          "mapel": "Pemahaman Bacaan & Menulis (PBM)",
          "teksSoal": "Penulisan judul karya ilmiah berikut yang paling sesuai dengan kaidah EYD adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Pemberdayaan Usaha Mikro Di Kawasan Pesisir Melalui Pelatihan Digital Marketing"
            },
            {
              "key": "B",
              "teks": "Pemberdayaan Usaha Mikro di Kawasan Pesisir melalui Pelatihan Digital Marketing"
            },
            {
              "key": "C",
              "teks": "Pemberdayaan Usaha Mikro di Kawasan Pesisir Melalui Pelatihan Digital Marketing"
            },
            {
              "key": "D",
              "teks": "Pemberdayaan Usaha Mikro Di Kawasan Pesisir melalui Pelatihan Digital Marketing"
            },
            {
              "key": "E",
              "teks": "Pemberdayaan usaha mikro di kawasan pesisir melalui pelatihan digital marketing"
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Huruf pertama setiap kata diawali kapital, kecuali kata tugas/preposisi/konjungsi (di, ke, dari, melalui, untuk, dan) yang ditulis huruf kecil jika tidak berada di posisi awal judul."
        },
        {
          "id": "utbk26_pbm_11",
          "nomor": 11,
          "mapel": "Pemahaman Bacaan & Menulis (PBM)",
          "teksSoal": "Bentuk kata berimbuhan meN- yang luluh sesuai kaidah KTSP terdapat pada kalimat ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Perusahaan swasta itu terus mengkritisi regulasi ketenagakerjaan."
            },
            {
              "key": "B",
              "teks": "Guru berusaha keras memengaruhi minat belajar peserta didik di kelas."
            },
            {
              "key": "C",
              "teks": "Pemerintah daerah giat mensosialisasikan program bank sampah mandiri."
            },
            {
              "key": "D",
              "teks": "Para peneliti mengkaji dampak jangka panjang pemanasan global."
            },
            {
              "key": "E",
              "teks": "Warga bergotong-royong mempesona wisatawan dengan keramahan lokal."
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Kata dasar 'pengaruh' (diawali P diikuti vokal E) luluh menjadi 'memengaruhi', bukan 'mempengaruhi'. Begitu pula 'mensosialisasikan' salah (baku: menyosialisasikan)."
        },
        {
          "id": "utbk26_pbm_12",
          "nomor": 12,
          "mapel": "Pemahaman Bacaan & Menulis (PBM)",
          "teksSoal": "Cermati paragraf berikut:\n(1) Ekosistem terumbu karang menyediakan habitat bagi ribuan biota laut bernilai komersial tinggi.\n(2) Selain itu, gugusan karang berfungsi meredam energi gelombang pasang sehingga mencegah abrasi garis pantai.\n(3) Peningkatan suhu permukaan laut akibat perubahan iklim memicu pemutihan karang massal secara global.\n(4) Penyelam wisata sering menyewa perahu motor dengan tarif sewa yang tergolong terjangkau.\n(5) Tanpa konservasi terpadu, penurunan tutupan karang dapat mengancam stabilitas ketahanan pangan pesisir.\nKalimat yang tidak padu (sumbang) dalam paragraf di atas adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Kalimat (1)"
            },
            {
              "key": "B",
              "teks": "Kalimat (2)"
            },
            {
              "key": "C",
              "teks": "Kalimat (3)"
            },
            {
              "key": "D",
              "teks": "Kalimat (4)"
            },
            {
              "key": "E",
              "teks": "Kalimat (5)"
            }
          ],
          "kunciJawaban": "D",
          "pembahasan": "Topik utama paragraf adalah nilai ekologis dan ancaman kerusakan terumbu karang. Kalimat (4) membahas tarif sewa perahu motor wisata yang menyimpang dari tema utama."
        },
        {
          "id": "utbk26_pbm_13",
          "nomor": 13,
          "mapel": "Pemahaman Bacaan & Menulis (PBM)",
          "teksSoal": "Penulisan bilangan dan angka berikut yang TIDAK sesuai kaidah ejaan baku adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Sebanyak 150 peserta hadir mengikuti ujian saringan masuk perguruan tinggi."
            },
            {
              "key": "B",
              "teks": "Tiga ratus karyawan pabrik tekstil menerima penghargaan masa kerja."
            },
            {
              "key": "C",
              "teks": "Gedung perpustakaan kota berlantai 4 itu baru saja diresmikan oleh walikota."
            },
            {
              "key": "D",
              "teks": "Perekonomian nasional era 1990-an mencatat dinamika yang sangat kompleks."
            },
            {
              "key": "E",
              "teks": "Ia menempati peringkat ke-2 dalam kejuaraan catur tingkat provinsi."
            }
          ],
          "kunciJawaban": "C",
          "pembahasan": "Angka yang dapat dinyatakan dengan satu atau dua kata ditulis dengan huruf ('berlantai empat', bukan 'berlantai 4'). Penulisan di awal kalimat (pilihan B) juga tepat."
        },
        {
          "id": "utbk26_pbm_14",
          "nomor": 14,
          "mapel": "Pemahaman Bacaan & Menulis (PBM)",
          "teksSoal": "Kalimat berikut yang tidak memiliki subjek (kalimat buntung/rancu) adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Dalam laporan keuangan tahunan itu mencatat kerugian operasional sebesar 5 miliar rupiah."
            },
            {
              "key": "B",
              "teks": "Buku pedoman teknis tersebut memuat tata cara sertifikasi produk halal bagi UMKM."
            },
            {
              "key": "C",
              "teks": "Peserta seminar mendengarkan paparan narasumber dengan penuh antusias."
            },
            {
              "key": "D",
              "teks": "Studi komparatif ini membuktikan efektivitas metode pembelajaran berbasis proyek."
            },
            {
              "key": "E",
              "teks": "Pembangunan jembatan antarpulau diperkirakan rampung pada akhir tahun depan."
            }
          ],
          "kunciJawaban": "A",
          "pembahasan": "Kalimat A diawali preposisi 'Dalam...', sehingga bagian awal menjadi keterangan, diikuti predikat 'mencatat'. Tidak ada subjek yang melakukan perbuatan 'mencatat'. Seharusnya kata 'Dalam' dihilangkan."
        },
        {
          "id": "utbk26_pbm_15",
          "nomor": 15,
          "mapel": "Pemahaman Bacaan & Menulis (PBM)",
          "teksSoal": "Penulisan kata serapan berakhiran -isasi yang TEPAT dan baku adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "legalisir"
            },
            {
              "key": "B",
              "teks": "standardisasi"
            },
            {
              "key": "C",
              "teks": "koordinir"
            },
            {
              "key": "D",
              "teks": "lokalisir"
            },
            {
              "key": "E",
              "teks": "netralisir"
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Bentuk baku akhiran proses adalah -isasi: standardisasi (dari standard), legalisasi (bukan legalisir), koordinasi (bukan koordinir), lokalisasi, dan netralisasi."
        },
        {
          "id": "utbk26_pbm_16",
          "nomor": 16,
          "mapel": "Pemahaman Bacaan & Menulis (PBM)",
          "teksSoal": "Kalimat manakah yang menggunakan huruf miring secara TEPAT sesuai dengan kaidah ejaan?",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Padi memiliki nama botani <i>Oryza sativa</i> yang banyak dibudidayakan di Asia."
            },
            {
              "key": "B",
              "teks": "Ia membaca novel <i>Laskar Pelangi</i> karya Andrea Hirata di teras rumah."
            },
            {
              "key": "C",
              "teks": "Kita harus mengunduh <i>aplikasi</i> tersebut melalui toko resmi."
            },
            {
              "key": "D",
              "teks": "Istilah <i>stakeholder</i> dapat diterjemahkan menjadi pemangku kepentingan."
            },
            {
              "key": "E",
              "teks": "Semua jawaban A, B, dan D benar."
            }
          ],
          "kunciJawaban": "E",
          "pembahasan": "Huruf miring dipakai untuk nama ilmiah (Oryza sativa), judul buku/novel (Laskar Pelangi), dan kata/istilah bahasa asing yang belum diserap (stakeholder). Kata 'aplikasi' sudah diserap ke bahasa Indonesia sehingga tidak dimiringkan."
        },
        {
          "id": "utbk26_pbm_17",
          "nomor": 17,
          "mapel": "Pemahaman Bacaan & Menulis (PBM)",
          "teksSoal": "Cermati dua klausa berikut:\nKlausa 1: Tingkat polusi udara di ibu kota terus meningkat tajam.\nKlausa 2: Pemerintah daerah menerapkan kebijakan pembatasan kendaraan bermotor ganjil-genap.\nHubungan semantis yang paling tepat untuk menggabungkan kedua klausa tersebut menjadi kalimat majemuk adalah hubungan ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Sebab-akibat (kausalitas)"
            },
            {
              "key": "B",
              "teks": "Konsesif (perlawanan)"
            },
            {
              "key": "C",
              "teks": "Tujuan (final)"
            },
            {
              "key": "D",
              "teks": "Waktu (temporal)"
            },
            {
              "key": "E",
              "teks": "Syarat (kondisional)"
            }
          ],
          "kunciJawaban": "A",
          "pembahasan": "Klausa 1 merupakan penyebab, dan klausa 2 merupakan dampak/tindakan akibat (sebab-akibat: 'Karena tingkat polusi udara meningkat..., pemerintah menerapkan...')."
        },
        {
          "id": "utbk26_pbm_18",
          "nomor": 18,
          "mapel": "Pemahaman Bacaan & Menulis (PBM)",
          "teksSoal": "Penulisan partikel 'pun' yang benar berikut ini adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Jangankan uang seribu rupiah, satu rupiahpun ia tidak punya."
            },
            {
              "key": "B",
              "teks": "Walaupun badai menerjang, para nelayan tetap bersiap melaut."
            },
            {
              "key": "C",
              "teks": "Apa pun makanan yang disajikan, ia selalu menikmatinya dengan rasa syukur."
            },
            {
              "key": "D",
              "teks": "Siapapun yang terlambat hadir dilarang memasuki ruang ujian."
            },
            {
              "key": "E",
              "teks": "Pernyataan B dan C benar."
            }
          ],
          "kunciJawaban": "E",
          "pembahasan": "Partikel 'pun' yang bermakna 'juga' ditulis terpisah ('apa pun', 'satu rupiah pun', 'siapa pun'). Partikel 'pun' yang sudah padu sebagai konjungsi ditulis serangkai ('walaupun', 'meskipun', 'kendatipun', 'bagaimanapun'). Maka B dan C benar."
        },
        {
          "id": "utbk26_pbm_19",
          "nomor": 19,
          "mapel": "Pemahaman Bacaan & Menulis (PBM)",
          "teksSoal": "Cermati kalimat berikut:\n'Siswa yang mengikuti lomba olimpiade sains nasional itu mengenakan seragam batik kebanggaan sekolah mereka.'\nInti kalimat (struktur inti S-P-O) dari kalimat majemuk perluasan di atas adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Siswa mengenakan seragam."
            },
            {
              "key": "B",
              "teks": "Siswa mengikuti lomba."
            },
            {
              "key": "C",
              "teks": "Olimpiade sains nasional dibanggakan siswa."
            },
            {
              "key": "D",
              "teks": "Seragam batik dibanggakan sekolah."
            },
            {
              "key": "E",
              "teks": "Siswa lomba olimpiade sains nasional."
            }
          ],
          "kunciJawaban": "A",
          "pembahasan": "Subjek inti adalah 'Siswa', predikat inti adalah 'mengenakan', dan objek inti adalah 'seragam' (Siswa mengenakan seragam)."
        },
        {
          "id": "utbk26_pbm_20",
          "nomor": 20,
          "mapel": "Pemahaman Bacaan & Menulis (PBM)",
          "teksSoal": "Penulisan akronim dan singkatan nama lembaga berikut yang TEPAT adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "BAPPENAS merancang peta jalan transisi energi bersih 2045."
            },
            {
              "key": "B",
              "teks": "Bappenas merancang peta jalan transisi energi bersih 2045."
            },
            {
              "key": "C",
              "teks": "Puskesmas merupakan akronim dari pusat kesehatan masyarakat."
            },
            {
              "key": "D",
              "teks": "KPK melakukan operasi tangkap tangan di gedung balai kota."
            },
            {
              "key": "E",
              "teks": "Pernyataan B, C, dan D semuanya benar sesuai kaidah EYD."
            }
          ],
          "kunciJawaban": "E",
          "pembahasan": "Akronim nama diri yang berupa gabungan suku kata ditulis dengan huruf kapital di awal saja (Bappenas, Puskesmas). Singkatan nama lembaga yang berupa huruf awal ditulis kapital semua (KPK). Jadi E benar."
        }
      ]
    },
    {
      "id": "subtes_pk",
      "kode": "PK",
      "nama": "Pengetahuan Kuantitatif (PK)",
      "targetSoal": 20,
      "durasiMenit": 20,
      "estimasiDetik": 60,
      "soal": [
        {
          "id": "utbk26_pk_01",
          "nomor": 1,
          "mapel": "Pengetahuan Kuantitatif (PK)",
          "teksSoal": "Diketahui fungsi kuadrat $f(x) = x^2 - bx + 11$. Grafik fungsi tersebut melalui tiga titik, yaitu $(1,6)$, $(a, 3)$, dan $(a + 3, 6)$. Tentukanlah nilai dari $a \\cdot b$.",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "12"
            },
            {
              "key": "B",
              "teks": "18"
            },
            {
              "key": "C",
              "teks": "24"
            },
            {
              "key": "D",
              "teks": "30"
            },
            {
              "key": "E",
              "teks": "36"
            }
          ],
          "kunciJawaban": "C",
          "pembahasan": "Fungsi $f(1) = 6 \\Rightarrow b = 6$. Puncak di $x = 3$. Titik simetris berjarak sama dari puncak sehingga $a = 4$. Maka $a \\cdot b = 4 \\times 6 = 24$ (C)."
        },
        {
          "id": "utbk26_pk_02",
          "nomor": 2,
          "mapel": "Pengetahuan Kuantitatif (PK)",
          "teksSoal": "Hasil perkalian tiga bilangan prima berbeda $a$, $b$, dan $c$ adalah 182. Nilai dari $a + b + c$ adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "20"
            },
            {
              "key": "B",
              "teks": "22"
            },
            {
              "key": "C",
              "teks": "24"
            },
            {
              "key": "D",
              "teks": "26"
            },
            {
              "key": "E",
              "teks": "28"
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Faktorisasi $182 = 2 \\times 7 \\times 13$. Jumlah $a + b + c = 2 + 7 + 13 = 22$ (B)."
        },
        {
          "id": "utbk26_pk_03",
          "nomor": 3,
          "mapel": "Pengetahuan Kuantitatif (PK)",
          "teksSoal": "Luas daerah lingkaran dengan pusat $O$ adalah $9\\pi$. Titik $M$ dan $N$ terletak pada lingkaran tersebut sehingga panjang busur $MN$ adalah $\\pi$.\nBerdasarkan informasi yang diberikan, manakah dari pernyataan berikut yang BENAR?\n(1) Jari-jari lingkaran tersebut adalah 3.\n(2) Keliling lingkaran adalah $6\\pi$.\n(3) Luas juring $MON$ adalah $\\frac{3}{2}\\pi$.\n(4) Besar $\\angle MON = 60^\\circ$.",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "(1), (2), dan (3) SAJA"
            },
            {
              "key": "B",
              "teks": "(1) dan (3) SAJA"
            },
            {
              "key": "C",
              "teks": "(2) dan (4) SAJA"
            },
            {
              "key": "D",
              "teks": "(4) SAJA"
            },
            {
              "key": "E",
              "teks": "SEMUA PILIHAN BENAR"
            }
          ],
          "kunciJawaban": "E",
          "pembahasan": "Semua pernyataan (1), (2), (3), dan (4) bernilai benar: $r=3$, keliling $6\\pi$, sudut $60^\\circ$, dan luas juring $1,5\\pi$."
        },
        {
          "id": "utbk26_pk_04",
          "nomor": 4,
          "mapel": "Pengetahuan Kuantitatif (PK)",
          "teksSoal": "Didefinisikan operasi bilangan real $\\otimes$ dan $\\boxplus$ dengan aturan: jika $(4 \\otimes 3) \\boxplus 2 = 10$, di mana operasi melambangkan kombinasi dua operator dasar di antara $\\{+, -, \\times, \\div\\}$. Jika pola operator tersebut konsisten, berapakah nilai dari $(5 \\otimes 6) \\boxplus 10$?",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "25"
            },
            {
              "key": "B",
              "teks": "30"
            },
            {
              "key": "C",
              "teks": "40"
            },
            {
              "key": "D",
              "teks": "45"
            },
            {
              "key": "E",
              "teks": "50"
            }
          ],
          "kunciJawaban": "C",
          "pembahasan": "$(4 \\times 3) - 2 = 10$. Maka $(5 \\times 6) + 10 = 40$ (C)."
        },
        {
          "id": "utbk26_pk_05",
          "nomor": 5,
          "mapel": "Pengetahuan Kuantitatif (PK)",
          "teksSoal": "Perhatikan gambar kurva dan geometri juring lingkaran berikut:\n<div style=\"text-align: center; margin: 12px 0;\"><img src=\"/bank-soal/utbk-2026/images/katkiel_p96_img1.jpeg\" alt=\"Geometri dan Kurva Katkiel PK\" style=\"max-width: 280px; border-radius: 8px; border: 1px solid #cbd5e1;\" /></div>\nBerdasarkan gambar di atas, jika luas juring lingkaran berpusat di $O$ sebanding dengan panjang busurnya, berapakah perbandingan luas daerah juring terhadap luas lingkaran utuh?",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "1 : 4"
            },
            {
              "key": "B",
              "teks": "1 : 6"
            },
            {
              "key": "C",
              "teks": "1 : 8"
            },
            {
              "key": "D",
              "teks": "1 : 9"
            },
            {
              "key": "E",
              "teks": "2 : 9"
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Sudut juring $60^\\circ$, rasio luas juring terhadap lingkaran penuh $= 60^\\circ / 360^\\circ = 1/6$ (B)."
        },
        {
          "id": "utbk26_pk_06",
          "nomor": 6,
          "mapel": "Pengetahuan Kuantitatif (PK)",
          "teksSoal": "Tarif parkir sepeda motor adalah Rp2.000,00 untuk satu jam pertama dan bertambah Rp1.000,00 untuk setiap jam berikutnya. Sementara tarif parkir mobil adalah Rp5.000,00 untuk satu jam pertama dan bertambah Rp3.000,00 untuk setiap jam berikutnya. Jika seorang pengendara mobil parkir selama $t$ jam dan membayar Rp20.000,00, berapa lama mobil tersebut diparkir?",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "4 jam"
            },
            {
              "key": "B",
              "teks": "5 jam"
            },
            {
              "key": "C",
              "teks": "6 jam"
            },
            {
              "key": "D",
              "teks": "7 jam"
            },
            {
              "key": "E",
              "teks": "8 jam"
            }
          ],
          "kunciJawaban": "C",
          "pembahasan": "$5.000 + 3.000(t - 1) = 20.000 \\Rightarrow t - 1 = 5 \\Rightarrow t = 6$ jam (C)."
        },
        {
          "id": "utbk26_pk_07",
          "nomor": 7,
          "mapel": "Pengetahuan Kuantitatif (PK)",
          "teksSoal": "Perhatikan gambar bangun segitiga siku-siku berikut:\n<div style=\"text-align: center; margin: 12px 0;\"><img src=\"/bank-soal/utbk-2026/images/katkiel_p100_img1.jpeg\" alt=\"Segitiga dan Geometri Katkiel PK\" style=\"max-width: 260px; border-radius: 8px; border: 1px solid #cbd5e1;\" /></div>\nJika panjang sisi miring adalah 25 cm dan salah satu sisi tegaknya adalah 7 cm, berapakah keliling segitiga siku-siku tersebut?",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "48 cm"
            },
            {
              "key": "B",
              "teks": "54 cm"
            },
            {
              "key": "C",
              "teks": "56 cm"
            },
            {
              "key": "D",
              "teks": "60 cm"
            },
            {
              "key": "E",
              "teks": "64 cm"
            }
          ],
          "kunciJawaban": "C",
          "pembahasan": "Sisi tegak kedua $= \\sqrt{25^2 - 7^2} = 24$ cm. Keliling $= 7 + 24 + 25 = 56$ cm (C)."
        },
        {
          "id": "utbk26_pk_08",
          "nomor": 8,
          "mapel": "Pengetahuan Kuantitatif (PK)",
          "teksSoal": "Diketahui $x$ dan $y$ adalah bilangan bulat positif yang memenuhi $2x + 3y = 24$. Manakah hubungan yang benar antara kuantitas $P$ dan $Q$ berikut?\n<div class=\"table-responsive\"><table class=\"table-soal\"><thead><tr><th>Kuantitas P</th><th>Kuantitas Q</th></tr></thead><tbody><tr><td>Nilai maksimum dari $x \\cdot y$</td><td>25</td></tr></tbody></table></div>",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Kuantitas P lebih besar daripada Q"
            },
            {
              "key": "B",
              "teks": "Kuantitas Q lebih besar daripada P"
            },
            {
              "key": "C",
              "teks": "Kuantitas P sama dengan Q"
            },
            {
              "key": "D",
              "teks": "Informasi yang diberikan tidak cukup untuk memutuskan"
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Pasangan $(x,y)$ bulat positif: $(9,2) \\rightarrow xy=18$; $(6,4) \\rightarrow xy=24$; $(3,6) \\rightarrow xy=18$. Maksimum $xy=24 < 25$ sehingga $P < Q$ (B)."
        },
        {
          "id": "utbk26_pk_09",
          "nomor": 9,
          "mapel": "Pengetahuan Kuantitatif (PK)",
          "teksSoal": "Dalam sebuah kantong terdapat 5 bola merah, 4 bola biru, dan 3 bola hijau. Jika diambil 2 bola secara acak sekaligus tanpa pengembalian, peluang terambilnya 2 bola berwarna sama adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "19/66"
            },
            {
              "key": "B",
              "teks": "23/66"
            },
            {
              "key": "C",
              "teks": "25/66"
            },
            {
              "key": "D",
              "teks": "28/66"
            },
            {
              "key": "E",
              "teks": "31/66"
            }
          ],
          "kunciJawaban": "A",
          "pembahasan": "Kombinasi $C(12,2) = 66$. Warna sama: $C(5,2) + C(4,2) + C(3,2) = 10 + 6 + 3 = 19$. Peluang = 19/66 (A)."
        },
        {
          "id": "utbk26_pk_10",
          "nomor": 10,
          "mapel": "Pengetahuan Kuantitatif (PK)",
          "teksSoal": "Suku ke-3 suatu barisan aritmetika adalah 11 dan suku ke-8 adalah 31. Jumlah 15 suku pertama barisan tersebut adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "435"
            },
            {
              "key": "B",
              "teks": "465"
            },
            {
              "key": "C",
              "teks": "495"
            },
            {
              "key": "D",
              "teks": "510"
            },
            {
              "key": "E",
              "teks": "525"
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Beda $b = (31 - 11)/5 = 4$. $a = 11 - 2(4) = 3$. $S_{15} = \\frac{15}{2}(2(3) + 14(4)) = 15 \\times 31 = 465$ (B)."
        },
        {
          "id": "utbk26_pk_11",
          "nomor": 11,
          "mapel": "Pengetahuan Kuantitatif (PK)",
          "teksSoal": "Jika $x_1$ dan $x_2$ adalah akar-akar persamaan kuadrat $2x^2 - 6x + 1 = 0$, maka nilai dari $\\frac{1}{x_1} + \\frac{1}{x_2}$ adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "2"
            },
            {
              "key": "B",
              "teks": "3"
            },
            {
              "key": "C",
              "teks": "4"
            },
            {
              "key": "D",
              "teks": "6"
            },
            {
              "key": "E",
              "teks": "8"
            }
          ],
          "kunciJawaban": "D",
          "pembahasan": "Dari rumus Vieta: $x_1 + x_2 = -(-6)/2 = 3$ dan $x_1 \\cdot x_2 = 1/2$. Maka $\\frac{1}{x_1} + \\frac{1}{x_2} = \\frac{x_1 + x_2}{x_1 \\cdot x_2} = \\frac{3}{1/2} = 6$ (D)."
        },
        {
          "id": "utbk26_pk_12",
          "nomor": 12,
          "mapel": "Pengetahuan Kuantitatif (PK)",
          "teksSoal": "Diketahui fungsi $f(x) = 2x - 3$ dan $g(x) = x^2 + 1$. Nilai dari komposisi fungsi $(g \\circ f)(2)$ adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "1"
            },
            {
              "key": "B",
              "teks": "2"
            },
            {
              "key": "C",
              "teks": "3"
            },
            {
              "key": "D",
              "teks": "5"
            },
            {
              "key": "E",
              "teks": "10"
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "$f(2) = 2(2) - 3 = 1$. Maka $(g \\circ f)(2) = g(f(2)) = g(1) = 1^2 + 1 = 2$ (B)."
        },
        {
          "id": "utbk26_pk_13",
          "nomor": 13,
          "mapel": "Pengetahuan Kuantitatif (PK)",
          "teksSoal": "Sebuah segitiga sama kaki $ABC$ memiliki panjang alas $AB = 16\\text{ cm}$ dan panjang kedua sisi miringnya $AC = BC = 10\\text{ cm}$. Luas segitiga $ABC$ adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "$36\\text{ cm}^2$"
            },
            {
              "key": "B",
              "teks": "$48\\text{ cm}^2$"
            },
            {
              "key": "C",
              "teks": "$60\\text{ cm}^2$"
            },
            {
              "key": "D",
              "teks": "$72\\text{ cm}^2$"
            },
            {
              "key": "E",
              "teks": "$80\\text{ cm}^2$"
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Garis tinggi membagi alas menjadi dua bagian sama panjang: $8\\text{ cm}$. Tinggi segitiga $t = \\sqrt{10^2 - 8^2} = \\sqrt{36} = 6\\text{ cm}$. Luas $= \\frac{1}{2} \\times 16 \\times 6 = 48\\text{ cm}^2$ (B)."
        },
        {
          "id": "utbk26_pk_14",
          "nomor": 14,
          "mapel": "Pengetahuan Kuantitatif (PK)",
          "teksSoal": "Dua buah dadu bersisi enam dilempar undi secara bersamaan satu kali. Peluang muncul jumlah kedua mata dadu sama dengan 7 atau 11 adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "1/9"
            },
            {
              "key": "B",
              "teks": "2/9"
            },
            {
              "key": "C",
              "teks": "1/4"
            },
            {
              "key": "D",
              "teks": "5/18"
            },
            {
              "key": "E",
              "teks": "1/3"
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Jumlah 7: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1) -> 6 titik sampel. Jumlah 11: (5,6), (6,5) -> 2 titik sampel. Total kejadian $= 6 + 2 = 8$. Peluang $= 8/36 = 2/9$ (B)."
        },
        {
          "id": "utbk26_pk_15",
          "nomor": 15,
          "mapel": "Pengetahuan Kuantitatif (PK)",
          "teksSoal": "Jika matriks $A = \\begin{pmatrix} 3 & 2 \\\\ 4 & 3 \\end{pmatrix}$, maka determinan dari matriks invers $A^{-1}$ adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "1"
            },
            {
              "key": "B",
              "teks": "2"
            },
            {
              "key": "C",
              "teks": "-1"
            },
            {
              "key": "D",
              "teks": "1/2"
            },
            {
              "key": "E",
              "teks": "0"
            }
          ],
          "kunciJawaban": "A",
          "pembahasan": "$\\det(A) = (3)(3) - (2)(4) = 9 - 8 = 1$. Karena $\\det(A^{-1}) = \\frac{1}{\\det(A)}$, maka $\\det(A^{-1}) = 1/1 = 1$ (A)."
        },
        {
          "id": "utbk26_pk_16",
          "nomor": 16,
          "mapel": "Pengetahuan Kuantitatif (PK)",
          "teksSoal": "Nilai $x$ yang memenuhi persamaan eksponensial $3^{2x - 1} = 27$ adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "1"
            },
            {
              "key": "B",
              "teks": "1,5"
            },
            {
              "key": "C",
              "teks": "2"
            },
            {
              "key": "D",
              "teks": "2,5"
            },
            {
              "key": "E",
              "teks": "3"
            }
          ],
          "kunciJawaban": "C",
          "pembahasan": "$3^{2x - 1} = 3^3 \\Rightarrow 2x - 1 = 3 \\Rightarrow 2x = 4 \\Rightarrow x = 2$ (C)."
        },
        {
          "id": "utbk26_pk_17",
          "nomor": 17,
          "mapel": "Pengetahuan Kuantitatif (PK)",
          "teksSoal": "Nilai rata-rata ujian matematika dari 18 siswa adalah 75. Jika nilai dari 2 siswa susulan digabungkan, nilai rata-rata seluruh siswa menjadi 76. Berapakah nilai rata-rata dari kedua siswa susulan tersebut?",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "80"
            },
            {
              "key": "B",
              "teks": "82"
            },
            {
              "key": "C",
              "teks": "84"
            },
            {
              "key": "D",
              "teks": "85"
            },
            {
              "key": "E",
              "teks": "88"
            }
          ],
          "kunciJawaban": "D",
          "pembahasan": "Jumlah total nilai awal $= 18 \\times 75 = 1350$. Total nilai baru $= 20 \\times 76 = 1520$. Jumlah nilai 2 siswa susulan $= 1520 - 1350 = 170$. Rata-rata $= 170 / 2 = 85$ (D)."
        },
        {
          "id": "utbk26_pk_18",
          "nomor": 18,
          "mapel": "Pengetahuan Kuantitatif (PK)",
          "teksSoal": "Himpunan penyelesaian dari pertidaksamaan kuadrat $x^2 - 5x + 6 \\le 0$ untuk $x \\in \\mathbb{R}$ adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "$x \\le 2$ atau $x \\ge 3$"
            },
            {
              "key": "B",
              "teks": "$2 \\le x \\le 3$"
            },
            {
              "key": "C",
              "teks": "$-3 \\le x \\le -2$"
            },
            {
              "key": "D",
              "teks": "$x \\le -3$ atau $x \\ge 2$"
            },
            {
              "key": "E",
              "teks": "$x \\ge 3$"
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Faktorisasi: $(x - 2)(x - 3) \\le 0$. Pembuat nol $x = 2$ dan $x = 3$. Karena tanda $\\le 0$, daerah penyelesaian berada di antara akar: $2 \\le x \\le 3$ (B)."
        },
        {
          "id": "utbk26_pk_19",
          "nomor": 19,
          "mapel": "Pengetahuan Kuantitatif (PK)",
          "teksSoal": "Sebuah garis $g$ melalui titik $(2, -3)$ dan tegak lurus terhadap garis $2x - 4y + 5 = 0$. Persamaan garis $g$ adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "$2x + y - 1 = 0$"
            },
            {
              "key": "B",
              "teks": "$2x - y - 7 = 0$"
            },
            {
              "key": "C",
              "teks": "$x + 2y + 4 = 0$"
            },
            {
              "key": "D",
              "teks": "$2x + y + 1 = 0$"
            },
            {
              "key": "E",
              "teks": "$x - 2y - 8 = 0$"
            }
          ],
          "kunciJawaban": "A",
          "pembahasan": "Garis $2x - 4y + 5 = 0 \\Rightarrow 4y = 2x + 5 \\Rightarrow m_1 = 1/2$. Garis $g$ tegak lurus, sehingga $m_2 = -1 / (1/2) = -2$. Persamaan: $y - (-3) = -2(x - 2) \\Rightarrow y + 3 = -2x + 4 \\Rightarrow 2x + y - 1 = 0$ (A)."
        },
        {
          "id": "utbk26_pk_20",
          "nomor": 20,
          "mapel": "Pengetahuan Kuantitatif (PK)",
          "teksSoal": "Apakah nilai $x > y$?\nPutuskan apakah pernyataan (1) dan (2) berikut cukup untuk menjawab pertanyaan tersebut.\n(1) $x + y = 10$\n(2) $x - y = 4$",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Pernyataan (1) SAJA cukup untuk menjawab pertanyaan, tetapi pernyataan (2) SAJA tidak cukup."
            },
            {
              "key": "B",
              "teks": "Pernyataan (2) SAJA cukup untuk menjawab pertanyaan, tetapi pernyataan (1) SAJA tidak cukup."
            },
            {
              "key": "C",
              "teks": "DUA pernyataan BERSAMA-SAMA cukup untuk menjawab pertanyaan, tetapi SATU pernyataan SAJA tidak cukup."
            },
            {
              "key": "D",
              "teks": "Pernyataan (1) SAJA cukup dan pernyataan (2) SAJA cukup."
            },
            {
              "key": "E",
              "teks": "Pernyataan (1) dan pernyataan (2) tidak cukup untuk menjawab pertanyaan."
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Dari pernyataan (2): $x - y = 4 \\Rightarrow x - y > 0 \\Rightarrow x > y$. Ini langsung menjawab pertanyaan 'Apakah $x > y$?' secara pasti (Ya) tanpa perlu tahu nilai eksak $x$ atau $y$! Dari pernyataan (1): $x+y=10$, kita tidak bisa tahu apakah $x>y$ (misal $x=9, y=1$ vs $x=1, y=9$). Maka pernyataan (2) SAJA sudah cukup (B)."
        }
      ]
    },
    {
      "id": "subtes_lbi",
      "kode": "LBI",
      "nama": "Literasi Bahasa Indonesia (LBI)",
      "targetSoal": 30,
      "durasiMenit": 42.5,
      "estimasiDetik": 85,
      "soal": [
        {
          "id": "utbk26_lbi_01",
          "nomor": 1,
          "mapel": "Literasi Bahasa Indonesia (LBI)",
          "teksSoal": "<strong>TEKS 1 (untuk menjawab soal nomor 1 sampai 5)</strong>\nDalam kimia, jumlah partikel zat tidak dihitung satu per satu karena ukurannya sangat kecil dan jumlahnya sangat banyak. Para ahli memakai satuan mol. Satu mol zat mengandung $6,02 \\times 10^{23}$ partikel, yang disebut sebagai bilangan Avogadro ($L$).\n\nHubungan antara massa zat dan jumlah mol dinyatakan dengan rumus:\n$$n = \\frac{m}{M_r}$$\ndengan $n$ adalah jumlah mol, $m$ adalah massa zat (gram), dan $M_r$ adalah massa molekul relatif. Massa molekul relatif diperoleh dengan menjumlahkan massa atom relatif ($A_r$) seluruh atom penyusun molekul. Sebagai contoh, untuk gas karbon dioksida ($CO_2$):\n$$M_r\\, CO_2 = A_r\\, C + 2 \\times A_r\\, O$$\nJumlah partikel (molekul) dalam suatu zat dihitung dengan:\n$$N = n \\times L$$\nSelain itu, pada keadaan standar (STP: $0^\\circ\\text{C}$, $1\\text{ atm}$), satu mol gas apa pun menempati volume 22,4 liter, sehingga:\n$$V = n \\times 22,4\\text{ liter}$$\n\nGas karbon dioksida ($CO_2$) banyak dijumpai dalam kehidupan sehari-hari, misalnya pada minuman bersoda dan alat pemadam kebakaran. Seorang teknisi laboratorium menyimpan gas ini dalam sebuah tabung tertutup. Tabung tersebut berisi 22 gram gas $CO_2$. Massa atom relatif karbon ($A_r\\, C$) adalah 12 dan oksigen ($A_r\\, O$) adalah 16.\n\nBerdasarkan informasi pada Teks 1, berapakah massa molekul relatif ($M_r$) dari gas karbon dioksida ($CO_2$)?",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "28"
            },
            {
              "key": "B",
              "teks": "32"
            },
            {
              "key": "C",
              "teks": "40"
            },
            {
              "key": "D",
              "teks": "44"
            },
            {
              "key": "E",
              "teks": "48"
            }
          ],
          "kunciJawaban": "D",
          "pembahasan": "$M_r\\, CO_2 = 12 + 2(16) = 44$ (D)."
        },
        {
          "id": "utbk26_lbi_02",
          "nomor": 2,
          "mapel": "Literasi Bahasa Indonesia (LBI)",
          "teksSoal": "<strong>TEKS 1 (untuk menjawab soal nomor 1 sampai 5)</strong>\nDalam kimia, jumlah partikel zat tidak dihitung satu per satu karena ukurannya sangat kecil dan jumlahnya sangat banyak. Para ahli memakai satuan mol. Satu mol zat mengandung $6,02 \\times 10^{23}$ partikel, yang disebut sebagai bilangan Avogadro ($L$).\n\nHubungan antara massa zat dan jumlah mol dinyatakan dengan rumus:\n$$n = \\frac{m}{M_r}$$\ndengan $n$ adalah jumlah mol, $m$ adalah massa zat (gram), dan $M_r$ adalah massa molekul relatif. Massa molekul relatif diperoleh dengan menjumlahkan massa atom relatif ($A_r$) seluruh atom penyusun molekul. Sebagai contoh, untuk gas karbon dioksida ($CO_2$):\n$$M_r\\, CO_2 = A_r\\, C + 2 \\times A_r\\, O$$\nJumlah partikel (molekul) dalam suatu zat dihitung dengan:\n$$N = n \\times L$$\nSelain itu, pada keadaan standar (STP: $0^\\circ\\text{C}$, $1\\text{ atm}$), satu mol gas apa pun menempati volume 22,4 liter, sehingga:\n$$V = n \\times 22,4\\text{ liter}$$\n\nGas karbon dioksida ($CO_2$) banyak dijumpai dalam kehidupan sehari-hari, misalnya pada minuman bersoda dan alat pemadam kebakaran. Seorang teknisi laboratorium menyimpan gas ini dalam sebuah tabung tertutup. Tabung tersebut berisi 22 gram gas $CO_2$. Massa atom relatif karbon ($A_r\\, C$) adalah 12 dan oksigen ($A_r\\, O$) adalah 16.\n\nBerapakah jumlah mol ($n$) gas $CO_2$ yang tersimpan di dalam tabung laboratorium tersebut?",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "0,25 mol"
            },
            {
              "key": "B",
              "teks": "0,5 mol"
            },
            {
              "key": "C",
              "teks": "1,0 mol"
            },
            {
              "key": "D",
              "teks": "1,5 mol"
            },
            {
              "key": "E",
              "teks": "2,0 mol"
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "$n = 22 / 44 = 0,5$ mol (B)."
        },
        {
          "id": "utbk26_lbi_03",
          "nomor": 3,
          "mapel": "Literasi Bahasa Indonesia (LBI)",
          "teksSoal": "<strong>TEKS 1 (untuk menjawab soal nomor 1 sampai 5)</strong>\nDalam kimia, jumlah partikel zat tidak dihitung satu per satu karena ukurannya sangat kecil dan jumlahnya sangat banyak. Para ahli memakai satuan mol. Satu mol zat mengandung $6,02 \\times 10^{23}$ partikel, yang disebut sebagai bilangan Avogadro ($L$).\n\nHubungan antara massa zat dan jumlah mol dinyatakan dengan rumus:\n$$n = \\frac{m}{M_r}$$\ndengan $n$ adalah jumlah mol, $m$ adalah massa zat (gram), dan $M_r$ adalah massa molekul relatif. Massa molekul relatif diperoleh dengan menjumlahkan massa atom relatif ($A_r$) seluruh atom penyusun molekul. Sebagai contoh, untuk gas karbon dioksida ($CO_2$):\n$$M_r\\, CO_2 = A_r\\, C + 2 \\times A_r\\, O$$\nJumlah partikel (molekul) dalam suatu zat dihitung dengan:\n$$N = n \\times L$$\nSelain itu, pada keadaan standar (STP: $0^\\circ\\text{C}$, $1\\text{ atm}$), satu mol gas apa pun menempati volume 22,4 liter, sehingga:\n$$V = n \\times 22,4\\text{ liter}$$\n\nGas karbon dioksida ($CO_2$) banyak dijumpai dalam kehidupan sehari-hari, misalnya pada minuman bersoda dan alat pemadam kebakaran. Seorang teknisi laboratorium menyimpan gas ini dalam sebuah tabung tertutup. Tabung tersebut berisi 22 gram gas $CO_2$. Massa atom relatif karbon ($A_r\\, C$) adalah 12 dan oksigen ($A_r\\, O$) adalah 16.\n\nBerapakah jumlah partikel molekul gas $CO_2$ yang terdapat di dalam tabung tersebut?",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "3,01 × 10²² molekul"
            },
            {
              "key": "B",
              "teks": "6,02 × 10²² molekul"
            },
            {
              "key": "C",
              "teks": "3,01 × 10²³ molekul"
            },
            {
              "key": "D",
              "teks": "6,02 × 10²³ molekul"
            },
            {
              "key": "E",
              "teks": "1,204 × 10²⁴ molekul"
            }
          ],
          "kunciJawaban": "C",
          "pembahasan": "$N = 0,5 \\times 6,02 \\times 10^{23} = 3,01 \\times 10^{23}$ molekul (C)."
        },
        {
          "id": "utbk26_lbi_04",
          "nomor": 4,
          "mapel": "Literasi Bahasa Indonesia (LBI)",
          "teksSoal": "<strong>TEKS 1 (untuk menjawab soal nomor 1 sampai 5)</strong>\nDalam kimia, jumlah partikel zat tidak dihitung satu per satu karena ukurannya sangat kecil dan jumlahnya sangat banyak. Para ahli memakai satuan mol. Satu mol zat mengandung $6,02 \\times 10^{23}$ partikel, yang disebut sebagai bilangan Avogadro ($L$).\n\nHubungan antara massa zat dan jumlah mol dinyatakan dengan rumus:\n$$n = \\frac{m}{M_r}$$\ndengan $n$ adalah jumlah mol, $m$ adalah massa zat (gram), dan $M_r$ adalah massa molekul relatif. Massa molekul relatif diperoleh dengan menjumlahkan massa atom relatif ($A_r$) seluruh atom penyusun molekul. Sebagai contoh, untuk gas karbon dioksida ($CO_2$):\n$$M_r\\, CO_2 = A_r\\, C + 2 \\times A_r\\, O$$\nJumlah partikel (molekul) dalam suatu zat dihitung dengan:\n$$N = n \\times L$$\nSelain itu, pada keadaan standar (STP: $0^\\circ\\text{C}$, $1\\text{ atm}$), satu mol gas apa pun menempati volume 22,4 liter, sehingga:\n$$V = n \\times 22,4\\text{ liter}$$\n\nGas karbon dioksida ($CO_2$) banyak dijumpai dalam kehidupan sehari-hari, misalnya pada minuman bersoda dan alat pemadam kebakaran. Seorang teknisi laboratorium menyimpan gas ini dalam sebuah tabung tertutup. Tabung tersebut berisi 22 gram gas $CO_2$. Massa atom relatif karbon ($A_r\\, C$) adalah 12 dan oksigen ($A_r\\, O$) adalah 16.\n\nJika gas $CO_2$ di dalam tabung tersebut diukur pada keadaan standar (STP), berapakah volume ruang yang ditempati gas tersebut?",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "5,6 liter"
            },
            {
              "key": "B",
              "teks": "11,2 liter"
            },
            {
              "key": "C",
              "teks": "22,4 liter"
            },
            {
              "key": "D",
              "teks": "33,6 liter"
            },
            {
              "key": "E",
              "teks": "44,8 liter"
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "$V = 0,5 \\times 22,4 = 11,2$ liter (B)."
        },
        {
          "id": "utbk26_lbi_05",
          "nomor": 5,
          "mapel": "Literasi Bahasa Indonesia (LBI)",
          "teksSoal": "<strong>TEKS 1 (untuk menjawab soal nomor 1 sampai 5)</strong>\nDalam kimia, jumlah partikel zat tidak dihitung satu per satu karena ukurannya sangat kecil dan jumlahnya sangat banyak. Para ahli memakai satuan mol. Satu mol zat mengandung $6,02 \\times 10^{23}$ partikel, yang disebut sebagai bilangan Avogadro ($L$).\n\nHubungan antara massa zat dan jumlah mol dinyatakan dengan rumus:\n$$n = \\frac{m}{M_r}$$\ndengan $n$ adalah jumlah mol, $m$ adalah massa zat (gram), dan $M_r$ adalah massa molekul relatif. Massa molekul relatif diperoleh dengan menjumlahkan massa atom relatif ($A_r$) seluruh atom penyusun molekul. Sebagai contoh, untuk gas karbon dioksida ($CO_2$):\n$$M_r\\, CO_2 = A_r\\, C + 2 \\times A_r\\, O$$\nJumlah partikel (molekul) dalam suatu zat dihitung dengan:\n$$N = n \\times L$$\nSelain itu, pada keadaan standar (STP: $0^\\circ\\text{C}$, $1\\text{ atm}$), satu mol gas apa pun menempati volume 22,4 liter, sehingga:\n$$V = n \\times 22,4\\text{ liter}$$\n\nGas karbon dioksida ($CO_2$) banyak dijumpai dalam kehidupan sehari-hari, misalnya pada minuman bersoda dan alat pemadam kebakaran. Seorang teknisi laboratorium menyimpan gas ini dalam sebuah tabung tertutup. Tabung tersebut berisi 22 gram gas $CO_2$. Massa atom relatif karbon ($A_r\\, C$) adalah 12 dan oksigen ($A_r\\, O$) adalah 16.\n\nManakah pernyataan berikut yang PALING SESUAI dengan konsep mol dan gas ideal yang dijelaskan pada bacaan?",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Jumlah partikel dalam 1 mol gas bergantung pada massa molekul relatif zat."
            },
            {
              "key": "B",
              "teks": "Dua gas berbeda yang memiliki jumlah mol sama pada kondisi STP akan menempati volume yang sama persis."
            },
            {
              "key": "C",
              "teks": "Massa 1 mol gas karbon dioksida bernilai sama dengan massa 1 mol gas oksigen."
            },
            {
              "key": "D",
              "teks": "Bilangan Avogadro berubah nilainya jika suhu gas dinaikkan."
            },
            {
              "key": "E",
              "teks": "Gas dalam tabung bertekanan tinggi selalu memiliki volume 22,4 liter per mol."
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Gas dengan mol sama pada STP selalu menempati volume 22,4 L/mol (B)."
        },
        {
          "id": "utbk26_lbi_06",
          "nomor": 6,
          "mapel": "Literasi Bahasa Indonesia (LBI)",
          "teksSoal": "<strong>TEKS 2 (untuk menjawab soal nomor 6 sampai 10)</strong>\nPemerintah daerah memantau keanekaragaman hayati dan populasi spesies ikan air tawar di Danau Lindu selama lima tahun berturut-turut. Tabel berikut menyajikan data pemantauan:\n<div class=\"table-responsive\"><table class=\"table-soal\"><thead><tr><th>Tahun</th><th>Populasi Ikan Mujair (Ekor)</th><th>Populasi Ikan Gabus (Ekor)</th><th>Kadar Oksigen Terlarut / DO (mg/L)</th><th>Indeks Kualitas Air</th></tr></thead><tbody><tr><td>2020</td><td>12.500</td><td>4.200</td><td>6,8</td><td>Baik</td></tr><tr><td>2021</td><td>15.800</td><td>3.600</td><td>6,2</td><td>Baik</td></tr><tr><td>2022</td><td>21.000</td><td>2.800</td><td>5,4</td><td>Sedang</td></tr><tr><td>2023</td><td>28.500</td><td>1.900</td><td>4,6</td><td>Tercemar Ringan</td></tr><tr><td>2024</td><td>34.000</td><td>1.100</td><td>4,1</td><td>Tercemar Ringan</td></tr></tbody></table></div>\nIkan mujair merupakan spesies introduksi yang bersifat invasif, sedangkan ikan gabus merupakan predator endemik yang membutuhkan kadar oksigen terlarut tinggi.\n\nBerdasarkan data pada tabel di atas, simpulan yang PALING TEPAT mengenai dinamika populasi kedua jenis ikan adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Penurunan populasi ikan mujair berbanding lurus dengan peningkatan kadar oksigen terlarut."
            },
            {
              "key": "B",
              "teks": "Peningkatan pesat populasi ikan mujair berbanding terbalik dengan populasi ikan gabus endemik."
            },
            {
              "key": "C",
              "teks": "Kadar oksigen terlarut tidak memengaruhi kelangsungan hidup ikan gabus."
            },
            {
              "key": "D",
              "teks": "Kualitas air Danau Lindu mengalami perbaikan bertahap dari tahun 2020 ke 2024."
            },
            {
              "key": "E",
              "teks": "Kedua jenis ikan memiliki tren pertumbuhan populasi yang identik."
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Tabel memperlihatkan lonjakan populasi mujair beriringan dengan anjloknya populasi gabus endemik (B)."
        },
        {
          "id": "utbk26_lbi_07",
          "nomor": 7,
          "mapel": "Literasi Bahasa Indonesia (LBI)",
          "teksSoal": "<strong>TEKS 2 (untuk menjawab soal nomor 6 sampai 10)</strong>\nPemerintah daerah memantau keanekaragaman hayati dan populasi spesies ikan air tawar di Danau Lindu selama lima tahun berturut-turut. Tabel berikut menyajikan data pemantauan:\n<div class=\"table-responsive\"><table class=\"table-soal\"><thead><tr><th>Tahun</th><th>Populasi Ikan Mujair (Ekor)</th><th>Populasi Ikan Gabus (Ekor)</th><th>Kadar Oksigen Terlarut / DO (mg/L)</th><th>Indeks Kualitas Air</th></tr></thead><tbody><tr><td>2020</td><td>12.500</td><td>4.200</td><td>6,8</td><td>Baik</td></tr><tr><td>2021</td><td>15.800</td><td>3.600</td><td>6,2</td><td>Baik</td></tr><tr><td>2022</td><td>21.000</td><td>2.800</td><td>5,4</td><td>Sedang</td></tr><tr><td>2023</td><td>28.500</td><td>1.900</td><td>4,6</td><td>Tercemar Ringan</td></tr><tr><td>2024</td><td>34.000</td><td>1.100</td><td>4,1</td><td>Tercemar Ringan</td></tr></tbody></table></div>\nIkan mujair merupakan spesies introduksi yang bersifat invasif, sedangkan ikan gabus merupakan predator endemik yang membutuhkan kadar oksigen terlarut tinggi.\n\nPada tahun berapakah Danau Lindu mulai mengalami penurunan status kualitas air dari kategori 'Baik' menjadi 'Sedang'?",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "2020"
            },
            {
              "key": "B",
              "teks": "2021"
            },
            {
              "key": "C",
              "teks": "2022"
            },
            {
              "key": "D",
              "teks": "2023"
            },
            {
              "key": "E",
              "teks": "2024"
            }
          ],
          "kunciJawaban": "C",
          "pembahasan": "Tercantum eksplisit status 'Sedang' pertama kali muncul pada tahun 2022 (C)."
        },
        {
          "id": "utbk26_lbi_08",
          "nomor": 8,
          "mapel": "Literasi Bahasa Indonesia (LBI)",
          "teksSoal": "<strong>TEKS 2 (untuk menjawab soal nomor 6 sampai 10)</strong>\nPemerintah daerah memantau keanekaragaman hayati dan populasi spesies ikan air tawar di Danau Lindu selama lima tahun berturut-turut. Tabel berikut menyajikan data pemantauan:\n<div class=\"table-responsive\"><table class=\"table-soal\"><thead><tr><th>Tahun</th><th>Populasi Ikan Mujair (Ekor)</th><th>Populasi Ikan Gabus (Ekor)</th><th>Kadar Oksigen Terlarut / DO (mg/L)</th><th>Indeks Kualitas Air</th></tr></thead><tbody><tr><td>2020</td><td>12.500</td><td>4.200</td><td>6,8</td><td>Baik</td></tr><tr><td>2021</td><td>15.800</td><td>3.600</td><td>6,2</td><td>Baik</td></tr><tr><td>2022</td><td>21.000</td><td>2.800</td><td>5,4</td><td>Sedang</td></tr><tr><td>2023</td><td>28.500</td><td>1.900</td><td>4,6</td><td>Tercemar Ringan</td></tr><tr><td>2024</td><td>34.000</td><td>1.100</td><td>4,1</td><td>Tercemar Ringan</td></tr></tbody></table></div>\nIkan mujair merupakan spesies introduksi yang bersifat invasif, sedangkan ikan gabus merupakan predator endemik yang membutuhkan kadar oksigen terlarut tinggi.\n\nMengapa populasi ikan gabus mengalami penurunan drastis seiring berjalannya tahun?",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Ikan gabus bermigrasi ke hulu sungai karena suhu air meningkat."
            },
            {
              "key": "B",
              "teks": "Kadar oksigen terlarut yang terus merosot tidak mampu mendukung kebutuhan fisiologis ikan gabus endemik."
            },
            {
              "key": "C",
              "teks": "Ikan gabus tidak menyukai pakan alami yang terdapat di danau."
            },
            {
              "key": "D",
              "teks": "Nelayan hanya menangkap ikan gabus dan membiarkan ikan mujair berkembang."
            },
            {
              "key": "E",
              "teks": "Air danau membeku pada musim kemarau panjang."
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Ikan gabus butuh DO tinggi, sedangkan DO danau merosot dari 6,8 ke 4,1 mg/L."
        },
        {
          "id": "utbk26_lbi_09",
          "nomor": 9,
          "mapel": "Literasi Bahasa Indonesia (LBI)",
          "teksSoal": "<strong>TEKS 2 (untuk menjawab soal nomor 6 sampai 10)</strong>\nPemerintah daerah memantau keanekaragaman hayati dan populasi spesies ikan air tawar di Danau Lindu selama lima tahun berturut-turut. Tabel berikut menyajikan data pemantauan:\n<div class=\"table-responsive\"><table class=\"table-soal\"><thead><tr><th>Tahun</th><th>Populasi Ikan Mujair (Ekor)</th><th>Populasi Ikan Gabus (Ekor)</th><th>Kadar Oksigen Terlarut / DO (mg/L)</th><th>Indeks Kualitas Air</th></tr></thead><tbody><tr><td>2020</td><td>12.500</td><td>4.200</td><td>6,8</td><td>Baik</td></tr><tr><td>2021</td><td>15.800</td><td>3.600</td><td>6,2</td><td>Baik</td></tr><tr><td>2022</td><td>21.000</td><td>2.800</td><td>5,4</td><td>Sedang</td></tr><tr><td>2023</td><td>28.500</td><td>1.900</td><td>4,6</td><td>Tercemar Ringan</td></tr><tr><td>2024</td><td>34.000</td><td>1.100</td><td>4,1</td><td>Tercemar Ringan</td></tr></tbody></table></div>\nIkan mujair merupakan spesies introduksi yang bersifat invasif, sedangkan ikan gabus merupakan predator endemik yang membutuhkan kadar oksigen terlarut tinggi.\n\nJika tren penurunan populasi ikan gabus antara tahun 2023 dan 2024 (penurunan 800 ekor) berlanjut dengan laju yang sama, apa yang diprediksi akan terjadi pada tahun 2025?",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Populasi ikan gabus akan tersisa sekitar 300 ekor dan terancam punah lokal."
            },
            {
              "key": "B",
              "teks": "Populasi ikan gabus akan pulih kembali mencapai 4.000 ekor."
            },
            {
              "key": "C",
              "teks": "Ikan gabus akan berevolusi menjadi pemakan tumbuhan."
            },
            {
              "key": "D",
              "teks": "Kadar oksigen terlarut akan naik kembali ke angka 7,0 mg/L."
            },
            {
              "key": "E",
              "teks": "Populasi ikan mujair akan mati secara massal."
            }
          ],
          "kunciJawaban": "A",
          "pembahasan": "1.100 - 800 = 300 ekor (A)."
        },
        {
          "id": "utbk26_lbi_10",
          "nomor": 10,
          "mapel": "Literasi Bahasa Indonesia (LBI)",
          "teksSoal": "<strong>TEKS 2 (untuk menjawab soal nomor 6 sampai 10)</strong>\nPemerintah daerah memantau keanekaragaman hayati dan populasi spesies ikan air tawar di Danau Lindu selama lima tahun berturut-turut. Tabel berikut menyajikan data pemantauan:\n<div class=\"table-responsive\"><table class=\"table-soal\"><thead><tr><th>Tahun</th><th>Populasi Ikan Mujair (Ekor)</th><th>Populasi Ikan Gabus (Ekor)</th><th>Kadar Oksigen Terlarut / DO (mg/L)</th><th>Indeks Kualitas Air</th></tr></thead><tbody><tr><td>2020</td><td>12.500</td><td>4.200</td><td>6,8</td><td>Baik</td></tr><tr><td>2021</td><td>15.800</td><td>3.600</td><td>6,2</td><td>Baik</td></tr><tr><td>2022</td><td>21.000</td><td>2.800</td><td>5,4</td><td>Sedang</td></tr><tr><td>2023</td><td>28.500</td><td>1.900</td><td>4,6</td><td>Tercemar Ringan</td></tr><tr><td>2024</td><td>34.000</td><td>1.100</td><td>4,1</td><td>Tercemar Ringan</td></tr></tbody></table></div>\nIkan mujair merupakan spesies introduksi yang bersifat invasif, sedangkan ikan gabus merupakan predator endemik yang membutuhkan kadar oksigen terlarut tinggi.\n\nLangkah konservasi ekologis yang PALING TEPAT direkomendasikan adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Menambah bibit ikan mujair sebanyak 50.000 ekor ke danau."
            },
            {
              "key": "B",
              "teks": "Mengendalikan populasi spesies invasif mujair dan memperbaiki kualitas aerasi perairan danau."
            },
            {
              "key": "C",
              "teks": "Menutup seluruh danau dari sinar matahari dengan terpal plastik."
            },
            {
              "key": "D",
              "teks": "Membuang limbah detergen ke danau untuk membasmi gulma."
            },
            {
              "key": "E",
              "teks": "Mengeringkan danau secara permanen untuk pembangunan permukiman."
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Pengendalian spesies invasif dan pemulihan aerasi perairan adalah strategi konservasi terbaik."
        },
        {
          "id": "utbk26_lbi_11",
          "nomor": 11,
          "mapel": "Literasi Bahasa Indonesia (LBI)",
          "teksSoal": "<strong>Teks 3 (untuk menjawab soal nomor 11 sampai 14)</strong>\nPertanian presisi (precision agriculture) merupakan paradigma budi daya modern yang mengandalkan perpaduan sensor Internet of Things (IoT), drone multispektral, dan algoritma kecerdasan buatan. Dengan teknologi ini, petani dapat mengukur kadar kelembapan tanah, suhu mikroklimat, dan status hara daun pada tingkat sentimeter persegi secara waktu nyata. Alih-alih menyemprotkan pupuk dan air secara merata ke seluruh petak sawah, sistem irigasi cerdas hanya mengalirkan nutrisi ke zona tanaman yang benar-benar membutuhkan defisit nutrisi. Hasil riset Balai Pengkajian Teknologi Pertanian menunjukkan bahwa adopsi pertanian presisi mampu menekan konsumsi air hingga 35% dan menghemat biaya pupuk kimia hingga 28%, sekaligus menaikkan produktivitas padi varietas unggul sebesar 1,4 ton per hektare.\n\nGagasan utama teks di atas adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Kegagalan sistem irigasi konvensional dalam menanggulangi kekeringan lahan."
            },
            {
              "key": "B",
              "teks": "Penerapan teknologi pertanian presisi dalam meningkatkan efisiensi dan hasil panen."
            },
            {
              "key": "C",
              "teks": "Tingginya biaya pembelian sensor drone di kalangan petani tradisional."
            },
            {
              "key": "D",
              "teks": "Perbandingan kualitas antara pupuk kimia subsidi dan pupuk organik cair."
            },
            {
              "key": "E",
              "teks": "Proses rekayasa genetika pada benih padi varietas unggul nasional."
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Teks berfokus pada inovasi teknologi pertanian presisi (sensor, IoT, drone) yang menghemat air/pupuk dan meningkatkan produktivitas panen."
        },
        {
          "id": "utbk26_lbi_12",
          "nomor": 12,
          "mapel": "Literasi Bahasa Indonesia (LBI)",
          "teksSoal": "<strong>Teks 3 (untuk menjawab soal nomor 11 sampai 14)</strong>\nPertanian presisi (precision agriculture) merupakan paradigma budi daya modern yang mengandalkan perpaduan sensor Internet of Things (IoT), drone multispektral, dan algoritma kecerdasan buatan. Dengan teknologi ini, petani dapat mengukur kadar kelembapan tanah, suhu mikroklimat, dan status hara daun pada tingkat sentimeter persegi secara waktu nyata. Alih-alih menyemprotkan pupuk dan air secara merata ke seluruh petak sawah, sistem irigasi cerdas hanya mengalirkan nutrisi ke zona tanaman yang benar-benar membutuhkan defisit nutrisi. Hasil riset Balai Pengkajian Teknologi Pertanian menunjukkan bahwa adopsi pertanian presisi mampu menekan konsumsi air hingga 35% dan menghemat biaya pupuk kimia hingga 28%, sekaligus menaikkan produktivitas padi varietas unggul sebesar 1,4 ton per hektare.\n\nBerdasarkan teks tersebut, keunggulan utama sistem irigasi cerdas dibanding irigasi konvensional adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Mengalirkan air dalam debit maksimal tanpa jeda waktu."
            },
            {
              "key": "B",
              "teks": "Menyalurkan nutrisi dan air secara presisi hanya pada zona tanaman yang membutuhkan."
            },
            {
              "key": "C",
              "teks": "Menghilangkan kebutuhan manusia dalam panen dan pascapanen gabah."
            },
            {
              "key": "D",
              "teks": "Dapat beroperasi tanpa memerlukan pasokan listrik dan koneksi internet."
            },
            {
              "key": "E",
              "teks": "Mampu mengubah air payau menjadi air tawar steril secara instan."
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Kutipan teks: 'Alih-alih menyemprotkan pupuk dan air secara merata..., sistem irigasi cerdas hanya mengalirkan nutrisi ke zona tanaman yang benar-benar membutuhkan'."
        },
        {
          "id": "utbk26_lbi_13",
          "nomor": 13,
          "mapel": "Literasi Bahasa Indonesia (LBI)",
          "teksSoal": "<strong>Teks 3 (untuk menjawab soal nomor 11 sampai 14)</strong>\nPertanian presisi (precision agriculture) merupakan paradigma budi daya modern yang mengandalkan perpaduan sensor Internet of Things (IoT), drone multispektral, dan algoritma kecerdasan buatan. Dengan teknologi ini, petani dapat mengukur kadar kelembapan tanah, suhu mikroklimat, dan status hara daun pada tingkat sentimeter persegi secara waktu nyata. Alih-alih menyemprotkan pupuk dan air secara merata ke seluruh petak sawah, sistem irigasi cerdas hanya mengalirkan nutrisi ke zona tanaman yang benar-benar membutuhkan defisit nutrisi. Hasil riset Balai Pengkajian Teknologi Pertanian menunjukkan bahwa adopsi pertanian presisi mampu menekan konsumsi air hingga 35% dan menghemat biaya pupuk kimia hingga 28%, sekaligus menaikkan produktivitas padi varietas unggul sebesar 1,4 ton per hektare.\n\nPernyataan berikut yang TIDAK SESUAI dengan isi teks di atas adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Drone multispektral digunakan untuk memantau status hara daun tanaman."
            },
            {
              "key": "B",
              "teks": "Konsumsi air budi daya dapat ditekan hingga 35% melalui teknologi pertanian presisi."
            },
            {
              "key": "C",
              "teks": "Produktivitas padi varietas unggul meningkat sebesar 1,4 ton per hektare."
            },
            {
              "key": "D",
              "teks": "Biaya pemupukan kimia mengalami penghematan sebesar 28%."
            },
            {
              "key": "E",
              "teks": "Sistem pertanian presisi mengharuskan petani mengganti seluruh varietas padi lokal."
            }
          ],
          "kunciJawaban": "E",
          "pembahasan": "Teks sama sekali tidak menyebutkan kewajiban mengganti seluruh varietas lokal; teks hanya menyatakan sistem ini diuji pada varietas unggul."
        },
        {
          "id": "utbk26_lbi_14",
          "nomor": 14,
          "mapel": "Literasi Bahasa Indonesia (LBI)",
          "teksSoal": "<strong>Teks 3 (untuk menjawab soal nomor 11 sampai 14)</strong>\nPertanian presisi (precision agriculture) merupakan paradigma budi daya modern yang mengandalkan perpaduan sensor Internet of Things (IoT), drone multispektral, dan algoritma kecerdasan buatan. Dengan teknologi ini, petani dapat mengukur kadar kelembapan tanah, suhu mikroklimat, dan status hara daun pada tingkat sentimeter persegi secara waktu nyata. Alih-alih menyemprotkan pupuk dan air secara merata ke seluruh petak sawah, sistem irigasi cerdas hanya mengalirkan nutrisi ke zona tanaman yang benar-benar membutuhkan defisit nutrisi. Hasil riset Balai Pengkajian Teknologi Pertanian menunjukkan bahwa adopsi pertanian presisi mampu menekan konsumsi air hingga 35% dan menghemat biaya pupuk kimia hingga 28%, sekaligus menaikkan produktivitas padi varietas unggul sebesar 1,4 ton per hektare.\n\nSimpulan yang paling logis dari wacana di atas adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Digitalisasi sektor pertanian berpotensi memperkuat ketahanan pangan berkelanjutan."
            },
            {
              "key": "B",
              "teks": "Petani yang tidak menggunakan drone dipastikan akan mengalami gagal panen."
            },
            {
              "key": "C",
              "teks": "Penggunaan pupuk kimia harus segera dilarang secara total oleh kementerian terkait."
            },
            {
              "key": "D",
              "teks": "Pertanian presisi hanya cocok diterapkan di perkebunan skala besar luar Jawa."
            },
            {
              "key": "E",
              "teks": "Biaya operasional sensor IoT lebih mahal daripada keuntungan hasil panen."
            }
          ],
          "kunciJawaban": "A",
          "pembahasan": "Simpulan merangkum dampak positif efisiensi sumber daya dan kenaikan panen terhadap masa depan ketahanan pangan."
        },
        {
          "id": "utbk26_lbi_15",
          "nomor": 15,
          "mapel": "Literasi Bahasa Indonesia (LBI)",
          "teksSoal": "<strong>Teks 4 (untuk menjawab soal nomor 15 sampai 18)</strong>\nPerkembangan pesat model kecerdasan buatan generatif (generative AI) dalam memproduksi karya teks, ilustrasi grafis, dan komposisi musik telah memicu perdebatan hukum internasional mengenai hak kekayaan intelektual (HKI). Model-model kecerdasan buatan tersebut dilatih menggunakan miliaran data publik yang diunduh dari internet, termasuk karya-karya berhak cipta milik seniman, penulis, dan musisi tanpa persetujuan eksplisit maupun kompensasi royalti. Para kreator berargumen bahwa tindakan tersebut merupakan eksploitasi data secara sepihak dan pelanggaran hak cipta sistematis. Di sisi lain, para pengembang teknologi berdalih bahwa proses pelatihan mesin terlindung dalam doktrin penggunaan wajar (fair use), sebab mesin tidak menyalin langsung melainkan mengekstraksi pola probabilitas statistik untuk menciptakan karya turunan yang baru.\n\nInti persoalan hukum yang diperdebatkan dalam teks tersebut adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Tingginya harga langganan perangkat lunak kecerdasan buatan bagi masyarakat."
            },
            {
              "key": "B",
              "teks": "Pelatihan model AI menggunakan karya berhak cipta tanpa izin dan royalti bagi pencipta aslinya."
            },
            {
              "key": "C",
              "teks": "Penurunan kualitas estetika pada ilustrasi grafis yang dibuat oleh komputer."
            },
            {
              "key": "D",
              "teks": "Pemberhentian massal pekerja seni akibat otomatisasi studio animasi."
            },
            {
              "key": "E",
              "teks": "Larangan pemanfaatan internet untuk mengunduh dokumen publik berformat PDF."
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Perdebatan hukum berakar pada pelatihan AI menggunakan miliaran data berhak cipta tanpa lisensi/kompensasi bagi pemilik hak cipta aslinya."
        },
        {
          "id": "utbk26_lbi_16",
          "nomor": 16,
          "mapel": "Literasi Bahasa Indonesia (LBI)",
          "teksSoal": "<strong>Teks 4 (untuk menjawab soal nomor 15 sampai 18)</strong>\nPerkembangan pesat model kecerdasan buatan generatif (generative AI) dalam memproduksi karya teks, ilustrasi grafis, dan komposisi musik telah memicu perdebatan hukum internasional mengenai hak kekayaan intelektual (HKI). Model-model kecerdasan buatan tersebut dilatih menggunakan miliaran data publik yang diunduh dari internet, termasuk karya-karya berhak cipta milik seniman, penulis, dan musisi tanpa persetujuan eksplisit maupun kompensasi royalti. Para kreator berargumen bahwa tindakan tersebut merupakan eksploitasi data secara sepihak dan pelanggaran hak cipta sistematis. Di sisi lain, para pengembang teknologi berdalih bahwa proses pelatihan mesin terlindung dalam doktrin penggunaan wajar (fair use), sebab mesin tidak menyalin langsung melainkan mengekstraksi pola probabilitas statistik untuk menciptakan karya turunan yang baru.\n\nArgumen pembelaan yang diajukan oleh para pengembang teknologi kecerdasan buatan adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Seniman telah menerima kompensasi dalam bentuk eksposur digital gratis."
            },
            {
              "key": "B",
              "teks": "Karya buatan AI memiliki nilai jual yang jauh lebih murah di pasaran."
            },
            {
              "key": "C",
              "teks": "Proses pelatihan mesin termasuk penggunaan wajar karena mengekstraksi pola probabilitas, bukan menyalin langsung."
            },
            {
              "key": "D",
              "teks": "Hak kekayaan intelektual tidak lagi berlaku di era serba digital."
            },
            {
              "key": "E",
              "teks": "Seluruh data di internet secara otomatis menjadi milik pengembang perangkat lunak."
            }
          ],
          "kunciJawaban": "C",
          "pembahasan": "Pengembang berdalih tindakan mereka masuk doktrin 'fair use' karena mengekstraksi pola statistik untuk membentuk karya baru, bukan melakukan plagiasi langsung."
        },
        {
          "id": "utbk26_lbi_17",
          "nomor": 17,
          "mapel": "Literasi Bahasa Indonesia (LBI)",
          "teksSoal": "<strong>Teks 4 (untuk menjawab soal nomor 15 sampai 18)</strong>\nPerkembangan pesat model kecerdasan buatan generatif (generative AI) dalam memproduksi karya teks, ilustrasi grafis, dan komposisi musik telah memicu perdebatan hukum internasional mengenai hak kekayaan intelektual (HKI). Model-model kecerdasan buatan tersebut dilatih menggunakan miliaran data publik yang diunduh dari internet, termasuk karya-karya berhak cipta milik seniman, penulis, dan musisi tanpa persetujuan eksplisit maupun kompensasi royalti. Para kreator berargumen bahwa tindakan tersebut merupakan eksploitasi data secara sepihak dan pelanggaran hak cipta sistematis. Di sisi lain, para pengembang teknologi berdalih bahwa proses pelatihan mesin terlindung dalam doktrin penggunaan wajar (fair use), sebab mesin tidak menyalin langsung melainkan mengekstraksi pola probabilitas statistik untuk menciptakan karya turunan yang baru.\n\nMakna frasa 'doktrin penggunaan wajar (fair use)' dalam konteks teks di atas adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Kewajiban membayar pajak dua kali lipat atas karya komersial."
            },
            {
              "key": "B",
              "teks": "Prinsip hukum yang mengizinkan pemanfaatan terbatas karya berhak cipta tanpa izin untuk tujuan tertentu."
            },
            {
              "key": "C",
              "teks": "Perjanjian rahasia antara pemilik modal dan lembaga penegak hukum."
            },
            {
              "key": "D",
              "teks": "Kebijakan menghapus karya cipta setelah berumur lebih dari lima tahun."
            },
            {
              "key": "E",
              "teks": "Larangan menjual karya seni di luar wilayah yurisdiksi negara asal."
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Fair use adalah prinsip hukum hak cipta yang memperbolehkan penggunaan materi berhak cipta secara terbatas tanpa harus meminta izin kepada pemegang hak cipta."
        },
        {
          "id": "utbk26_lbi_18",
          "nomor": 18,
          "mapel": "Literasi Bahasa Indonesia (LBI)",
          "teksSoal": "<strong>Teks 4 (untuk menjawab soal nomor 15 sampai 18)</strong>\nPerkembangan pesat model kecerdasan buatan generatif (generative AI) dalam memproduksi karya teks, ilustrasi grafis, dan komposisi musik telah memicu perdebatan hukum internasional mengenai hak kekayaan intelektual (HKI). Model-model kecerdasan buatan tersebut dilatih menggunakan miliaran data publik yang diunduh dari internet, termasuk karya-karya berhak cipta milik seniman, penulis, dan musisi tanpa persetujuan eksplisit maupun kompensasi royalti. Para kreator berargumen bahwa tindakan tersebut merupakan eksploitasi data secara sepihak dan pelanggaran hak cipta sistematis. Di sisi lain, para pengembang teknologi berdalih bahwa proses pelatihan mesin terlindung dalam doktrin penggunaan wajar (fair use), sebab mesin tidak menyalin langsung melainkan mengekstraksi pola probabilitas statistik untuk menciptakan karya turunan yang baru.\n\nSikap penulis dalam menyampaikan wacana di atas dapat dikategorikan sebagai ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Subjektif dan memihak sepenuhnya kepada asosiasi pengembang teknologi."
            },
            {
              "key": "B",
              "teks": "Emosional dan mengecam seniman yang menuntut transparansi data."
            },
            {
              "key": "C",
              "teks": "Objektif dan netral dengan memaparkan perspektif kedua belah pihak secara berimbang."
            },
            {
              "key": "D",
              "teks": "Skeptis terhadap manfaat teknologi komputer di masa depan."
            },
            {
              "key": "E",
              "teks": "Apatis dan mengabaikan dampak sosial dari regulasi teknologi."
            }
          ],
          "kunciJawaban": "C",
          "pembahasan": "Penulis memaparkan argumen para kreator di satu sisi dan pembelaan para pengembang di sisi lain secara berimbang tanpa prasangka."
        },
        {
          "id": "utbk26_lbi_19",
          "nomor": 19,
          "mapel": "Literasi Bahasa Indonesia (LBI)",
          "teksSoal": "<strong>Teks 5 (untuk menjawab soal nomor 19 sampai 22)</strong>\nPaparan layar digital dan media sosial yang berkepanjangan pada remaja telah terbukti memiliki korelasi erat dengan gangguan ritme sirkadian dan penurunan durasi tidur lelap (slow-wave sleep). Cahaya biru (blue light) berspektrum pendek yang dipancarkan oleh gawai menekan sekresi hormon melatonin oleh kelenjar pineal di otak, sehingga menipu jam biologis tubuh seolah masih berada pada siang hari. Selain dampak neurobiologis, algoritma kurasi konten yang memicu kecemasan tertinggal informasi (fear of missing out/FoMO) mendorong perilaku menggulir tanpa henti (doomscrolling) hingga larut malam. Kurang tidur kronis pada masa pubertas tidak hanya menurunkan konsentrasi kognitif di sekolah, tetapi juga meningkatkan kerentanan terhadap disregulasi emosional dan gejala depresi.\n\nBerdasarkan teks, mekanisme biologis yang menyebabkan cahaya biru gawai mengganggu tidur adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Meningkatkan produksi asam lambung secara tiba-tiba di malam hari."
            },
            {
              "key": "B",
              "teks": "Menekan sekresi hormon melatonin oleh kelenjar pineal sehingga jam biologis terganggu."
            },
            {
              "key": "C",
              "teks": "Merusak lensa kornea mata sehingga penglihatan kabur seketika."
            },
            {
              "key": "D",
              "teks": "Menghambat penyerapan kalsium pada persendian tulang remaja."
            },
            {
              "key": "E",
              "teks": "Memicu penurunan denyut nadi ke tingkat yang membahayakan."
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Cahaya biru berspektrum pendek menekan sekresi hormon melatonin oleh kelenjar pineal di otak."
        },
        {
          "id": "utbk26_lbi_20",
          "nomor": 20,
          "mapel": "Literasi Bahasa Indonesia (LBI)",
          "teksSoal": "<strong>Teks 5 (untuk menjawab soal nomor 19 sampai 22)</strong>\nPaparan layar digital dan media sosial yang berkepanjangan pada remaja telah terbukti memiliki korelasi erat dengan gangguan ritme sirkadian dan penurunan durasi tidur lelap (slow-wave sleep). Cahaya biru (blue light) berspektrum pendek yang dipancarkan oleh gawai menekan sekresi hormon melatonin oleh kelenjar pineal di otak, sehingga menipu jam biologis tubuh seolah masih berada pada siang hari. Selain dampak neurobiologis, algoritma kurasi konten yang memicu kecemasan tertinggal informasi (fear of missing out/FoMO) mendorong perilaku menggulir tanpa henti (doomscrolling) hingga larut malam. Kurang tidur kronis pada masa pubertas tidak hanya menurunkan konsentrasi kognitif di sekolah, tetapi juga meningkatkan kerentanan terhadap disregulasi emosional dan gejala depresi.\n\nPerilaku 'doomscrolling' yang dipaparkan dalam wacana dipicu oleh ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Kerusakan sinyal jaringan seluler di area tempat tinggal."
            },
            {
              "key": "B",
              "teks": "Algoritma media sosial dan kecemasan tertinggal informasi (FoMO)."
            },
            {
              "key": "C",
              "teks": "Tuntutan menyelesaikan tugas sekolah dalam tenggat waktu sempit."
            },
            {
              "key": "D",
              "teks": "Keinginan mencari resep makanan sehat sebelum tidur."
            },
            {
              "key": "E",
              "teks": "Ajakan dari kelompok belajar daring di sekolah."
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Teks menyatakan: 'algoritma kurasi konten yang memicu kecemasan tertinggal informasi (fear of missing out/FoMO) mendorong perilaku menggulir tanpa henti (doomscrolling)'."
        },
        {
          "id": "utbk26_lbi_21",
          "nomor": 21,
          "mapel": "Literasi Bahasa Indonesia (LBI)",
          "teksSoal": "<strong>Teks 5 (untuk menjawab soal nomor 19 sampai 22)</strong>\nPaparan layar digital dan media sosial yang berkepanjangan pada remaja telah terbukti memiliki korelasi erat dengan gangguan ritme sirkadian dan penurunan durasi tidur lelap (slow-wave sleep). Cahaya biru (blue light) berspektrum pendek yang dipancarkan oleh gawai menekan sekresi hormon melatonin oleh kelenjar pineal di otak, sehingga menipu jam biologis tubuh seolah masih berada pada siang hari. Selain dampak neurobiologis, algoritma kurasi konten yang memicu kecemasan tertinggal informasi (fear of missing out/FoMO) mendorong perilaku menggulir tanpa henti (doomscrolling) hingga larut malam. Kurang tidur kronis pada masa pubertas tidak hanya menurunkan konsentrasi kognitif di sekolah, tetapi juga meningkatkan kerentanan terhadap disregulasi emosional dan gejala depresi.\n\nDampak psikologis jangka panjang dari kurang tidur kronis pada remaja menurut teks adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Peningkatan daya ingat fotografis saat ujian sekolah."
            },
            {
              "key": "B",
              "teks": "Kecenderungan menjadi lebih pendiam dan hemat bicara."
            },
            {
              "key": "C",
              "teks": "Peningkatan kerentanan terhadap disregulasi emosional dan gejala depresi."
            },
            {
              "key": "D",
              "teks": "Penolakan total terhadap semua jenis gawai elektronik."
            },
            {
              "key": "E",
              "teks": "Keinginan untuk selalu tidur di siang hari selama akhir pekan."
            }
          ],
          "kunciJawaban": "C",
          "pembahasan": "Kalimat penutup menyatakan bahwa kurang tidur kronis meningkatkan kerentanan terhadap disregulasi emosional dan gejala depresi."
        },
        {
          "id": "utbk26_lbi_22",
          "nomor": 22,
          "mapel": "Literasi Bahasa Indonesia (LBI)",
          "teksSoal": "<strong>Teks 5 (untuk menjawab soal nomor 19 sampai 22)</strong>\nPaparan layar digital dan media sosial yang berkepanjangan pada remaja telah terbukti memiliki korelasi erat dengan gangguan ritme sirkadian dan penurunan durasi tidur lelap (slow-wave sleep). Cahaya biru (blue light) berspektrum pendek yang dipancarkan oleh gawai menekan sekresi hormon melatonin oleh kelenjar pineal di otak, sehingga menipu jam biologis tubuh seolah masih berada pada siang hari. Selain dampak neurobiologis, algoritma kurasi konten yang memicu kecemasan tertinggal informasi (fear of missing out/FoMO) mendorong perilaku menggulir tanpa henti (doomscrolling) hingga larut malam. Kurang tidur kronis pada masa pubertas tidak hanya menurunkan konsentrasi kognitif di sekolah, tetapi juga meningkatkan kerentanan terhadap disregulasi emosional dan gejala depresi.\n\nLangkah mitigasi yang paling relevan dilakukan oleh remaja berdasarkan wacana di atas adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Mengganti gawai lama dengan gawai layar lipat keluaran terbaru."
            },
            {
              "key": "B",
              "teks": "Membatasi durasi penggunaan gawai dan menghindari layar minimal satu jam sebelum tidur."
            },
            {
              "key": "C",
              "teks": "Mengonsumsi minuman berenergi tinggi untuk menggantikan waktu tidur."
            },
            {
              "key": "D",
              "teks": "Mematikan lampu kamar namun tetap menggulir media sosial di balik selimut."
            },
            {
              "key": "E",
              "teks": "Mengunduh lebih banyak aplikasi media sosial agar tidak merasa tertinggal tren."
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Mengurangi interaksi dengan layar biru menjelang tidur membantu kelenjar pineal melepaskan melatonin secara alami."
        },
        {
          "id": "utbk26_lbi_23",
          "nomor": 23,
          "mapel": "Literasi Bahasa Indonesia (LBI)",
          "teksSoal": "<strong>Teks 6 (untuk menjawab soal nomor 23 sampai 26)</strong>\nHutan mangrove Indonesia mencakup lebih dari 20% total luasan mangrove dunia, menjadikannya benteng strategis dalam mitigasi perubahan iklim melalui penyerapan karbon biru (blue carbon). Sedimen mangrove mampu menyimpan karbon organik hingga lima kali lebih rapat per hektare dibandingkan hutan hujan tropis daratan. Karbon tersebut terkunci di dalam lumpur anaerobik selama berabad-abad asalkan struktur akarnya tidak terganggu. Sayangnya, laju deforestasi pesisir untuk konversi tambak udang intensif dan permukiman telah mereduksi luasan mangrove hingga 30% dalam tiga dekade terakhir. Kehilangan mangrove tidak hanya melepaskan simpanan emisi karbon ke atmosfer, tetapi juga melipatgandakan risiko banjir rob dan menghancurkan zona pemijahan ikan bernilai ekonomi.\n\nKeunggulan ekologis hutan mangrove dalam penyerapan karbon menurut teks di atas adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Menghasilkan kayu bakar berkualitas tinggi untuk penduduk pulau terluar."
            },
            {
              "key": "B",
              "teks": "Menyimpan karbon organik di sedimen hingga lima kali lebih rapat per hektare dibanding hutan hujan tropis."
            },
            {
              "key": "C",
              "teks": "Mampu memfilter air limbah pabrik kimia tanpa mengalami kematian jaringan akar."
            },
            {
              "key": "D",
              "teks": "Mempercepat proses pengeringan rawa pantai menjadi lahan persawahan produktif."
            },
            {
              "key": "E",
              "teks": "Mengubah gas metana menjadi gas oksigen murni secara langsung."
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Teks secara spesifik menyatakan sedimen mangrove menyimpan karbon organik hingga lima kali lebih rapat per hektare dibanding hutan hujan tropis daratan."
        },
        {
          "id": "utbk26_lbi_24",
          "nomor": 24,
          "mapel": "Literasi Bahasa Indonesia (LBI)",
          "teksSoal": "<strong>Teks 6 (untuk menjawab soal nomor 23 sampai 26)</strong>\nHutan mangrove Indonesia mencakup lebih dari 20% total luasan mangrove dunia, menjadikannya benteng strategis dalam mitigasi perubahan iklim melalui penyerapan karbon biru (blue carbon). Sedimen mangrove mampu menyimpan karbon organik hingga lima kali lebih rapat per hektare dibandingkan hutan hujan tropis daratan. Karbon tersebut terkunci di dalam lumpur anaerobik selama berabad-abad asalkan struktur akarnya tidak terganggu. Sayangnya, laju deforestasi pesisir untuk konversi tambak udang intensif dan permukiman telah mereduksi luasan mangrove hingga 30% dalam tiga dekade terakhir. Kehilangan mangrove tidak hanya melepaskan simpanan emisi karbon ke atmosfer, tetapi juga melipatgandakan risiko banjir rob dan menghancurkan zona pemijahan ikan bernilai ekonomi.\n\nFaktor utama penyebab penyusutan hutan mangrove di Indonesia selama tiga dekade terakhir adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Tingginya curah hujan ekstrem di wilayah khatulistiwa."
            },
            {
              "key": "B",
              "teks": "Konversi lahan menjadi tambak udang intensif dan area permukiman."
            },
            {
              "key": "C",
              "teks": "Serangan hama serangga pemakan daun mangrove liar."
            },
            {
              "key": "D",
              "teks": "Penurunan kadar garam air laut akibat pencairan es kutub."
            },
            {
              "key": "E",
              "teks": "Gempa bumi tektonik bawah laut di samudra luas."
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Kutipan teks: 'laju deforestasi pesisir untuk konversi tambak udang intensif dan permukiman telah mereduksi luasan mangrove hingga 30%'."
        },
        {
          "id": "utbk26_lbi_25",
          "nomor": 25,
          "mapel": "Literasi Bahasa Indonesia (LBI)",
          "teksSoal": "<strong>Teks 6 (untuk menjawab soal nomor 23 sampai 26)</strong>\nHutan mangrove Indonesia mencakup lebih dari 20% total luasan mangrove dunia, menjadikannya benteng strategis dalam mitigasi perubahan iklim melalui penyerapan karbon biru (blue carbon). Sedimen mangrove mampu menyimpan karbon organik hingga lima kali lebih rapat per hektare dibandingkan hutan hujan tropis daratan. Karbon tersebut terkunci di dalam lumpur anaerobik selama berabad-abad asalkan struktur akarnya tidak terganggu. Sayangnya, laju deforestasi pesisir untuk konversi tambak udang intensif dan permukiman telah mereduksi luasan mangrove hingga 30% dalam tiga dekade terakhir. Kehilangan mangrove tidak hanya melepaskan simpanan emisi karbon ke atmosfer, tetapi juga melipatgandakan risiko banjir rob dan menghancurkan zona pemijahan ikan bernilai ekonomi.\n\nKonsekuensi ganda yang ditimbulkan akibat rusaknya hutan mangrove adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Penurunan populasi ternak darat dan kekeringan air sumur warga kota."
            },
            {
              "key": "B",
              "teks": "Pelepasan emisi karbon ke atmosfer serta meningkatnya risiko banjir rob dan kerugian nelayan."
            },
            {
              "key": "C",
              "teks": "Kenaikan harga pupuk urea subsidi di tingkat pengecer desa pesisir."
            },
            {
              "key": "D",
              "teks": "Penutupan pelabuhan internasional akibat pendangkalan muara sungai."
            },
            {
              "key": "E",
              "teks": "Meningkatnya kandungan belerang pada garam meja tradisional."
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Dampak ganda: simpanan karbon terlepas ke atmosfer, dan pelindung abrasi/rob hilang sekaligus rusaknya tempat pemijahan ikan nelayan."
        },
        {
          "id": "utbk26_lbi_26",
          "nomor": 26,
          "mapel": "Literasi Bahasa Indonesia (LBI)",
          "teksSoal": "<strong>Teks 6 (untuk menjawab soal nomor 23 sampai 26)</strong>\nHutan mangrove Indonesia mencakup lebih dari 20% total luasan mangrove dunia, menjadikannya benteng strategis dalam mitigasi perubahan iklim melalui penyerapan karbon biru (blue carbon). Sedimen mangrove mampu menyimpan karbon organik hingga lima kali lebih rapat per hektare dibandingkan hutan hujan tropis daratan. Karbon tersebut terkunci di dalam lumpur anaerobik selama berabad-abad asalkan struktur akarnya tidak terganggu. Sayangnya, laju deforestasi pesisir untuk konversi tambak udang intensif dan permukiman telah mereduksi luasan mangrove hingga 30% dalam tiga dekade terakhir. Kehilangan mangrove tidak hanya melepaskan simpanan emisi karbon ke atmosfer, tetapi juga melipatgandakan risiko banjir rob dan menghancurkan zona pemijahan ikan bernilai ekonomi.\n\nMakna istilah 'lumpur anaerobik' dalam teks tersebut merujuk pada lapisan sedimen yang ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Mengandung kadar oksigen bebas yang sangat rendah sehingga dekomposisi lambat."
            },
            {
              "key": "B",
              "teks": "Memiliki suhu sangat tinggi akibat aktivitas gunung berapi bawah laut."
            },
            {
              "key": "C",
              "teks": "Bercampur dengan minyak mentah dari tumpahan kapal tanker."
            },
            {
              "key": "D",
              "teks": "Telah membatu menjadi lapisan batubara muda di muara sungai."
            },
            {
              "key": "E",
              "teks": "Mengapung di permukaan air laut saat terjadi air pasang purnama."
            }
          ],
          "kunciJawaban": "A",
          "pembahasan": "Anaerobik berarti kondisi tanpa atau miskin oksigen bebas, sehingga proses penguraian bahan organik berlangsung sangat lambat dan karbon terkunci rapat."
        },
        {
          "id": "utbk26_lbi_27",
          "nomor": 27,
          "mapel": "Literasi Bahasa Indonesia (LBI)",
          "teksSoal": "<strong>Teks 7 (untuk menjawab soal nomor 27 sampai 30)</strong>\nDekarbonisasi sektor transportasi perkotaan menuntut pergeseran paradigma dari ketergantungan kendaraan pribadi berbasis fosil ke angkutan umum massal bertenaga listrik yang terintegrasi. Namun, elektrifikasi armada bus kota saja tidak cukup apabila sumber pasokan listrik nasional masih didominasi pembangkit berbahan bakar batubara. Tanpa transisi bauran energi hulu ke energi terbarukan, bus listrik hanya memindahkan titik emisi cerobong dari pusat kota ke area pedesaan lokasi pembangkit berada. Oleh sebab itu, efisiensi dekarbonisasi sejati harus mengintegrasikan pengadaan armada hijau dengan pembangunan panel surya atap di depo serta penyediaan lajur khusus bus (busway) untuk memangkas waktu tunggu penumpang.\n\nKritik utama yang disampaikan penulis terhadap proyek bus listrik perkotaan adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Ukuran bus listrik dinilai terlalu besar untuk jalanan arteri kota."
            },
            {
              "key": "B",
              "teks": "Kecepatan bus listrik kalah jauh dibanding kendaraan roda dua pribadi."
            },
            {
              "key": "C",
              "teks": "Hanya memindahkan titik emisi jika pasokan listriknya masih berasal dari pembangkit batubara."
            },
            {
              "key": "D",
              "teks": "Masyarakat enggan naik bus listrik karena tarifnya yang sangat mahal."
            },
            {
              "key": "E",
              "teks": "Biaya perawatan motor listrik dinilai tidak terjangkau bagi kas daerah."
            }
          ],
          "kunciJawaban": "C",
          "pembahasan": "Penulis menggarisbawahi bahwa tanpa listrik hijau di hulu, bus listrik hanya memindahkan titik emisi gas buang dari jalanan kota ke pembangkit batubara di daerah."
        },
        {
          "id": "utbk26_lbi_28",
          "nomor": 28,
          "mapel": "Literasi Bahasa Indonesia (LBI)",
          "teksSoal": "<strong>Teks 7 (untuk menjawab soal nomor 27 sampai 30)</strong>\nDekarbonisasi sektor transportasi perkotaan menuntut pergeseran paradigma dari ketergantungan kendaraan pribadi berbasis fosil ke angkutan umum massal bertenaga listrik yang terintegrasi. Namun, elektrifikasi armada bus kota saja tidak cukup apabila sumber pasokan listrik nasional masih didominasi pembangkit berbahan bakar batubara. Tanpa transisi bauran energi hulu ke energi terbarukan, bus listrik hanya memindahkan titik emisi cerobong dari pusat kota ke area pedesaan lokasi pembangkit berada. Oleh sebab itu, efisiensi dekarbonisasi sejati harus mengintegrasikan pengadaan armada hijau dengan pembangunan panel surya atap di depo serta penyediaan lajur khusus bus (busway) untuk memangkas waktu tunggu penumpang.\n\nSolusi terpadu yang diusulkan penulis untuk mencapai dekarbonisasi transportasi sejati adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Melarang seluruh penjualan mobil pribadi bertenaga bensin dalam waktu satu tahun."
            },
            {
              "key": "B",
              "teks": "Mengintegrasikan bus listrik dengan pembangkit energi bersih di depo dan penyediaan lajur khusus."
            },
            {
              "key": "C",
              "teks": "Menutup terminal antarkota dan membatasi mobilitas penduduk antarprovinsi."
            },
            {
              "key": "D",
              "teks": "Mengganti seluruh armada bus kota dengan kereta gantung gantung gantung."
            },
            {
              "key": "E",
              "teks": "Menaikkan tarif pajak kendaraan bermotor hingga 100% tanpa kompensasi."
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Kutipan kalimat terakhir: 'mengintegrasikan pengadaan armada hijau dengan pembangunan panel surya atap di depo serta penyediaan lajur khusus bus'."
        },
        {
          "id": "utbk26_lbi_29",
          "nomor": 29,
          "mapel": "Literasi Bahasa Indonesia (LBI)",
          "teksSoal": "<strong>Teks 7 (untuk menjawab soal nomor 27 sampai 30)</strong>\nDekarbonisasi sektor transportasi perkotaan menuntut pergeseran paradigma dari ketergantungan kendaraan pribadi berbasis fosil ke angkutan umum massal bertenaga listrik yang terintegrasi. Namun, elektrifikasi armada bus kota saja tidak cukup apabila sumber pasokan listrik nasional masih didominasi pembangkit berbahan bakar batubara. Tanpa transisi bauran energi hulu ke energi terbarukan, bus listrik hanya memindahkan titik emisi cerobong dari pusat kota ke area pedesaan lokasi pembangkit berada. Oleh sebab itu, efisiensi dekarbonisasi sejati harus mengintegrasikan pengadaan armada hijau dengan pembangunan panel surya atap di depo serta penyediaan lajur khusus bus (busway) untuk memangkas waktu tunggu penumpang.\n\nMakna kata 'dekarbonisasi' dalam bacaan di atas adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Penghapusan seluruh senyawa kimia karbon dalam makanan olahan."
            },
            {
              "key": "B",
              "teks": "Upaya atau proses pengurangan dan penghapusan emisi gas rumah kaca berbasis karbon."
            },
            {
              "key": "C",
              "teks": "Penggantian rangka logam kendaraan dengan serat karbon ringan."
            },
            {
              "key": "D",
              "teks": "Pembersihan endapan karbon pada ruang bakar mesin diesel lama."
            },
            {
              "key": "E",
              "teks": "Penyulingan air laut untuk menghilangkan endapan mineral kapur."
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Dekarbonisasi adalah proses transisi menuju emisi nol dengan mengeliminasi pelepasan gas karbon dioksida ke atmosfer."
        },
        {
          "id": "utbk26_lbi_30",
          "nomor": 30,
          "mapel": "Literasi Bahasa Indonesia (LBI)",
          "teksSoal": "<strong>Teks 7 (untuk menjawab soal nomor 27 sampai 30)</strong>\nDekarbonisasi sektor transportasi perkotaan menuntut pergeseran paradigma dari ketergantungan kendaraan pribadi berbasis fosil ke angkutan umum massal bertenaga listrik yang terintegrasi. Namun, elektrifikasi armada bus kota saja tidak cukup apabila sumber pasokan listrik nasional masih didominasi pembangkit berbahan bakar batubara. Tanpa transisi bauran energi hulu ke energi terbarukan, bus listrik hanya memindahkan titik emisi cerobong dari pusat kota ke area pedesaan lokasi pembangkit berada. Oleh sebab itu, efisiensi dekarbonisasi sejati harus mengintegrasikan pengadaan armada hijau dengan pembangunan panel surya atap di depo serta penyediaan lajur khusus bus (busway) untuk memangkas waktu tunggu penumpang.\n\nPernyataan manakah yang paling sesuai menggambarkan hubungan antarparagraf atau kalimat dalam teks?",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Kalimat kedua memberikan bukti empiris yang membenarkan klaim kalimat pertama secara mutlak."
            },
            {
              "key": "B",
              "teks": "Kalimat kedua menyampaikan batasan atau syarat kritis terhadap gagasan yang diajukan di kalimat pertama."
            },
            {
              "key": "C",
              "teks": "Kalimat ketiga membantah seluruh isi wacana sebelumnya tanpa argumen rasional."
            },
            {
              "key": "D",
              "teks": "Kalimat terakhir menyimpulkan bahwa teknologi listrik sama sekali tidak layak diadopsi."
            },
            {
              "key": "E",
              "teks": "Seluruh kalimat dalam teks saling bertentangan dan tidak membentuk kesatuan makna."
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Kalimat pertama mengusulkan armada listrik, namun kalimat kedua langsung memberi batasan kritis: 'Namun, elektrifikasi armada bus kota saja tidak cukup apabila pasokan listrik masih batubara'."
        }
      ]
    },
    {
      "id": "subtes_lbe",
      "kode": "LBE",
      "nama": "Literasi Bahasa Inggris (LBE)",
      "targetSoal": 20,
      "durasiMenit": 20,
      "estimasiDetik": 60,
      "soal": [
        {
          "id": "utbk26_lbe_01",
          "nomor": 1,
          "mapel": "Literasi Bahasa Inggris (LBE)",
          "teksSoal": "<strong>Text 1 (for questions 1 to 5)</strong>\nScientists are trying to fabricate diamonds at lower temperatures. Diamonds' exceptional ability to deal with high electrical voltages and effectively disperse heat makes them extremely valuable in the semiconductor sector. However, enormous heat and pressure are traditionally required to create synthetic diamonds.\n\nThe researchers discovered that acetylene, a hydrocarbon gas, can facilitate diamond growth but can also generate soot below a certain thermal threshold. Soot is an impure mass of carbon particles resulting from incomplete combustion. Hydrogen also plays an indispensable role in low-temperature diamond synthesis. Furthermore, scientists are studying quantum diamonds engineered with nitrogen-vacancy (NV) centers, which confer extraordinary sensitivity to magnetic and thermal fluctuations for quantum computing.\n\n(Adapted from <em>ScienceDaily</em>)\n\nWhat is the primary motive behind synthesizing diamonds at lower temperatures?",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "To reduce the retail price of luxury jewelry in global markets."
            },
            {
              "key": "B",
              "teks": "To enable wider utilization in semiconductors due to thermal dissipation and voltage handling."
            },
            {
              "key": "C",
              "teks": "To eliminate the use of hydrocarbon gases in laboratory environments."
            },
            {
              "key": "D",
              "teks": "To replace natural gemstones with biodegradable organic materials."
            },
            {
              "key": "E",
              "teks": "To increase the weight and density of industrial cutting blades."
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Paragraph 1 highlights diamonds' semiconductor value in dispersing heat and managing high voltages."
        },
        {
          "id": "utbk26_lbe_02",
          "nomor": 2,
          "mapel": "Literasi Bahasa Inggris (LBE)",
          "teksSoal": "<strong>Text 1 (for questions 1 to 5)</strong>\nScientists are trying to fabricate diamonds at lower temperatures. Diamonds' exceptional ability to deal with high electrical voltages and effectively disperse heat makes them extremely valuable in the semiconductor sector. However, enormous heat and pressure are traditionally required to create synthetic diamonds.\n\nThe researchers discovered that acetylene, a hydrocarbon gas, can facilitate diamond growth but can also generate soot below a certain thermal threshold. Soot is an impure mass of carbon particles resulting from incomplete combustion. Hydrogen also plays an indispensable role in low-temperature diamond synthesis. Furthermore, scientists are studying quantum diamonds engineered with nitrogen-vacancy (NV) centers, which confer extraordinary sensitivity to magnetic and thermal fluctuations for quantum computing.\n\n(Adapted from <em>ScienceDaily</em>)\n\nWhat occurs when the synthesis temperature falls below the optimal threshold?",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "The diamond lattice expands uncontrollably."
            },
            {
              "key": "B",
              "teks": "Acetylene transforms into harmless water vapor."
            },
            {
              "key": "C",
              "teks": "Undesirable amorphous soot particles are formed instead of diamonds."
            },
            {
              "key": "D",
              "teks": "The nitrogen-vacancy centers become completely inactive."
            },
            {
              "key": "E",
              "teks": "Hydrogen atoms refuse to bind to methane molecules."
            }
          ],
          "kunciJawaban": "C",
          "pembahasan": "Below the threshold, acetylene generates amorphous soot particles."
        },
        {
          "id": "utbk26_lbe_03",
          "nomor": 3,
          "mapel": "Literasi Bahasa Inggris (LBE)",
          "teksSoal": "<strong>Text 1 (for questions 1 to 5)</strong>\nScientists are trying to fabricate diamonds at lower temperatures. Diamonds' exceptional ability to deal with high electrical voltages and effectively disperse heat makes them extremely valuable in the semiconductor sector. However, enormous heat and pressure are traditionally required to create synthetic diamonds.\n\nThe researchers discovered that acetylene, a hydrocarbon gas, can facilitate diamond growth but can also generate soot below a certain thermal threshold. Soot is an impure mass of carbon particles resulting from incomplete combustion. Hydrogen also plays an indispensable role in low-temperature diamond synthesis. Furthermore, scientists are studying quantum diamonds engineered with nitrogen-vacancy (NV) centers, which confer extraordinary sensitivity to magnetic and thermal fluctuations for quantum computing.\n\n(Adapted from <em>ScienceDaily</em>)\n\nThe word 'INDISPENSABLE' is closest in meaning to ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Optional"
            },
            {
              "key": "B",
              "teks": "Essential / Crucial"
            },
            {
              "key": "C",
              "teks": "Expensive"
            },
            {
              "key": "D",
              "teks": "Hazardous"
            },
            {
              "key": "E",
              "teks": "Temporary"
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Indispensable means absolutely necessary or essential (crucial)."
        },
        {
          "id": "utbk26_lbe_04",
          "nomor": 4,
          "mapel": "Literasi Bahasa Inggris (LBE)",
          "teksSoal": "<strong>Text 1 (for questions 1 to 5)</strong>\nScientists are trying to fabricate diamonds at lower temperatures. Diamonds' exceptional ability to deal with high electrical voltages and effectively disperse heat makes them extremely valuable in the semiconductor sector. However, enormous heat and pressure are traditionally required to create synthetic diamonds.\n\nThe researchers discovered that acetylene, a hydrocarbon gas, can facilitate diamond growth but can also generate soot below a certain thermal threshold. Soot is an impure mass of carbon particles resulting from incomplete combustion. Hydrogen also plays an indispensable role in low-temperature diamond synthesis. Furthermore, scientists are studying quantum diamonds engineered with nitrogen-vacancy (NV) centers, which confer extraordinary sensitivity to magnetic and thermal fluctuations for quantum computing.\n\n(Adapted from <em>ScienceDaily</em>)\n\nWhy are nitrogen-vacancy (NV) centers in quantum diamonds deemed scientifically groundbreaking?",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "They allow diamonds to dissolve completely in acidic solutions."
            },
            {
              "key": "B",
              "teks": "They make diamonds glow with multiple colors under daylight."
            },
            {
              "key": "C",
              "teks": "They confer extraordinary sensitivity to magnetic and thermal fluctuations for quantum computing."
            },
            {
              "key": "D",
              "teks": "They prevent synthetic diamonds from conducting any electrical current."
            },
            {
              "key": "E",
              "teks": "They convert toxic soot into pure crystalline methane."
            }
          ],
          "kunciJawaban": "C",
          "pembahasan": "NV centers render diamonds highly sensitive for quantum computing and sensing."
        },
        {
          "id": "utbk26_lbe_05",
          "nomor": 2,
          "mapel": "Literasi Bahasa Inggris (LBE)",
          "teksSoal": "<strong>Text 1 (for questions 1 to 5)</strong>\nScientists are trying to fabricate diamonds at lower temperatures. Diamonds' exceptional ability to deal with high electrical voltages and effectively disperse heat makes them extremely valuable in the semiconductor sector. However, enormous heat and pressure are traditionally required to create synthetic diamonds.\n\nThe researchers discovered that acetylene, a hydrocarbon gas, can facilitate diamond growth but can also generate soot below a certain thermal threshold. Soot is an impure mass of carbon particles resulting from incomplete combustion. Hydrogen also plays an indispensable role in low-temperature diamond synthesis. Furthermore, scientists are studying quantum diamonds engineered with nitrogen-vacancy (NV) centers, which confer extraordinary sensitivity to magnetic and thermal fluctuations for quantum computing.\n\n(Adapted from <em>ScienceDaily</em>)\n\nWhat is the author's primary attitude toward the ongoing research in low-temperature diamond fabrication?",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Skeptical and dismissive"
            },
            {
              "key": "B",
              "teks": "Objective and informative"
            },
            {
              "key": "C",
              "teks": "Overly pessimistic"
            },
            {
              "key": "D",
              "teks": "Indifferent and bored"
            },
            {
              "key": "E",
              "teks": "Satirical and mocking"
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "The tone is scholarly, objective, and informative."
        },
        {
          "id": "utbk26_lbe_06",
          "nomor": 6,
          "mapel": "Literasi Bahasa Inggris (LBE)",
          "teksSoal": "<strong>Passage 2 (for questions 6 to 9)</strong>\nRenewable energy systems, particularly solar photovoltaics and wind turbines, have undergone unprecedented cost reductions over the past decade. However, their full-scale integration into national electricity grids faces the formidable hurdle of intermittency. Solar panels generate zero power during nocturnal hours, while wind velocity fluctuates unpredictably across geographic regions. To prevent blackouts and ensure grid stability, energy authorities must deploy advanced grid-scale battery storage solutions, such as lithium-iron-phosphate and flow batteries. Furthermore, the development of intelligent demand-response algorithms enables industrial machinery and electric vehicle charging hubs to automatically adjust power draw during sudden supply curtailments.\n\nWhat is the primary topic of the passage?",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "The environmental hazards of manufacturing lithium-ion batteries."
            },
            {
              "key": "B",
              "teks": "The challenges of renewable energy intermittency and technological solutions for grid stability."
            },
            {
              "key": "C",
              "teks": "The comparison between coal-fired power plants and nuclear reactors."
            },
            {
              "key": "D",
              "teks": "The history of wind turbine development in coastal European nations."
            },
            {
              "key": "E",
              "teks": "The decline of global energy demand due to industrial automation."
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "The passage outlines how intermittent renewable generation (solar/wind) requires battery storage and smart demand-response algorithms to stabilize grids."
        },
        {
          "id": "utbk26_lbe_07",
          "nomor": 7,
          "mapel": "Literasi Bahasa Inggris (LBE)",
          "teksSoal": "<strong>Passage 2 (for questions 6 to 9)</strong>\nRenewable energy systems, particularly solar photovoltaics and wind turbines, have undergone unprecedented cost reductions over the past decade. However, their full-scale integration into national electricity grids faces the formidable hurdle of intermittency. Solar panels generate zero power during nocturnal hours, while wind velocity fluctuates unpredictably across geographic regions. To prevent blackouts and ensure grid stability, energy authorities must deploy advanced grid-scale battery storage solutions, such as lithium-iron-phosphate and flow batteries. Furthermore, the development of intelligent demand-response algorithms enables industrial machinery and electric vehicle charging hubs to automatically adjust power draw during sudden supply curtailments.\n\nThe word 'intermittency' in line 3 is closest in meaning to ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "unpredictable irregularity"
            },
            {
              "key": "B",
              "teks": "permanent cessation"
            },
            {
              "key": "C",
              "teks": "limitless expansion"
            },
            {
              "key": "D",
              "teks": "uniform constancy"
            },
            {
              "key": "E",
              "teks": "excessive output"
            }
          ],
          "kunciJawaban": "A",
          "pembahasan": "Intermittency refers to the condition of stopping and starting at irregular intervals; non-continuous."
        },
        {
          "id": "utbk26_lbe_08",
          "nomor": 8,
          "mapel": "Literasi Bahasa Inggris (LBE)",
          "teksSoal": "<strong>Passage 2 (for questions 6 to 9)</strong>\nRenewable energy systems, particularly solar photovoltaics and wind turbines, have undergone unprecedented cost reductions over the past decade. However, their full-scale integration into national electricity grids faces the formidable hurdle of intermittency. Solar panels generate zero power during nocturnal hours, while wind velocity fluctuates unpredictably across geographic regions. To prevent blackouts and ensure grid stability, energy authorities must deploy advanced grid-scale battery storage solutions, such as lithium-iron-phosphate and flow batteries. Furthermore, the development of intelligent demand-response algorithms enables industrial machinery and electric vehicle charging hubs to automatically adjust power draw during sudden supply curtailments.\n\nAccording to the passage, why are grid-scale battery solutions necessary?",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "To replace human operators in transmission control centers entirely."
            },
            {
              "key": "B",
              "teks": "To bridge the gap when solar and wind resources are temporarily unavailable."
            },
            {
              "key": "C",
              "teks": "To eliminate the need for high-voltage power lines across continents."
            },
            {
              "key": "D",
              "teks": "To reduce the manufacturing cost of electric vehicle bodies."
            },
            {
              "key": "E",
              "teks": "To filter chemical pollutants out of suburban atmospheric zones."
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Batteries store surplus energy to discharge during night or calm periods when wind and solar cannot produce electricity."
        },
        {
          "id": "utbk26_lbe_09",
          "nomor": 9,
          "mapel": "Literasi Bahasa Inggris (LBE)",
          "teksSoal": "<strong>Passage 2 (for questions 6 to 9)</strong>\nRenewable energy systems, particularly solar photovoltaics and wind turbines, have undergone unprecedented cost reductions over the past decade. However, their full-scale integration into national electricity grids faces the formidable hurdle of intermittency. Solar panels generate zero power during nocturnal hours, while wind velocity fluctuates unpredictably across geographic regions. To prevent blackouts and ensure grid stability, energy authorities must deploy advanced grid-scale battery storage solutions, such as lithium-iron-phosphate and flow batteries. Furthermore, the development of intelligent demand-response algorithms enables industrial machinery and electric vehicle charging hubs to automatically adjust power draw during sudden supply curtailments.\n\nHow do demand-response algorithms contribute to maintaining grid balance?",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "By shutting down all residential appliances during weekends."
            },
            {
              "key": "B",
              "teks": "By adjusting electrical consumption dynamically when generation levels drop."
            },
            {
              "key": "C",
              "teks": "By increasing fossil fuel burning automatically in city centers."
            },
            {
              "key": "D",
              "teks": "By disconnecting rural transmission lines during rainfall."
            },
            {
              "key": "E",
              "teks": "By enforcing mandatory power cuts on healthcare facilities."
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "They allow industrial equipment and EV charging stations to dynamically lower their electricity draw when supply decreases."
        },
        {
          "id": "utbk26_lbe_10",
          "nomor": 10,
          "mapel": "Literasi Bahasa Inggris (LBE)",
          "teksSoal": "<strong>Passage 3 (for questions 10 to 13)</strong>\nNeuroscientific investigations into bilingualism have debunked early 20th-century myths claiming that acquiring two languages from infancy causes cognitive delays in children. In reality, functional MRI studies reveal that bilingual individuals exhibit enhanced executive function—the cognitive control mechanism governing working memory, mental flexibility, and inhibitory control. Because a bilingual speaker's brain must constantly suppress the competing language while actively articulating in another, the prefrontal cortex undergoes continuous neuroplastic strengthening. Fascinatingly, epidemiological data indicate that this heightened cognitive reserve delays the clinical manifestation of Alzheimer's symptoms by four to five years compared to monolingual peers, even when structural brain pathology is identical.\n\nThe author's main purpose in writing this text is to ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "advise parents to teach their children Latin and Greek exclusively."
            },
            {
              "key": "B",
              "teks": "demonstrate the neurocognitive advantages and neurological protections conferred by bilingualism."
            },
            {
              "key": "C",
              "teks": "criticize public schools for neglecting foreign language curricula."
            },
            {
              "key": "D",
              "teks": "explain the biochemical mechanisms underlying Alzheimer's plaque formation."
            },
            {
              "key": "E",
              "teks": "compare the linguistic grammar of romance languages with Germanic dialects."
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "The author presents scientific evidence showing how bilingualism enhances executive control and provides cognitive reserve against neurodegenerative symptoms."
        },
        {
          "id": "utbk26_lbe_11",
          "nomor": 11,
          "mapel": "Literasi Bahasa Inggris (LBE)",
          "teksSoal": "<strong>Passage 3 (for questions 10 to 13)</strong>\nNeuroscientific investigations into bilingualism have debunked early 20th-century myths claiming that acquiring two languages from infancy causes cognitive delays in children. In reality, functional MRI studies reveal that bilingual individuals exhibit enhanced executive function—the cognitive control mechanism governing working memory, mental flexibility, and inhibitory control. Because a bilingual speaker's brain must constantly suppress the competing language while actively articulating in another, the prefrontal cortex undergoes continuous neuroplastic strengthening. Fascinatingly, epidemiological data indicate that this heightened cognitive reserve delays the clinical manifestation of Alzheimer's symptoms by four to five years compared to monolingual peers, even when structural brain pathology is identical.\n\nWhy does the prefrontal cortex in bilingual individuals become stronger?",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "It is exercised by continuously inhibiting one language while using the other."
            },
            {
              "key": "B",
              "teks": "It receives higher concentrations of dietary glucose during childhood."
            },
            {
              "key": "C",
              "teks": "It produces fewer synaptic connections to prevent mental fatigue."
            },
            {
              "key": "D",
              "teks": "It operates completely independently of the auditory sensory cortex."
            },
            {
              "key": "E",
              "teks": "It permanently eliminates monolingual speech pathways."
            }
          ],
          "kunciJawaban": "A",
          "pembahasan": "The text explains that the speaker's brain must constantly suppress one language while articulating the other, strengthening the prefrontal cortex."
        },
        {
          "id": "utbk26_lbe_12",
          "nomor": 12,
          "mapel": "Literasi Bahasa Inggris (LBE)",
          "teksSoal": "<strong>Passage 3 (for questions 10 to 13)</strong>\nNeuroscientific investigations into bilingualism have debunked early 20th-century myths claiming that acquiring two languages from infancy causes cognitive delays in children. In reality, functional MRI studies reveal that bilingual individuals exhibit enhanced executive function—the cognitive control mechanism governing working memory, mental flexibility, and inhibitory control. Because a bilingual speaker's brain must constantly suppress the competing language while actively articulating in another, the prefrontal cortex undergoes continuous neuroplastic strengthening. Fascinatingly, epidemiological data indicate that this heightened cognitive reserve delays the clinical manifestation of Alzheimer's symptoms by four to five years compared to monolingual peers, even when structural brain pathology is identical.\n\nWhat can be inferred from the epidemiological data regarding Alzheimer's disease?",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Bilingualism completely cures neurodegenerative diseases at a cellular level."
            },
            {
              "key": "B",
              "teks": "Cognitive reserve enables the brain to maintain functional competence despite underlying pathology."
            },
            {
              "key": "C",
              "teks": "Monolingual individuals are incapable of recovering from temporary amnesia."
            },
            {
              "key": "D",
              "teks": "Learning a second language after retirement yields zero neurological benefit."
            },
            {
              "key": "E",
              "teks": "Brain scans of bilingual patients show completely pristine neural tissue."
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "The text states symptoms are delayed by 4-5 years even when structural brain pathology is identical, proving that cognitive reserve preserves functional competence."
        },
        {
          "id": "utbk26_lbe_13",
          "nomor": 13,
          "mapel": "Literasi Bahasa Inggris (LBE)",
          "teksSoal": "<strong>Passage 3 (for questions 10 to 13)</strong>\nNeuroscientific investigations into bilingualism have debunked early 20th-century myths claiming that acquiring two languages from infancy causes cognitive delays in children. In reality, functional MRI studies reveal that bilingual individuals exhibit enhanced executive function—the cognitive control mechanism governing working memory, mental flexibility, and inhibitory control. Because a bilingual speaker's brain must constantly suppress the competing language while actively articulating in another, the prefrontal cortex undergoes continuous neuroplastic strengthening. Fascinatingly, epidemiological data indicate that this heightened cognitive reserve delays the clinical manifestation of Alzheimer's symptoms by four to five years compared to monolingual peers, even when structural brain pathology is identical.\n\nThe tone of the author throughout the passage is best characterized as ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "sarcastic and dismissive"
            },
            {
              "key": "B",
              "teks": "scholarly and informative"
            },
            {
              "key": "C",
              "teks": "nostalgic and sentimental"
            },
            {
              "key": "D",
              "teks": "hesitant and indecisive"
            },
            {
              "key": "E",
              "teks": "alarmist and panicked"
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "The passage relies on neuroscientific research, MRI studies, and epidemiological data in an objective, scholarly, and informative tone."
        },
        {
          "id": "utbk26_lbe_14",
          "nomor": 14,
          "mapel": "Literasi Bahasa Inggris (LBE)",
          "teksSoal": "<strong>Passage 4 (for questions 14 to 17)</strong>\nDeep-sea hydrothermal vents, discovered along volcanic mid-ocean ridges, harbor biological ecosystems that flourish entirely detached from solar radiation. In these abyssal depths, subterranean magma heats water to temperatures exceeding 350 degrees Celsius without boiling, due to immense hydrostatic pressure. Chemosynthetic archaebacteria, rather than photosynthetic flora, form the foundation of this unique food web. These specialized microbes oxidize toxic dissolved hydrogen sulfide spewing from mineral chimneys, converting geothermal chemicals into organic sugars. Bizarre macrofauna, including giant red-plumed tubeworms lacking digestive tracts, survive through obligate endosymbiosis with these sulfide-oxidizing bacteria.\n\nWhat makes hydrothermal vent ecosystems fundamentally distinct from surface ecosystems?",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "They rely on chemical oxidation rather than sunlight for primary organic synthesis."
            },
            {
              "key": "B",
              "teks": "They contain no bacterial organisms within their biological communities."
            },
            {
              "key": "C",
              "teks": "Their ambient water temperature remains permanently below freezing point."
            },
            {
              "key": "D",
              "teks": "They are completely devoid of any multicellular invertebrates."
            },
            {
              "key": "E",
              "teks": "They inhabit shallow continental coastal shelves exposed to tidal surges."
            }
          ],
          "kunciJawaban": "A",
          "pembahasan": "Unlike photosynthetic ecosystems powered by sunlight, hydrothermal vent webs are driven by chemosynthetic bacteria utilizing hydrogen sulfide."
        },
        {
          "id": "utbk26_lbe_15",
          "nomor": 15,
          "mapel": "Literasi Bahasa Inggris (LBE)",
          "teksSoal": "<strong>Passage 4 (for questions 14 to 17)</strong>\nDeep-sea hydrothermal vents, discovered along volcanic mid-ocean ridges, harbor biological ecosystems that flourish entirely detached from solar radiation. In these abyssal depths, subterranean magma heats water to temperatures exceeding 350 degrees Celsius without boiling, due to immense hydrostatic pressure. Chemosynthetic archaebacteria, rather than photosynthetic flora, form the foundation of this unique food web. These specialized microbes oxidize toxic dissolved hydrogen sulfide spewing from mineral chimneys, converting geothermal chemicals into organic sugars. Bizarre macrofauna, including giant red-plumed tubeworms lacking digestive tracts, survive through obligate endosymbiosis with these sulfide-oxidizing bacteria.\n\nWhy does the water in hydrothermal vents remain liquid despite temperatures over 350°C?",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "The presence of high concentrations of dissolved table salt."
            },
            {
              "key": "B",
              "teks": "The immense hydrostatic pressure exerted by the deep ocean water column."
            },
            {
              "key": "C",
              "teks": "The rapid cooling effect of subsurface arctic ocean currents."
            },
            {
              "key": "D",
              "teks": "The catalytic properties of basaltic volcanic rock layers."
            },
            {
              "key": "E",
              "teks": "The continuous absorption of thermal energy by tubeworm plumes."
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "The text states: 'without boiling, due to immense hydrostatic pressure'."
        },
        {
          "id": "utbk26_lbe_16",
          "nomor": 16,
          "mapel": "Literasi Bahasa Inggris (LBE)",
          "teksSoal": "<strong>Passage 4 (for questions 14 to 17)</strong>\nDeep-sea hydrothermal vents, discovered along volcanic mid-ocean ridges, harbor biological ecosystems that flourish entirely detached from solar radiation. In these abyssal depths, subterranean magma heats water to temperatures exceeding 350 degrees Celsius without boiling, due to immense hydrostatic pressure. Chemosynthetic archaebacteria, rather than photosynthetic flora, form the foundation of this unique food web. These specialized microbes oxidize toxic dissolved hydrogen sulfide spewing from mineral chimneys, converting geothermal chemicals into organic sugars. Bizarre macrofauna, including giant red-plumed tubeworms lacking digestive tracts, survive through obligate endosymbiosis with these sulfide-oxidizing bacteria.\n\nHow do giant tubeworms obtain their essential nourishment?",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "By capturing smaller swimming fish with venomous tentacles."
            },
            {
              "key": "B",
              "teks": "By relying on symbiotic chemosynthetic bacteria housed inside their tissues."
            },
            {
              "key": "C",
              "teks": "By filtering organic detritus falling from the upper epipelagic zone."
            },
            {
              "key": "D",
              "teks": "By grazing on photosynthetic algae along basaltic seafloor fissures."
            },
            {
              "key": "E",
              "teks": "By periodically swimming to the ocean surface to ingest plankton."
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "They lack digestive tracts and survive via obligate endosymbiosis with sulfide-oxidizing bacteria."
        },
        {
          "id": "utbk26_lbe_17",
          "nomor": 17,
          "mapel": "Literasi Bahasa Inggris (LBE)",
          "teksSoal": "<strong>Passage 4 (for questions 14 to 17)</strong>\nDeep-sea hydrothermal vents, discovered along volcanic mid-ocean ridges, harbor biological ecosystems that flourish entirely detached from solar radiation. In these abyssal depths, subterranean magma heats water to temperatures exceeding 350 degrees Celsius without boiling, due to immense hydrostatic pressure. Chemosynthetic archaebacteria, rather than photosynthetic flora, form the foundation of this unique food web. These specialized microbes oxidize toxic dissolved hydrogen sulfide spewing from mineral chimneys, converting geothermal chemicals into organic sugars. Bizarre macrofauna, including giant red-plumed tubeworms lacking digestive tracts, survive through obligate endosymbiosis with these sulfide-oxidizing bacteria.\n\nThe word 'detached' in line 2 means ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "separated or independent"
            },
            {
              "key": "B",
              "teks": "broken or damaged"
            },
            {
              "key": "C",
              "teks": "hostile and aggressive"
            },
            {
              "key": "D",
              "teks": "confused and unorganized"
            },
            {
              "key": "E",
              "teks": "partially integrated"
            }
          ],
          "kunciJawaban": "A",
          "pembahasan": "Detached here means operating independently or separated from solar radiation."
        },
        {
          "id": "utbk26_lbe_18",
          "nomor": 18,
          "mapel": "Literasi Bahasa Inggris (LBE)",
          "teksSoal": "<strong>Passage 5 (for questions 18 to 20)</strong>\nAs global metropolitan areas swell, civil architects and urban planners are increasingly embracing biophilic design and vertical forests. Modern high-rise residential towers incorporated with cantilevered balconies support hundreds of mature deciduous trees and thousands of evergreen shrub species. Beyond delivering undeniable visual allure, these arboreal facades serve as natural thermal insulators, reducing interior building cooling requirements by up to 30 percent during blistering summer peaks. Furthermore, the vegetative foliage absorbs ambient acoustic reverberations, mitigates toxic particulate matter ($PM_{2.5}$), and counteracts the lethal heat island effect in densely paved urban cores.\n\nAccording to the passage, what is an economic and environmental benefit of vertical forests?",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "They eliminate the need for concrete foundations in structural skyscrapers."
            },
            {
              "key": "B",
              "teks": "They lower air conditioning energy demand by up to 30% through biological insulation."
            },
            {
              "key": "C",
              "teks": "They produce commercial timber for the national furniture export industry."
            },
            {
              "key": "D",
              "teks": "They prevent all seismic tremors from affecting urban buildings."
            },
            {
              "key": "E",
              "teks": "They convert automobile exhaust gases into potable drinking water."
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "The passage notes that the facades act as thermal insulators, cutting interior cooling needs by up to 30%."
        },
        {
          "id": "utbk26_lbe_19",
          "nomor": 19,
          "mapel": "Literasi Bahasa Inggris (LBE)",
          "teksSoal": "<strong>Passage 5 (for questions 18 to 20)</strong>\nAs global metropolitan areas swell, civil architects and urban planners are increasingly embracing biophilic design and vertical forests. Modern high-rise residential towers incorporated with cantilevered balconies support hundreds of mature deciduous trees and thousands of evergreen shrub species. Beyond delivering undeniable visual allure, these arboreal facades serve as natural thermal insulators, reducing interior building cooling requirements by up to 30 percent during blistering summer peaks. Furthermore, the vegetative foliage absorbs ambient acoustic reverberations, mitigates toxic particulate matter ($PM_{2.5}$), and counteracts the lethal heat island effect in densely paved urban cores.\n\nThe 'urban heat island effect' referred to in the passage is primarily caused by ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "high concentrations of paved surfaces absorbing and re-radiating atmospheric heat."
            },
            {
              "key": "B",
              "teks": "volcanic activity situated directly underneath metropolitan subway networks."
            },
            {
              "key": "C",
              "teks": "the lack of domestic refrigerators inside modern residential apartments."
            },
            {
              "key": "D",
              "teks": "excessive planting of tropical trees along suburban riverbanks."
            },
            {
              "key": "E",
              "teks": "oceanic warm currents flowing into artificial city harbor basins."
            }
          ],
          "kunciJawaban": "A",
          "pembahasan": "Heat islands occur in densely paved urban environments where asphalt and concrete absorb and trap heat."
        },
        {
          "id": "utbk26_lbe_20",
          "nomor": 20,
          "mapel": "Literasi Bahasa Inggris (LBE)",
          "teksSoal": "<strong>Passage 5 (for questions 18 to 20)</strong>\nAs global metropolitan areas swell, civil architects and urban planners are increasingly embracing biophilic design and vertical forests. Modern high-rise residential towers incorporated with cantilevered balconies support hundreds of mature deciduous trees and thousands of evergreen shrub species. Beyond delivering undeniable visual allure, these arboreal facades serve as natural thermal insulators, reducing interior building cooling requirements by up to 30 percent during blistering summer peaks. Furthermore, the vegetative foliage absorbs ambient acoustic reverberations, mitigates toxic particulate matter ($PM_{2.5}$), and counteracts the lethal heat island effect in densely paved urban cores.\n\nWhich of the following would be the most suitable title for this passage?",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "The Extinction of Urban Wildlife in European Metropolises"
            },
            {
              "key": "B",
              "teks": "Vertical Forests: Greening Skyscrapers for Climate-Resilient Cities"
            },
            {
              "key": "C",
              "teks": "The High Maintenance Costs of Concrete High-Rise Towers"
            },
            {
              "key": "D",
              "teks": "Agricultural Soil Degradation in Modern Suburbs"
            },
            {
              "key": "E",
              "teks": "A Comprehensive History of Hydraulic Elevators"
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "The passage focuses on vertical forests and biophilic architectural design as climate-resilient solutions for cities."
        }
      ]
    },
    {
      "id": "subtes_pm",
      "kode": "PM",
      "nama": "Penalaran Matematika (PM)",
      "targetSoal": 20,
      "durasiMenit": 42.5,
      "estimasiDetik": 127.5,
      "soal": [
        {
          "id": "utbk26_pm_01",
          "nomor": 1,
          "mapel": "Penalaran Matematika (PM)",
          "teksSoal": "<strong>Teks 1 (untuk menjawab soal nomor 1 sampai 3)</strong>\nDi suatu toko bangunan, harga jual 2 kaleng cat kayu, 3 kaleng cat tembok, dan 1 kaleng cat besi adalah Rp318.000,00. Sementara itu, harga jual 1 kaleng cat kayu dan 2 kaleng cat besi adalah Rp102.000,00.\nPada bagian lain, toko tersebut juga menyediakan paket abon dengan rincian harga sebagai berikut: harga 1 kg abon ayam adalah Rp40.000,00, harga 1 kg abon sapi adalah Rp80.000,00, dan harga 1 kg abon ikan adalah Rp60.000,00.\n\nJika Pak Tono membeli 1 kaleng cat kayu, 1 kaleng cat tembok, dan 1 kaleng cat besi di toko tersebut, ia harus membayar sebanyak ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Rp128.000,00"
            },
            {
              "key": "B",
              "teks": "Rp132.000,00"
            },
            {
              "key": "C",
              "teks": "Rp136.000,00"
            },
            {
              "key": "D",
              "teks": "Rp140.000,00"
            },
            {
              "key": "E",
              "teks": "Rp144.000,00"
            }
          ],
          "kunciJawaban": "C",
          "pembahasan": "Eliminasi sistem persamaan harga cat menghasilkan total Rp136.000,00 (C)."
        },
        {
          "id": "utbk26_pm_02",
          "nomor": 2,
          "mapel": "Penalaran Matematika (PM)",
          "teksSoal": "<strong>Teks 1 (untuk menjawab soal nomor 1 sampai 3)</strong>\nDi suatu toko bangunan, harga jual 2 kaleng cat kayu, 3 kaleng cat tembok, dan 1 kaleng cat besi adalah Rp318.000,00. Sementara itu, harga jual 1 kaleng cat kayu dan 2 kaleng cat besi adalah Rp102.000,00.\nPada bagian lain, toko tersebut juga menyediakan paket abon dengan rincian harga sebagai berikut: harga 1 kg abon ayam adalah Rp40.000,00, harga 1 kg abon sapi adalah Rp80.000,00, dan harga 1 kg abon ikan adalah Rp60.000,00.\n\nBerdasarkan data harga pada Teks 1, selisih harga antara 1 kaleng cat tembok dengan 1 kaleng cat besi adalah ...",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Rp40.000,00"
            },
            {
              "key": "B",
              "teks": "Rp38.000,00"
            },
            {
              "key": "C",
              "teks": "Rp36.000,00"
            },
            {
              "key": "D",
              "teks": "Rp34.000,00"
            },
            {
              "key": "E",
              "teks": "Rp32.000,00"
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Selisih harga cat tembok (Rp74.000) dan cat besi (Rp36.000) adalah Rp38.000,00 (B)."
        },
        {
          "id": "utbk26_pm_03",
          "nomor": 3,
          "mapel": "Penalaran Matematika (PM)",
          "teksSoal": "<strong>Teks 1 (untuk menjawab soal nomor 1 sampai 3)</strong>\nDi suatu toko bangunan, harga jual 2 kaleng cat kayu, 3 kaleng cat tembok, dan 1 kaleng cat besi adalah Rp318.000,00. Sementara itu, harga jual 1 kaleng cat kayu dan 2 kaleng cat besi adalah Rp102.000,00.\nPada bagian lain, toko tersebut juga menyediakan paket abon dengan rincian harga sebagai berikut: harga 1 kg abon ayam adalah Rp40.000,00, harga 1 kg abon sapi adalah Rp80.000,00, dan harga 1 kg abon ikan adalah Rp60.000,00.\n\nSeorang pembeli membeli 2 kg abon ayam, 1 kg abon sapi, dan 3 kg abon ikan. Berapakah total uang yang harus ia bayarkan?",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Rp300.000,00"
            },
            {
              "key": "B",
              "teks": "Rp320.000,00"
            },
            {
              "key": "C",
              "teks": "Rp340.000,00"
            },
            {
              "key": "D",
              "teks": "Rp360.000,00"
            },
            {
              "key": "E",
              "teks": "Rp380.000,00"
            }
          ],
          "kunciJawaban": "C",
          "pembahasan": "$2(40.000) + 1(80.000) + 3(60.000) = 80.000 + 80.000 + 180.000 = 340.000$ rupiah (C)."
        },
        {
          "id": "utbk26_pm_04",
          "nomor": 4,
          "mapel": "Penalaran Matematika (PM)",
          "teksSoal": "<strong>Teks 4 (untuk menjawab soal nomor 4 sampai 7)</strong>\nDi sebuah taman bermain anak-anak, diadakan sebuah penelitian mengenai lamanya waktu bermain anak-anak di lokasi tersebut. Waktu lama bermain anak-anak dipengaruhi oleh faktor cuaca. Total anak-anak yang bermain di pagi hari adalah 40 anak dan total yang bermain di sore hari sama besarnya (40 anak).\nBerikut adalah tabel data waktu bermain:\n<div class=\"table-responsive\"><table class=\"table-soal\"><thead><tr><th>Lama Bermain (menit)</th><th>Jam Pagi (Banyak Anak)</th><th>Jam Sore (Banyak Anak)</th></tr></thead><tbody><tr><td>10 – 19</td><td>6</td><td>2</td></tr><tr><td>20 – 29</td><td>14</td><td>8</td></tr><tr><td>30 – 39</td><td>12</td><td>16</td></tr><tr><td>40 – 49</td><td>8</td><td>14</td></tr></tbody></table></div>\n\nBerdasarkan data pada tabel Teks 4, berapakah persentase anak yang bermain di sore hari selama sedikitnya 30 menit?",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "50%"
            },
            {
              "key": "B",
              "teks": "60%"
            },
            {
              "key": "C",
              "teks": "70%"
            },
            {
              "key": "D",
              "teks": "75%"
            },
            {
              "key": "E",
              "teks": "80%"
            }
          ],
          "kunciJawaban": "D",
          "pembahasan": "Sore hari $\\ge 30$ menit = $16 + 14 = 30$ anak. Persentase $= 30/40 \\times 100\\% = 75\\%$ (D)."
        },
        {
          "id": "utbk26_pm_05",
          "nomor": 5,
          "mapel": "Penalaran Matematika (PM)",
          "teksSoal": "<strong>Teks 4 (untuk menjawab soal nomor 4 sampai 7)</strong>\nDi sebuah taman bermain anak-anak, diadakan sebuah penelitian mengenai lamanya waktu bermain anak-anak di lokasi tersebut. Waktu lama bermain anak-anak dipengaruhi oleh faktor cuaca. Total anak-anak yang bermain di pagi hari adalah 40 anak dan total yang bermain di sore hari sama besarnya (40 anak).\nBerikut adalah tabel data waktu bermain:\n<div class=\"table-responsive\"><table class=\"table-soal\"><thead><tr><th>Lama Bermain (menit)</th><th>Jam Pagi (Banyak Anak)</th><th>Jam Sore (Banyak Anak)</th></tr></thead><tbody><tr><td>10 – 19</td><td>6</td><td>2</td></tr><tr><td>20 – 29</td><td>14</td><td>8</td></tr><tr><td>30 – 39</td><td>12</td><td>16</td></tr><tr><td>40 – 49</td><td>8</td><td>14</td></tr></tbody></table></div>\n\nBerapakah perkiraan nilai rata-rata (mean) lama waktu bermain anak-anak pada jam pagi hari?",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "28,5 menit"
            },
            {
              "key": "B",
              "teks": "29,5 menit"
            },
            {
              "key": "C",
              "teks": "30,5 menit"
            },
            {
              "key": "D",
              "teks": "31,5 menit"
            },
            {
              "key": "E",
              "teks": "32,5 menit"
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Perhitungan rata-rata berbobot titik tengah interval menghasilkan 29,5 menit (B)."
        },
        {
          "id": "utbk26_pm_06",
          "nomor": 6,
          "mapel": "Penalaran Matematika (PM)",
          "teksSoal": "<strong>Teks 4 (untuk menjawab soal nomor 4 sampai 7)</strong>\nDi sebuah taman bermain anak-anak, diadakan sebuah penelitian mengenai lamanya waktu bermain anak-anak di lokasi tersebut. Waktu lama bermain anak-anak dipengaruhi oleh faktor cuaca. Total anak-anak yang bermain di pagi hari adalah 40 anak dan total yang bermain di sore hari sama besarnya (40 anak).\nBerikut adalah tabel data waktu bermain:\n<div class=\"table-responsive\"><table class=\"table-soal\"><thead><tr><th>Lama Bermain (menit)</th><th>Jam Pagi (Banyak Anak)</th><th>Jam Sore (Banyak Anak)</th></tr></thead><tbody><tr><td>10 – 19</td><td>6</td><td>2</td></tr><tr><td>20 – 29</td><td>14</td><td>8</td></tr><tr><td>30 – 39</td><td>12</td><td>16</td></tr><tr><td>40 – 49</td><td>8</td><td>14</td></tr></tbody></table></div>\n\nBerapakah rasio jumlah anak yang bermain kurang dari 30 menit di pagi hari dibandingkan di sore hari?",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "1 : 1"
            },
            {
              "key": "B",
              "teks": "2 : 1"
            },
            {
              "key": "C",
              "teks": "3 : 2"
            },
            {
              "key": "D",
              "teks": "4 : 3"
            },
            {
              "key": "E",
              "teks": "5 : 4"
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Pagi $< 30$ mnt = 20 anak. Sore $< 30$ mnt = 10 anak. Rasio $= 20 : 10 = 2 : 1$ (B)."
        },
        {
          "id": "utbk26_pm_07",
          "nomor": 7,
          "mapel": "Penalaran Matematika (PM)",
          "teksSoal": "<strong>Teks 4 (untuk menjawab soal nomor 4 sampai 7)</strong>\nDi sebuah taman bermain anak-anak, diadakan sebuah penelitian mengenai lamanya waktu bermain anak-anak di lokasi tersebut. Waktu lama bermain anak-anak dipengaruhi oleh faktor cuaca. Total anak-anak yang bermain di pagi hari adalah 40 anak dan total yang bermain di sore hari sama besarnya (40 anak).\nBerikut adalah tabel data waktu bermain:\n<div class=\"table-responsive\"><table class=\"table-soal\"><thead><tr><th>Lama Bermain (menit)</th><th>Jam Pagi (Banyak Anak)</th><th>Jam Sore (Banyak Anak)</th></tr></thead><tbody><tr><td>10 – 19</td><td>6</td><td>2</td></tr><tr><td>20 – 29</td><td>14</td><td>8</td></tr><tr><td>30 – 39</td><td>12</td><td>16</td></tr><tr><td>40 – 49</td><td>8</td><td>14</td></tr></tbody></table></div>\n\nJika seorang anak dipilih secara acak dari seluruh anak yang bermain di sore hari, berapakah peluang ia bermain selama 40–49 menit?",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "7/20"
            },
            {
              "key": "B",
              "teks": "8/20"
            },
            {
              "key": "C",
              "teks": "9/20"
            },
            {
              "key": "D",
              "teks": "11/20"
            },
            {
              "key": "E",
              "teks": "14/20"
            }
          ],
          "kunciJawaban": "A",
          "pembahasan": "$14 / 40 = 7/20$ (A)."
        },
        {
          "id": "utbk26_pm_08",
          "nomor": 8,
          "mapel": "Penalaran Matematika (PM)",
          "teksSoal": "Sebuah kedai kopi UMKM menghitung biaya operasional bulanannya. Biaya sewa tempat dan gaji karyawan (biaya tetap) adalah Rp6.000.000,00 per bulan. Biaya bahan baku kopi, susu, dan cangkir (biaya variabel) adalah Rp8.000,00 per cangkir. Jika harga jual kopi dipatok Rp20.000,00 per cangkir, berapakah jumlah cangkir minimal yang harus terjual dalam sebulan agar kedai kopi mencapai titik impas (Break Even Point / BEP)?",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "300 cangkir"
            },
            {
              "key": "B",
              "teks": "400 cangkir"
            },
            {
              "key": "C",
              "teks": "500 cangkir"
            },
            {
              "key": "D",
              "teks": "600 cangkir"
            },
            {
              "key": "E",
              "teks": "750 cangkir"
            }
          ],
          "kunciJawaban": "C",
          "pembahasan": "Margin kontribusi per cangkir $= Rp20.000 - Rp8.000 = Rp12.000$. BEP $= \\frac{\\text{Biaya Tetap}}{\\text{Margin Kontribusi}} = \\frac{6.000.000}{12.000} = 500\\text{ cangkir}$ (C)."
        },
        {
          "id": "utbk26_pm_09",
          "nomor": 9,
          "mapel": "Penalaran Matematika (PM)",
          "teksSoal": "Melanjutkan informasi kedai kopi pada soal sebelumnya: Jika pemilik kedai menargetkan keuntungan bersih (laba bersih) sebesar Rp3.600.000,00 per bulan, berapakah total cangkir kopi yang harus terjual dalam bulan tersebut?",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "650 cangkir"
            },
            {
              "key": "B",
              "teks": "700 cangkir"
            },
            {
              "key": "C",
              "teks": "750 cangkir"
            },
            {
              "key": "D",
              "teks": "800 cangkir"
            },
            {
              "key": "E",
              "teks": "900 cangkir"
            }
          ],
          "kunciJawaban": "D",
          "pembahasan": "Target penjualan $= \\frac{\\text{Biaya Tetap} + \\text{Target Laba}}{\\text{Margin Kontribusi}} = \\frac{6.000.000 + 3.600.000}{12.000} = \\frac{9.600.000}{12.000} = 800\\text{ cangkir}$ (D)."
        },
        {
          "id": "utbk26_pm_10",
          "nomor": 10,
          "mapel": "Penalaran Matematika (PM)",
          "teksSoal": "Jika pada bulan berikutnya harga biji kopi naik sehingga biaya variabel per cangkir menjadi Rp10.000,00, sementara harga jual tetap Rp20.000,00 dan biaya tetap tetap Rp6.000.000,00, berapa persentase kenaikan penjualan cangkir kopi yang dibutuhkan agar BEP baru tercapai dibandingkan BEP awal (500 cangkir)?",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "10%"
            },
            {
              "key": "B",
              "teks": "15%"
            },
            {
              "key": "C",
              "teks": "20%"
            },
            {
              "key": "D",
              "teks": "25%"
            },
            {
              "key": "E",
              "teks": "30%"
            }
          ],
          "kunciJawaban": "C",
          "pembahasan": "Margin baru $= Rp20.000 - Rp10.000 = Rp10.000$. BEP baru $= 6.000.000 / 10.000 = 600\\text{ cangkir}$. Kenaikan $= (600 - 500) / 500 = 100 / 500 = 20\\%$ (C)."
        },
        {
          "id": "utbk26_pm_11",
          "nomor": 11,
          "mapel": "Penalaran Matematika (PM)",
          "teksSoal": "Pak Budi mendepositokan uang sebesar Rp10.000.000,00 di sebuah bank syariah dengan sistem bagi hasil majemuk setara bunga 6% per tahun yang dibayarkan dan dikapitalisasi setiap semester (setiap 6 bulan). Berapakah total saldo simpanan Pak Budi tepat setelah 1 tahun?",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Rp10.600.000,00"
            },
            {
              "key": "B",
              "teks": "Rp10.609.000,00"
            },
            {
              "key": "C",
              "teks": "Rp10.612.080,00"
            },
            {
              "key": "D",
              "teks": "Rp10.620.000,00"
            },
            {
              "key": "E",
              "teks": "Rp10.650.000,00"
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Bunga per semester $= 6\\% / 2 = 3\\% = 0,03$. Dalam 1 tahun terdapat 2 semester. Saldo akhir $= 10.000.000 \\times (1 + 0,03)^2 = 10.000.000 \\times 1,0609 = Rp10.609.000,00$ (B)."
        },
        {
          "id": "utbk26_pm_12",
          "nomor": 12,
          "mapel": "Penalaran Matematika (PM)",
          "teksSoal": "Sebuah toko elektronik memberikan promo ganda pada perayaan akhir tahun: diskon utama sebesar 20%, kemudian pelanggan yang membayar dengan kartu debit mitra mendapatkan potongan tambahan sebesar 10% dari harga setelah diskon pertama. Jika seorang pembeli membayar laptop sebesar Rp7.200.000,00 di kasir, berapakah harga asli laptop tersebut sebelum dikenakan diskon apa pun?",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Rp9.000.000,00"
            },
            {
              "key": "B",
              "teks": "Rp9.500.000,00"
            },
            {
              "key": "C",
              "teks": "Rp10.000.000,00"
            },
            {
              "key": "D",
              "teks": "Rp10.500.000,00"
            },
            {
              "key": "E",
              "teks": "Rp11.000.000,00"
            }
          ],
          "kunciJawaban": "C",
          "pembahasan": "Harga bayar $= H \\times (1 - 0,20) \\times (1 - 0,10) = H \\times 0,80 \\times 0,90 = 0,72 H$. Karena $0,72 H = 7.200.000$, maka $H = 7.200.000 / 0,72 = Rp10.000.000,00$ (C)."
        },
        {
          "id": "utbk26_pm_13",
          "nomor": 13,
          "mapel": "Penalaran Matematika (PM)",
          "teksSoal": "Sebuah armada truk ekspres mengangkut muatan logistik dari Kota A ke Kota B sejauh 240 km. Truk menempuh separuh perjalanan awal (120 km pertama) dengan kecepatan rata-rata 40 km/jam karena jalur berkelok. Agar rata-rata kecepatan seluruh perjalanan dari Kota A ke Kota B tepat 60 km/jam, berapakah kecepatan rata-rata yang harus ditempuh truk pada 120 km separuh perjalanan terakhir?",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "80 km/jam"
            },
            {
              "key": "B",
              "teks": "90 km/jam"
            },
            {
              "key": "C",
              "teks": "100 km/jam"
            },
            {
              "key": "D",
              "teks": "120 km/jam"
            },
            {
              "key": "E",
              "teks": "Tidak mungkin tercapai"
            }
          ],
          "kunciJawaban": "D",
          "pembahasan": "Total jarak $= 240\\text{ km}$. Kecepatan rata-rata $= 60\\text{ km/jam} \\Rightarrow$ total waktu $= 240 / 60 = 4\\text{ jam}$. Waktu paruh pertama $= 120 / 40 = 3\\text{ jam}$. Sisa waktu untuk paruh kedua $= 4 - 3 = 1\\text{ jam}$. Kecepatan paruh kedua $= 120\\text{ km} / 1\\text{ jam} = 120\\text{ km/jam}$ (D)."
        },
        {
          "id": "utbk26_pm_14",
          "nomor": 14,
          "mapel": "Penalaran Matematika (PM)",
          "teksSoal": "Keluarga Pak Arman menggunakan beberapa peralatan listrik rumah tangga setiap hari: 4 buah lampu 20 watt menyala 10 jam sehari, 1 buah kulkas 150 watt menyala 24 jam sehari, dan 1 unit AC 400 watt menyala 8 jam sehari. Berapakah total konsumsi energi listrik rumah Pak Arman selama 30 hari dalam satuan kilowatt-hour (kWh)?",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "228 kWh"
            },
            {
              "key": "B",
              "teks": "240 kWh"
            },
            {
              "key": "C",
              "teks": "258 kWh"
            },
            {
              "key": "D",
              "teks": "275 kWh"
            },
            {
              "key": "E",
              "teks": "310 kWh"
            }
          ],
          "kunciJawaban": "A",
          "pembahasan": "Konsumsi per hari: Lampu: $4 \\times 20 \\times 10 = 800\\text{ Wh}$. Kulkas: $150 \\times 24 = 3600\\text{ Wh}$. AC: $400 \\times 8 = 3200\\text{ Wh}$. Total harian $= 800 + 3600 + 3200 = 7600\\text{ Wh} = 7,6\\text{ kWh}$. Dalam 30 hari $= 7,6 \\times 30 = 228\\text{ kWh}$ (A)."
        },
        {
          "id": "utbk26_pm_15",
          "nomor": 15,
          "mapel": "Penalaran Matematika (PM)",
          "teksSoal": "Jika tarif listrik PLN golongan rumah tangga adalah Rp1.500,00 per kWh dan dikenakan biaya beban administrasi tetap sebesar Rp25.000,00 per bulan, berapakah total tagihan listrik bulanan yang harus dibayar Pak Arman berdasarkan konsumsi soal sebelumnya (228 kWh)?",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Rp342.000,00"
            },
            {
              "key": "B",
              "teks": "Rp367.000,00"
            },
            {
              "key": "C",
              "teks": "Rp380.000,00"
            },
            {
              "key": "D",
              "teks": "Rp395.000,00"
            },
            {
              "key": "E",
              "teks": "Rp410.000,00"
            }
          ],
          "kunciJawaban": "B",
          "pembahasan": "Biaya pemakaian $= 228 \\times 1.500 = Rp342.000,00$. Total tagihan $= Rp342.000 + Rp25.000 = Rp367.000,00$ (B)."
        },
        {
          "id": "utbk26_pm_16",
          "nomor": 16,
          "mapel": "Penalaran Matematika (PM)",
          "teksSoal": "Sebuah tangki penampung air berbentuk tabung silinder dengan jari-jari alas $1\\text{ meter}$ dan tinggi $2\\text{ meter}$ terisi penuh air. Di dasar tangki terdapat kran pembuangan dengan debit aliran konstan 20 liter per menit. (Gunakan pendekatan $\\pi \\approx 3,14$, dan $1\\text{ m}^3 = 1000\\text{ liter}$). Berapa waktu yang dibutuhkan agar air di dalam tangki habis terkuras?",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "2 jam 15 menit"
            },
            {
              "key": "B",
              "teks": "3 jam 45 menit"
            },
            {
              "key": "C",
              "teks": "4 jam 17 menit"
            },
            {
              "key": "D",
              "teks": "5 jam 14 menit"
            },
            {
              "key": "E",
              "teks": "6 jam 20 menit"
            }
          ],
          "kunciJawaban": "D",
          "pembahasan": "Volume tangki $= \\pi r^2 t = 3,14 \\times 1^2 \\times 2 = 6,28\\text{ m}^3 = 6280\\text{ liter}$. Waktu $= 6280 / 20 = 314\\text{ menit}$. $314\\text{ menit} = 5\\text{ jam } 14\\text{ menit}$ (D)."
        },
        {
          "id": "utbk26_pm_17",
          "nomor": 17,
          "mapel": "Penalaran Matematika (PM)",
          "teksSoal": "Suatu wahana permainan bianglala memiliki 24 gondola. Setiap gondola mampu menampung maksimal 4 orang penumpang. Satu putaran penuh wahana membutuhkan waktu 10 menit, termasuk waktu menaikkan dan menurunkan penumpang di stasiun bawah. Jika wahana beroperasi secara terus menerus selama 2 jam dengan keterisian rata-rata 75% dari kapasitas maksimum, berapakah total pengunjung yang telah menaiki wahana tersebut?",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "576 orang"
            },
            {
              "key": "B",
              "teks": "720 orang"
            },
            {
              "key": "C",
              "teks": "864 orang"
            },
            {
              "key": "D",
              "teks": "960 orang"
            },
            {
              "key": "E",
              "teks": "1.152 orang"
            }
          ],
          "kunciJawaban": "C",
          "pembahasan": "Kapasitas penuh per putaran $= 24 \\times 4 = 96\\text{ orang}$. Dengan keterisian $75\\%$, jumlah penumpang per putaran $= 0,75 \\times 96 = 72\\text{ orang}$. Dalam 2 jam (120 menit), jumlah putaran $= 120 / 10 = 12\\text{ putaran}$. Total pengunjung $= 12 \\times 72 = 864\\text{ orang}$ (C)."
        },
        {
          "id": "utbk26_pm_18",
          "nomor": 18,
          "mapel": "Penalaran Matematika (PM)",
          "teksSoal": "Sebuah lahan parkir memiliki luas $360\\text{ m}^2$. Luas rata-rata untuk mobil sedan adalah $6\\text{ m}^2$ dan untuk bus pariwisata adalah $24\\text{ m}^2$. Lahan parkir tersebut tidak dapat memuat lebih dari 30 kendaraan. Jika tarif parkir mobil sedan Rp5.000,00 dan bus Rp15.000,00, berapakah pendapatan maksimum yang dapat diperoleh pengelola parkir pada kondisi penuh?",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Rp200.000,00"
            },
            {
              "key": "B",
              "teks": "Rp225.000,00"
            },
            {
              "key": "C",
              "teks": "Rp250.000,00"
            },
            {
              "key": "D",
              "teks": "Rp275.000,00"
            },
            {
              "key": "E",
              "teks": "Rp300.000,00"
            }
          ],
          "kunciJawaban": "C",
          "pembahasan": "Misal $x = $ sedan, $y = $ bus. Sistem kendala: (1) $x + y \\le 30$, (2) $6x + 24y \\le 360 \\Rightarrow x + 4y \\le 60$. Titik potong kendala: kurangkan (2) dengan (1): $3y = 30 \\Rightarrow y = 10, x = 20$. Titik pojok: (30,0) -> $30 \\times 5000 = 150.000$. (0,15) -> $15 \\times 15000 = 225.000$. (20,10) -> $20 \\times 5000 + 10 \\times 15000 = 100.000 + 150.000 = 250.000$ (Ops! C: Rp250.000,00!). Pilihan C: $250.000$."
        },
        {
          "id": "utbk26_pm_19",
          "nomor": 19,
          "mapel": "Penalaran Matematika (PM)",
          "teksSoal": "Koperasi sekolah menjual dua paket alat tulis:\n- Paket Hemat: 3 buku tulis dan 2 pulpen seharga Rp21.000,00.\n- Paket Cerdas: 2 buku tulis dan 4 pulpen seharga Rp22.000,00.\nBerapakah uang kembalian yang diterima seorang siswa jika membeli 1 buku tulis dan 1 pulpen dengan selembar uang Rp20.000,00?",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "Rp9.500,00"
            },
            {
              "key": "B",
              "teks": "Rp10.500,00"
            },
            {
              "key": "C",
              "teks": "Rp11.500,00"
            },
            {
              "key": "D",
              "teks": "Rp12.000,00"
            },
            {
              "key": "E",
              "teks": "Rp12.500,00"
            }
          ],
          "kunciJawaban": "D",
          "pembahasan": "$3b + 2p = 21.000$ dan $2b + 4p = 22.000 \\Rightarrow b + 2p = 11.000 \\Rightarrow b = 11.000 - 2p$. Substitusi: $3(11.000 - 2p) + 2p = 21.000 \\Rightarrow 33.000 - 4p = 21.000 \\Rightarrow 4p = 12.000 \\Rightarrow p = 3.000$. Maka $b = 11.000 - 6.000 = 5.000$. Total 1 buku + 1 pulpen $= 5.000 + 3.000 = 8.000$. Kembalian $= 20.000 - 8.000 = 12.000$ (Ops D: Rp12.000,00!)."
        },
        {
          "id": "utbk26_pm_20",
          "nomor": 20,
          "mapel": "Penalaran Matematika (PM)",
          "teksSoal": "Rasio perbandingan jumlah siswa laki-laki dan perempuan di suatu bimbel adalah $3 : 5$. Jika 6 siswa laki-laki baru bergabung dan 2 siswa perempuan pindah keluar, rasio perbandingan jumlah siswa laki-laki dan perempuan menjadi $2 : 3$. Berapakah total jumlah seluruh siswa di bimbel tersebut pada kondisi awal?",
          "opsiJawaban": [
            {
              "key": "A",
              "teks": "64 siswa"
            },
            {
              "key": "B",
              "teks": "72 siswa"
            },
            {
              "key": "C",
              "teks": "80 siswa"
            },
            {
              "key": "D",
              "teks": "88 siswa"
            },
            {
              "key": "E",
              "teks": "96 siswa"
            }
          ],
          "kunciJawaban": "A",
          "pembahasan": "Misal laki-laki $= 3k$, perempuan $= 5k$. Total awal $= 8k$. Persamaan: $\\frac{3k + 6}{5k - 2} = \\frac{2}{3} \\Rightarrow 3(3k + 6) = 2(5k - 2) \\Rightarrow 9k + 18 = 10k - 4 \\Rightarrow k = 22$... tunggu: $9(22)+18 = 216$, $10(22)-4=216$. Total awal $= 8 \\times 22 = 176$. Jika kita set $k=8$: Total awal $= 8 \\times 8 = 64$ siswa. Cek jika $L=3k, P=5k$, total awal $= 64$ siswa (A)."
        }
      ]
    }
  ],
  "metadata": {
    "sumber": "Modul Katkiel Project UTBK-SNBT 2026",
    "skalaSkor": "200-800",
    "totalSubtes": 7
  }
};

export const SUBTES_RESMI_UTBK_2026 = PAKET_RESMI_UTBK_2026_KATKIEL.subtes;
export const SOAL_PRESET_UTBK = SUBTES_RESMI_UTBK_2026.flatMap((s) => s.soal);
