#!/usr/bin/env python3
"""
generate_pm_modul.py
Generates pmModul.js (9 bab) for Penalaran Matematika.
"""
import os
import json

MODUL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'data', 'modul')
os.makedirs(MODUL_DIR, exist_ok=True)

PM_DATA = [
    {
        "id": "pm-aritmetika-sosial-dan-pemodelan",
        "babNumber": 1,
        "slug": "pm-aritmetika-sosial-dan-pemodelan",
        "subtestKode": "PM",
        "judul": "Aritmetika Sosial: Diskon Bertingkat, Margin & Pajak",
        "durasiBacaMenit": 14,
        "ringkasanSingkat": "Pemodelan transaksi keuangan: diskon bertingkat (50% + 20%), margin keuntungan terhadap harga beli vs harga jual, PPN 11%, dan bunga bank tunggal/majemuk.",
        "learningObjectives": [
            "Menghitung harga akhir setelah diskon bertingkat secara tepat tanpa terjebak menjumlahkan persentase (50% + 20% ≠ 70%).",
            "Membedakan margin laba terhadap harga pokok penjualan (HPP) dengan margin terhadap omzet.",
            "Menghitung pengaruh Pajak Pertambahan Nilai (PPN 11%) pada nota transaksi ritel.",
            "Menghitung saldo akhir tabungan dengan bunga tunggal dan bunga majemuk berkala."
        ],
        "konsepTeori": [
            {
                "subjudul": "1. Jebakan Diskon Bertingkat (d1% + d2%)",
                "isi": "Diskon '50% + 20%' BUKAN diskon 70%! Diskon kedua dihitung DARI HARGA SETELAH DISKON PERTAMA.\nRumus Pengali Cepat: Harga Akhir = Harga Awal × (1 - d1/100) × (1 - d2/100).\nContoh: Diskon 50% + 20% → Harga Akhir = H × 0,5 × 0,8 = 0,4 H (Diskon riilnya adalah 60%, bukan 70%!).",
                "poinPenting": [
                    "Diskon riil total = d1 + d2 - (d1 × d2 / 100)."
                ]
            },
            {
                "subjudul": "2. Untung, Rugi, dan Persentase Margin",
                "isi": "- Untung = Harga Jual (HJ) - Harga Beli (HB).\n- % Untung = (Untung / HB) × 100% (standar akuntansi berpatokan pada harga beli).\n- HJ = HB × (1 + %Untung / 100).",
                "poinPenting": [
                    "Jika rugi r%: HJ = HB × (1 - r/100)."
                ]
            }
        ],
        "trikCepat": "Rumus Kilat Diskon Bertingkat d1 + d2: Diskon Nyata = d1 + d2 - (d1 × d2 / 100). Contoh: diskon 30% + 10% = 30 + 10 - (30×10/100) = 40 - 3 = 37%!",
        "jebakanUmum": "Menjumlahkan langsung persentase diskon ganda (mengira diskon 50% + 20% sama dengan 70%).",
        "contohSoal": [
            {
                "soal": "Sebuah jaket berlabel harga Rp500.000,00 mendapat promo diskon bertingkat 40% + 10%. Berapakah uang yang harus dibayar pembeli di kasir?",
                "opsi": {
                    "A": "Rp225.000,00",
                    "B": "Rp250.000,00",
                    "C": "Rp270.000,00",
                    "D": "Rp300.000,00",
                    "E": "Rp350.000,00"
                },
                "kunci": "C",
                "pembahasanLangkah": [
                    "Gunakan faktor pengali:\nFaktor 1: (1 - 0,40) = 0,60.\nFaktor 2: (1 - 0,10) = 0,90.",
                    "Faktor pengali total = 0,60 × 0,90 = 0,54 (pembeli membayar 54% dari harga label).",
                    "Harga kasir = Rp500.000,00 × 0,54 = Rp270.000,00.",
                    "(Cara bertahap: Diskon 40% dari 500rb = 200rb → harga jadi 300rb. Diskon kedua 10% dari 300rb = 30rb → harga akhir 300rb - 30rb = 270rb).",
                    "Maka jawabannya adalah Rp270.000,00 (C)."
                ]
            }
        ],
        "kuisPemahaman": [
            {
                "id": "pm-1-q1",
                "soal": "Diskon bertingkat '20% + 20%' setara dengan diskon tunggal sebesar...",
                "opsi": [
                    {"label": "A", "text": "40%"},
                    {"label": "B", "text": "38%"},
                    {"label": "C", "text": "36%"},
                    {"label": "D", "text": "34%"},
                    {"label": "E", "text": "32%"}
                ],
                "kunci": "C",
                "pembahasan": "Diskon tunggal = 20 + 20 - (20 × 20 / 100) = 40 - 4 = 36% (C)."
            },
            {
                "id": "pm-1-q2",
                "soal": "Seorang pedagang menjual sepatu seharga Rp360.000,00 dan meraup keuntungan 20% dari harga belinya. Harga beli sepatu tersebut adalah...",
                "opsi": [
                    {"label": "A", "text": "Rp288.000,00"},
                    {"label": "B", "text": "Rp300.000,00"},
                    {"label": "C", "text": "Rp310.000,00"},
                    {"label": "D", "text": "Rp320.000,00"},
                    {"label": "E", "text": "Rp330.000,00"}
                ],
                "kunci": "B",
                "pembahasan": "HJ = HB × (1 + 0,20) = 1,20 HB. 360.000 = 1,20 HB → HB = 360.000 / 1,2 = Rp300.000,00 (B)."
            },
            {
                "id": "pm-1-q3",
                "soal": "Sebuah kafe mengenakan biaya makanan Rp150.000,00 sebelum pajak. Jika dikenakan PPN 11% dan biaya layanan (service charge) 5% dari harga makanan, total tagihan yang harus dibayar adalah...",
                "opsi": [
                    {"label": "A", "text": "Rp166.500,00"},
                    {"label": "B", "text": "Rp174.000,00"},
                    {"label": "C", "text": "Rp175.500,00"},
                    {"label": "D", "text": "Rp180.000,00"},
                    {"label": "E", "text": "Rp182.500,00"}
                ],
                "kunci": "B",
                "pembahasan": "Total biaya tambahan = 11% (pajak) + 5% (layanan) = 16% dari Rp150.000. Tambahan = 0,16 × 150.000 = Rp24.000. Total tagihan = 150.000 + 24.000 = Rp174.000,00 (B)."
            },
            {
                "id": "pm-1-q4",
                "soal": "Modal awal sebesar Rp10.000.000,00 ditabung di bank dengan sistem bunga tunggal 6% per tahun. Total tabungan setelah 3 tahun adalah...",
                "opsi": [
                    {"label": "A", "text": "Rp11.800.000,00"},
                    {"label": "B", "text": "Rp11.910.160,00"},
                    {"label": "C", "text": "Rp12.000.000,00"},
                    {"label": "D", "text": "Rp12.500.000,00"},
                    {"label": "E", "text": "Rp13.000.000,00"}
                ],
                "kunci": "A",
                "pembahasan": "Bunga tunggal = M × i × t = 10.000.000 × 6% × 3 = Rp1.800.000. Total saldo = 10.000.000 + 1.800.000 = Rp11.800.000,00 (A)."
            },
            {
                "id": "pm-1-q5",
                "soal": "Sebuah barang dibeli seharga Rp80.000,00 dan dijual seharga Rp72.000,00. Persentase kerugian yang dialami adalah...",
                "opsi": [
                    {"label": "A", "text": "8%"},
                    {"label": "B", "text": "9%"},
                    {"label": "C", "text": "10%"},
                    {"label": "D", "text": "11%"},
                    {"label": "E", "text": "12%"}
                ],
                "kunci": "C",
                "pembahasan": "Rugi = 80.000 - 72.000 = Rp8.000. % Rugi = (8.000 / 80.000) × 100% = 10% (C)."
            }
        ],
        "keyTakeaways": [
            "Rumus diskon ganda: d_total = d1 + d2 - (d1×d2/100).",
            "Harga jual untung: HJ = HB × (1 + %untung).",
            "Perhitungan persentase margin selalu mengacu pada Harga Beli (modal dasar).",
            "Bunga tunggal: B = M × i × t."
        ],
        "rekomendasiLatihan": "Latih simulasi aritmetika sosial di Penalaran Matematika Gemilang."
    },
    {
        "id": "pm-perbandingan-dan-skala",
        "babNumber": 2,
        "slug": "pm-perbandingan-dan-skala",
        "subtestKode": "PM",
        "judul": "Perbandingan Senilai, Berbalik Nilai & Laju Kerja Bersama",
        "durasiBacaMenit": 14,
        "ringkasanSingkat": "Menyelesaikan masalah perbandingan senilai (bahan bakar, resep, skala peta) dan berbalik nilai (pekerja bangunan, kecepatan tempuh), serta rumus laju kerja 1/T = 1/t1 + 1/t2.",
        "learningObjectives": [
            "Mengidentifikasi apakah suatu masalah nyata tergolong senilai atau berbalik nilai.",
            "Menghitung waktu penyelesaian proyek renovasi saat jumlah pekerja ditambah atau dikurangi.",
            "Menghitung waktu kerja gabungan dua atau tiga orang (1/T = 1/A + 1/B).",
            "Menyelesaikan kasus proyek terhenti beberapa hari menggunakan konsep sisa hari kerja."
        ],
        "konsepTeori": [
            {
                "subjudul": "1. Senilai vs Berbalik Nilai",
                "isi": "- Perbandingan Senilai: Jika variabel A naik, variabel B ikut naik (a1 / b1 = a2 / b2). Contoh: bensin dan jarak tempuh, jumlah porsi dan takaran terigu.\n- Perbandingan Berbalik Nilai: Jika variabel A naik, variabel B justru turun (a1 × b1 = a2 × b2). Contoh: jumlah pekerja dan waktu penyelesaian, kecepatan dan durasi perjalanan.",
                "poinPenting": [
                    "Beban Pekerja = Jumlah Pekerja × Jumlah Hari (konstan)."
                ]
            },
            {
                "subjudul": "2. Kasus Proyek Terhenti (Trik Sisa Beban)",
                "isi": "Jika proyek dijadwalkan H hari oleh P pekerja, tapi setelah berjalan d hari proyek terhenti selama s hari:\nSisa beban hari = (H - d) hari dengan P pekerja.\nSisa hari yang tersedia = (H - d - s) hari.\nJumlah pekerja yang dibutuhkan P_baru = [P × (H - d)] / (H - d - s).\nTambahan pekerja = P_baru - P.",
                "poinPenting": [
                    "Rumus kilat tambahan pekerja: Tambahan = (P × s) / (H - d - s)."
                ]
            }
        ],
        "trikCepat": "Rumus Kilat Tambahan Pekerja Saat Libur/Mogok: Tambahan Pekerja = (Pekerja Mula × Hari Libur) / (Sisa Hari Efektif). Selesai dalam 15 detik tanpa menghitung total orang-hari!",
        "jebakanUmum": "Membagi sisa pekerjaan dengan total hari semula, bukan dengan sisa hari yang masih ada.",
        "contohSoal": [
            {
                "soal": "Suatu proyek jembatan direncanakan selesai dalam 30 hari oleh 15 pekerja. Setelah dikerjakan selama 10 hari, pekerjaan terhenti selama 5 hari karena cuaca buruk. Agar proyek tetap selesai tepat waktu, berapa pekerja tambahan yang harus direkrut?",
                "opsi": {
                    "A": "3 orang",
                    "B": "5 orang",
                    "C": "7 orang",
                    "D": "8 orang",
                    "E": "10 orang"
                },
                "kunci": "B",
                "pembahasanLangkah": [
                    "Gunakan trik kilat tambahan pekerja:\nTambahan = (Pekerja Mula × Hari Libur) / Sisa Hari Tersedia.",
                    "Pekerja Mula = 15 orang. Hari Libur (s) = 5 hari.",
                    "Sisa Hari Tersedia = Total Hari (30) - Hari Berjalan (10) - Hari Libur (5) = 15 hari.",
                    "Tambahan = (15 × 5) / 15 = 5 orang.",
                    "Maka diperlukan tambahan 5 pekerja (B)."
                ]
            }
        ],
        "kuisPemahaman": [
            {
                "id": "pm-2-q1",
                "soal": "Andi dapat mengecat sebuah dinding sendirian dalam 6 jam, sedangkan Budi dapat menyelesaikannya dalam 3 jam. Jika mereka mengecat dinding tersebut bersama-sama, waktu yang dibutuhkan adalah...",
                "opsi": [
                    {"label": "A", "text": "1,5 jam"},
                    {"label": "B", "text": "2 jam"},
                    {"label": "C", "text": "2,5 jam"},
                    {"label": "D", "text": "4 jam"},
                    {"label": "E", "text": "4,5 jam"}
                ],
                "kunci": "B",
                "pembahasan": "Rumus laju kerja bersama: 1/T = 1/6 + 1/3 = 1/6 + 2/6 = 3/6 = 1/2. Maka T = 2 jam (B)."
            },
            {
                "id": "pm-2-q2",
                "soal": "Sebuah mobil membutuhkan 8 liter bensin untuk menempuh jarak 96 km. Berapakah liter bensin yang dibutuhkan mobil tersebut untuk menempuh jarak 240 km?",
                "opsi": [
                    {"label": "A", "text": "18 liter"},
                    {"label": "B", "text": "20 liter"},
                    {"label": "C", "text": "22 liter"},
                    {"label": "D", "text": "24 liter"},
                    {"label": "E", "text": "25 liter"}
                ],
                "kunci": "B",
                "pembahasan": "Perbandingan senilai: Efisiensi = 96 km / 8 liter = 12 km/liter. Bensin yang dibutuhkan = 240 / 12 = 20 liter (B)."
            },
            {
                "id": "pm-2-q3",
                "soal": "Sebuah peternakan memiliki persediaan pakan yang cukup untuk 40 ekor sapi selama 15 hari. Jika peternak membeli lagi 10 ekor sapi, pakan tersebut akan habis dalam waktu...",
                "opsi": [
                    {"label": "A", "text": "10 hari"},
                    {"label": "B", "text": "12 hari"},
                    {"label": "C", "text": "14 hari"},
                    {"label": "D", "text": "16 hari"},
                    {"label": "E", "text": "18 hari"}
                ],
                "kunci": "B",
                "pembahasan": "Perbandingan berbalik nilai: 40 × 15 = (40 + 10) × H → 600 = 50 H → H = 600 / 50 = 12 hari (B)."
            },
            {
                "id": "pm-2-q4",
                "soal": "Pipa A dapat mengisi bak mandi sampai penuh dalam 20 menit, sedangkan pipa B dalam 30 menit. Jika kedua pipa dibuka bersama-sama, bak tersebut akan terisi penuh dalam...",
                "opsi": [
                    {"label": "A", "text": "10 menit"},
                    {"label": "B", "text": "12 menit"},
                    {"label": "C", "text": "15 menit"},
                    {"label": "D", "text": "18 menit"},
                    {"label": "E", "text": "25 menit"}
                ],
                "kunci": "B",
                "pembahasan": "1/T = 1/20 + 1/30 = (3 + 2)/60 = 5/60 = 1/12. Maka T = 12 menit (B)."
            },
            {
                "id": "pm-2-q5",
                "soal": "Pada sebuah peta dengan skala 1 : 250.000, jarak kota P dan Q adalah 6 cm. Jarak sebenarnya kedua kota tersebut adalah...",
                "opsi": [
                    {"label": "A", "text": "12 km"},
                    {"label": "B", "text": "15 km"},
                    {"label": "C", "text": "18 km"},
                    {"label": "D", "text": "20 km"},
                    {"label": "E", "text": "25 km"}
                ],
                "kunci": "B",
                "pembahasan": "Jarak nyata = 6 cm × 250.000 = 1.500.000 cm = 15 km (karena 1 km = 100.000 cm) (B)."
            }
        ],
        "keyTakeaways": [
            "Perbandingan senilai: a1/b1 = a2/b2.",
            "Perbandingan berbalik nilai: a1 × b1 = a2 × b2.",
            "Trik kilat tambahan pekerja: (P_mula × Libur) / Sisa Hari.",
            "Laju kerja bersama: 1/T = 1/t1 + 1/t2."
        ],
        "rekomendasiLatihan": "Latih ketangkasan soal kerja sama di paket Penalaran Matematika."
    },
    {
        "id": "pm-pengukuran-dan-konversi-satuan",
        "babNumber": 3,
        "slug": "pm-pengukuran-dan-konversi-satuan",
        "subtestKode": "PM",
        "judul": "Pengukuran Laju, Kecepatan Relatif, Debit & Konversi",
        "durasiBacaMenit": 13,
        "ringkasanSingkat": "Menyelesaikan masalah jarak-kecepatan-waktu (s = v × t), kasus saling berpapasan (arah berlawanan) dan menyusul (searah), serta debit aliran cairan (Q = V / t).",
        "learningObjectives": [
            "Mengonversi satuan kecepatan km/jam ke m/detik (kali 5/18) dan sebaliknya.",
            "Menghitung waktu dan jarak berpapasan saat dua kendaraan bergerak saling mendekat.",
            "Menghitung waktu menyusul saat kendaraan kedua berangkat lebih lambat tetapi lebih cepat.",
            "Menghitung volume air terbuang dari debit kebocoran tangki penampung."
        ],
        "konsepTeori": [
            {
                "subjudul": "1. Kecepatan Relatif (Berpapasan vs Menyusul)",
                "isi": "- Berpapasan (Berlawanan arah): Kecepatan relatif dijumlahkan! v_rel = v1 + v2. Waktu temu: t = Jarak Total / (v1 + v2).\n- Menyusul (Searah, berangkat menyusul selisih jarak Δs): Kecepatan relatif dikurangkan! v_rel = v2 - v1. Waktu susul: t = Selisih Jarak / (v2 - v1).",
                "poinPenting": [
                    "Konversi cepat: 1 km/jam = 1.000 m / 3.600 s = 5/18 m/s (72 km/jam = 20 m/s)."
                ]
            },
            {
                "subjudul": "2. Debit Aliran Cairan (Q)",
                "isi": "Q = Volume / Waktu (V / t) → Volume = Q × t. Satuan standar: liter/menit atau m³/detik (1 m³ = 1.000 liter).",
                "poinPenting": [
                    "Jika tangki diisi kran A (debit Q1) dan bocor di lubang bawah B (debit Q2), laju pertambahan volume bersih = Q1 - Q2."
                ]
            }
        ],
        "trikCepat": "Trik Konversi km/jam ke m/s: Cukup bagi dengan 3,6! Contoh: 90 km/jam = 90 / 3,6 = 25 m/s. Sebaliknya, dari m/s ke km/jam cukup dikalikan 3,6!",
        "jebakanUmum": "Lupa menghitung selisih jarak awal yang sudah ditempuh kendaraan pertama sebelum kendaraan kedua mulai berangkat.",
        "contohSoal": [
            {
                "soal": "Kota A dan B berjarak 180 km. Mobil X berangkat dari A menuju B dengan kecepatan 40 km/jam pada pukul 08.00. Pada saat yang sama, mobil Y berangkat dari B menuju A dengan kecepatan 50 km/jam. Pada pukul berapakah kedua mobil tersebut berpapasan di jalan?",
                "opsi": {
                    "A": "Pukul 09.30",
                    "B": "Pukul 09.45",
                    "C": "Pukul 10.00",
                    "D": "Pukul 10.15",
                    "E": "Pukul 10.30"
                },
                "kunci": "C",
                "pembahasanLangkah": [
                    "Karena bergerak saling berlawanan arah (berpapasan), kecepatan relatif dijumlahkan:\nv_rel = 40 + 50 = 90 km/jam.",
                    "Waktu temu t = Jarak Total / v_rel = 180 km / 90 km/jam = 2 jam.",
                    "Waktu berpapasan = 08.00 + 2 jam = pukul 10.00.",
                    "Maka kedua mobil berpapasan pukul 10.00 (C)."
                ]
            }
        ],
        "kuisPemahaman": [
            {
                "id": "pm-3-q1",
                "soal": "Sebuah mobil melaju dengan kecepatan 72 km/jam. Kecepatan mobil tersebut setara dengan...",
                "opsi": [
                    {"label": "A", "text": "15 m/detik"},
                    {"label": "B", "text": "20 m/detik"},
                    {"label": "C", "text": "25 m/detik"},
                    {"label": "D", "text": "30 m/detik"},
                    {"label": "E", "text": "36 m/detik"}
                ],
                "kunci": "B",
                "pembahasan": "72 km/jam = 72 / 3,6 = 20 m/detik (B)."
            },
            {
                "id": "pm-3-q2",
                "soal": "Dodi mengendarai motor dengan kecepatan 40 km/jam pada pukul 07.00. Kakaknya menyusul dari tempat yang sama pada pukul 07.30 dengan kecepatan 60 km/jam. Pada pukul berapakah sang kakak berhasil menyusul Dodi?",
                "opsi": [
                    {"label": "A", "text": "08.00"},
                    {"label": "B", "text": "08.15"},
                    {"label": "C", "text": "08.30"},
                    {"label": "D", "text": "08.45"},
                    {"label": "E", "text": "09.00"}
                ],
                "kunci": "C",
                "pembahasan": "Selisih waktu = 30 menit = 0,5 jam. Selisih jarak yang sudah ditempuh Dodi = 40 × 0,5 = 20 km. Kecepatan relatif menyusul = 60 - 40 = 20 km/jam. Waktu menyusul = Selisih Jarak / Kecepatan Relatif = 20 / 20 = 1 jam setelah kakak berangkat. Kakak berangkat 07.30 + 1 jam = pukul 08.30 (C)."
            },
            {
                "id": "pm-3-q3",
                "soal": "Sebuah selang air memiliki debit 12 liter/menit. Waktu yang diperlukan untuk mengisi bak mandi berkapasitas 240 liter sampai penuh adalah...",
                "opsi": [
                    {"label": "A", "text": "15 menit"},
                    {"label": "B", "text": "20 menit"},
                    {"label": "C", "text": "25 menit"},
                    {"label": "D", "text": "30 menit"},
                    {"label": "E", "text": "40 menit"}
                ],
                "kunci": "B",
                "pembahasan": "Waktu t = V / Q = 240 / 12 = 20 menit (B)."
            },
            {
                "id": "pm-3-q4",
                "soal": "Sebuah tandon penampungan air berisi 500 liter air mengalami kebocoran dengan debit 2,5 liter/menit. Jika tidak ada air yang ditambahkan, air di dalam tandon akan habis dalam waktu...",
                "opsi": [
                    {"label": "A", "text": "100 menit"},
                    {"label": "B", "text": "150 menit"},
                    {"label": "C", "text": "200 menit"},
                    {"label": "D", "text": "250 menit"},
                    {"label": "E", "text": "300 menit"}
                ],
                "kunci": "C",
                "pembahasan": "t = 500 / 2,5 = 200 menit (3 jam 20 menit) (C)."
            },
            {
                "id": "pm-3-q5",
                "soal": "Sebuah kereta api melaju menempuh jarak 300 km dalam waktu 3 jam 20 menit. Kecepatan rata-rata kereta api tersebut adalah...",
                "opsi": [
                    {"label": "A", "text": "80 km/jam"},
                    {"label": "B", "text": "85 km/jam"},
                    {"label": "C", "text": "90 km/jam"},
                    {"label": "D", "text": "95 km/jam"},
                    {"label": "E", "text": "100 km/jam"}
                ],
                "kunci": "C",
                "pembahasan": "3 jam 20 menit = 3 + 20/60 = 3 1/3 jam = 10/3 jam. Kecepatan v = s / t = 300 / (10/3) = 300 × 3 / 10 = 90 km/jam (C)."
            }
        ],
        "keyTakeaways": [
            "Berpapasan: t = s / (v1 + v2).",
            "Menyusul: t = selisih_jarak / (v2 - v1).",
            "Konversi km/jam ke m/s: bagi 3,6.",
            "Debit: V = Q × t."
        ],
        "rekomendasiLatihan": "Latih soal kinematika terapan di subtes Penalaran Matematika."
    },
    {
        "id": "pm-interpretasi-grafik-dan-data-terapan",
        "babNumber": 4,
        "slug": "pm-interpretasi-grafik-dan-data-terapan",
        "subtestKode": "PM",
        "judul": "Analisis Grafik Tren, Dinamika Pasar & Finansial",
        "durasiBacaMenit": 14,
        "ringkasanSingkat": "Membaca dinamika data finansial: titik impas (Break Even Point), kurva penawaran-permintaan, laju pertumbuhan majemuk tahunan (CAGR), dan tren kuartalan.",
        "learningObjectives": [
            "Menentukan titik impas (BEP): saat Pendapatan Total (TR) sama dengan Biaya Total (TC).",
            "Membaca titik ekuilibrium (keseimbangan pasar) antara fungsi permintaan dan penawaran.",
            "Menghitung selisih pertumbuhan antar-periode dari diagram garis berfluktuasi.",
            "Mengevaluasi keputusan investasi terbaik berdasarkan perbandingan rasio keuntungan."
        ],
        "konsepTeori": [
            {
                "subjudul": "1. Analisis Titik Impas (Break Even Point / BEP)",
                "isi": "- Biaya Total: TC = Biaya Tetap (FC) + Biaya Variabel (VC × Q).\n- Pendapatan Total: TR = Harga Jual (P) × Kuantitas (Q).\n- Titik Impas terjadi saat TR = TC → P × Q = FC + (VC × Q) → Q_BEP = FC / (P - VC).",
                "poinPenting": [
                    "Margin kontribusi per unit = P - VC."
                ]
            },
            {
                "subjudul": "2. Ekuilibrium Pasar (Keseimbangan)",
                "isi": "Keseimbangan harga terjadi pada perpotongan kurva permintaan Qd dan penawaran Qs (Qd = Qs). Di atas harga keseimbangan terjadi kelebihan pasokan (surplus), di bawah terjadi kelangkaan (shortage).",
                "poinPenting": [
                    "Pajak per unit menggeser kurva penawaran ke atas sebesar nilai pajak."
                ]
            }
        ],
        "trikCepat": "Rumus Kilat BEP Unit: Q = Biaya Tetap / (Harga Jual - Biaya Variabel per unit). Hafalkan rumus ini untuk menjawab soal BEP bisnis dalam 20 detik!",
        "jebakanUmum": "Menghitung BEP dengan membagi Biaya Tetap langsung dengan Harga Jual tanpa mengurangkan biaya variabel terlebih dahulu.",
        "contohSoal": [
            {
                "soal": "Sebuah UMKM minuman boba mengeluarkan biaya sewa tempat tetap Rp3.000.000,00 per bulan. Biaya bahan baku dan cup per gelas adalah Rp5.000,00, dan harga jual minuman ditetapkan Rp15.000,00 per gelas. Berapa gelas minuman boba yang harus terjual dalam sebulan agar UMKM mencapai titik impas (BEP)?",
                "opsi": {
                    "A": "200 gelas",
                    "B": "250 gelas",
                    "C": "300 gelas",
                    "D": "350 gelas",
                    "E": "400 gelas"
                },
                "kunci": "C",
                "pembahasanLangkah": [
                    "Biaya Tetap (FC) = Rp3.000.000,00.",
                    "Harga Jual (P) = Rp15.000,00. Biaya Variabel (VC) = Rp5.000,00.",
                    "Margin Kontribusi per gelas = 15.000 - 5.000 = Rp10.000,00.",
                    "Q_BEP = FC / Margin Kontribusi = 3.000.000 / 10.000 = 300 gelas.",
                    "Maka harus terjual minimal 300 gelas agar tidak rugi (C)."
                ]
            }
        ],
        "kuisPemahaman": [
            {
                "id": "pm-4-q1",
                "soal": "Jika kurva permintaan sebuah barang adalah Qd = 100 - 2P dan kurva penawarannya adalah Qs = 20 + 2P, maka harga keseimbangan pasar (P) adalah...",
                "opsi": [
                    {"label": "A", "text": "15"},
                    {"label": "B", "text": "20"},
                    {"label": "C", "text": "25"},
                    {"label": "D", "text": "30"},
                    {"label": "E", "text": "40"}
                ],
                "kunci": "B",
                "pembahasan": "Keseimbangan: Qd = Qs → 100 - 2P = 20 + 2P → 4P = 80 → P = 20 (B)."
            },
            {
                "id": "pm-4-q2",
                "soal": "Perusahaan meraup keuntungan jika jumlah unit yang diproduksi dan terjual...",
                "opsi": [
                    {"label": "A", "text": "Kurang dari BEP"},
                    {"label": "B", "text": "Tepat sama dengan BEP"},
                    {"label": "C", "text": "Lebih besar dari kuantitas BEP"},
                    {"label": "D", "text": "Sama dengan nol"},
                    {"label": "E", "text": "Selalu konstan setiap tahun"}
                ],
                "kunci": "C",
                "pembahasan": "Titik impas (BEP) adalah kondisi laba nol (TR = TC). Perusahaan mulai menghasilkan laba bersih positif saat kuantitas penjualan melampaui titik BEP (Q > Q_BEP) (C)."
            },
            {
                "id": "pm-4-q3",
                "soal": "Penjualan saham kuartal I bernilai 200 juta, kuartal II 250 juta, dan kuartal III 220 juta. Penurunan persentase penjualan dari kuartal II ke kuartal III adalah...",
                "opsi": [
                    {"label": "A", "text": "10%"},
                    {"label": "B", "text": "12%"},
                    {"label": "C", "text": "15%"},
                    {"label": "D", "text": "18%"},
                    {"label": "E", "text": "20%"}
                ],
                "kunci": "B",
                "pembahasan": "Penurunan = [(250 - 220) / 250] × 100% = (30 / 250) × 100% = 12% (B)."
            },
            {
                "id": "pm-4-q4",
                "soal": "Jika biaya total TC = 50.000 + 200Q, maka biaya tetap perusahaan tersebut adalah...",
                "opsi": [
                    {"label": "A", "text": "200"},
                    {"label": "B", "text": "50.000"},
                    {"label": "C", "text": "50.200"},
                    {"label": "D", "text": "250"},
                    {"label": "E", "text": "0"}
                ],
                "kunci": "B",
                "pembahasan": "Komponen yang tidak dipengaruhi kuantitas Q (konstanta bebas) adalah Biaya Tetap = 50.000 (B)."
            },
            {
                "id": "pm-4-q5",
                "soal": "Kondisi pasar saat harga barang berada di atas harga ekuilibrium adalah...",
                "opsi": [
                    {"label": "A", "text": "Terjadi kelebihan penawaran (surplus barang di pasar)"},
                    {"label": "B", "text": "Terjadi kelangkaan barang (shortage)"},
                    {"label": "C", "text": "Permintaan melonjak tak terhingga"},
                    {"label": "D", "text": "Harga akan terus melambung naik"},
                    {"label": "E", "text": "Produksi dihentikan seketika"}
                ],
                "kunci": "A",
                "pembahasan": "Saat harga terlalu tinggi (di atas keseimbangan), produsen ingin menjual lebih banyak (Qs tinggi) tetapi pembeli enggan membeli (Qd rendah), sehingga tercipta surplus stok barang (A)."
            }
        ],
        "keyTakeaways": [
            "Rumus BEP Unit = Biaya Tetap / (Harga Jual - Biaya Variabel per unit).",
            "Keseimbangan pasar terjadi saat Qd = Qs.",
            "Di atas titik BEP perusahaan mulai membukukan laba.",
            "Persentase perubahan selalu dihitung relatif terhadap nilai awal periode."
        ],
        "rekomendasiLatihan": "Latih analisis grafik pasar di modul Penalaran Matematika Gemilang."
    },
    {
        "id": "pm-geometri-terapan-dan-optimasi",
        "babNumber": 5,
        "slug": "pm-geometri-terapan-dan-optimasi",
        "subtestKode": "PM",
        "judul": "Geometri Terapan: Luas Bahan, Biaya & Optimasi",
        "durasiBacaMenit": 14,
        "ringkasanSingkat": "Aplikasi nyata geometri: menghitung kebutuhan kaleng cat dinding, luas ubin lantai keramik, optimasi luas tanah berpagar kawat, dan kapasitas penampungan air.",
        "learningObjectives": [
            "Menghitung kebutuhan kaleng cat dengan memperhitungkan luas pintu dan jendela yang tidak dicat.",
            "Menghitung jumlah ubin/keramik yang dibutuhkan untuk menutup lantai ruangan berukuran tertentu.",
            "Menerapkan konsep turunan / sifat parabola untuk memaksimumkan luas persegi panjang berpagar keliling tetap.",
            "Menghitung biaya pembuatan tangki air silinder berdasarkan harga pelat baja per meter persegi."
        ],
        "konsepTeori": [
            {
                "subjudul": "1. Perhitungan Kebutuhan Bahan Riil",
                "isi": "- Luas Cat Tembok = 2(p + l) × t - Luas Bukaan (pintu & jendela).\n- Jumlah kaleng cat = Luas Cat / Daya Sebar per kaleng (bulatkan selalu KE ATAS ke bilangan bulat terdekat).\n- Jumlah ubin = Luas Lantai / Luas 1 ubin (tambahkan cadangan pemotongan 5-10%).",
                "poinPenting": [
                    "Ingat: kaleng cat dan kardus ubin di toko selalu dibeli dalam satuan bilangan bulat utuh!"
                ]
            },
            {
                "subjudul": "2. Optimasi Luas Maksimum dengan Keliling Tetap",
                "isi": "Jika sebidang tanah persegi panjang dipagari kawat sepanjang K meter:\n- Jika dipagari 4 sisi: Luas MAKSIMUM tercapai saat tanah berbentuk BUJUR SANGKAR (s = K/4, Luas = s²).\n- Jika satu sisi menempel pada tembok sungai (hanya memagari 3 sisi: 2l + p = K): Luas maksimum tercapai saat p = K/2 dan l = K/4 (panjang dua kali lebar!).",
                "poinPenting": [
                    "Sifat optimasi ini sering keluar dalam bentuk soal cerita UTBK."
                ]
            }
        ],
        "trikCepat": "Trik Memagari 3 Sisi (Satu Sisi Tembok): Luas maksimum selalu tercapai saat PANJANG = 2 × LEBAR! Misal kawat 40 meter: 2l + p = 40 → lebar = 10 m, panjang = 20 m. Luas maks = 10 × 20 = 200 m²!",
        "jebakanUmum": "Lupa membulatkan ke atas saat menghitung jumlah kaleng cat (misal butuh 3,2 kaleng cat, siswa menjawab 3 kaleng, padahal harus beli 4 kaleng agar dinding tertutup sempurna!).",
        "contohSoal": [
            {
                "soal": "Seorang peternak memiliki kawat sepanjang 60 meter untuk memagari kandang ayam berbentuk persegi panjang. Salah satu sisi kandang menempel pada tembok gudang sehingga tidak memerlukan kawat. Luas maksimum kandang yang dapat dibuat adalah...",
                "opsi": {
                    "A": "300 m²",
                    "B": "400 m²",
                    "C": "450 m²",
                    "D": "500 m²",
                    "E": "600 m²"
                },
                "kunci": "C",
                "pembahasanLangkah": [
                    "Kawat 60 meter hanya untuk 3 sisi: 2 × lebar + panjang = 60.",
                    "Gunakan trik optimasi 3 sisi: panjang p = 2 × lebar l.",
                    "Substitusi: 2l + 2l = 60 → 4l = 60 → l = 15 meter.",
                    "Panjang p = 2 × 15 = 30 meter.",
                    "Luas maksimum = p × l = 30 × 15 = 450 m².",
                    "Maka luas maksimumnya adalah 450 m² (C)."
                ]
            }
        ],
        "kuisPemahaman": [
            {
                "id": "pm-5-q1",
                "soal": "Dinding kamar berukuran panjang 4 m, lebar 3 m, dan tinggi 3 m akan dicat. Terdapat satu pintu (1 m × 2 m) dan satu jendela (1 m × 1 m) yang tidak dicat. Jika 1 kaleng cat dapat mengecat 7 m² dinding, berapa kaleng cat minimal yang harus dibeli?",
                "opsi": [
                    {"label": "A", "text": "4 kaleng"},
                    {"label": "B", "text": "5 kaleng"},
                    {"label": "C", "text": "6 kaleng"},
                    {"label": "D", "text": "7 kaleng"},
                    {"label": "E", "text": "8 kaleng"}
                ],
                "kunci": "C",
                "pembahasan": "Luas 4 dinding = 2 × (4 + 3) × 3 = 2 × 7 × 3 = 42 m². Luas bukaan pintu dan jendela = (1×2) + (1×1) = 3 m². Luas yang dicat = 42 - 3 = 39 m². Kaleng cat = 39 / 7 = 5,57 kaleng. Karena cat dijual utuh per kaleng, pembeli minimal harus membeli 6 kaleng cat (C)."
            },
            {
                "id": "pm-5-q2",
                "soal": "Lantai ruangan berukuran 6 m × 4 m akan dipasangi ubin keramik persegi berukuran 40 cm × 40 cm. Jumlah ubin minimal yang dibutuhkan adalah...",
                "opsi": [
                    {"label": "A", "text": "100 buah"},
                    {"label": "B", "text": "120 buah"},
                    {"label": "C", "text": "150 buah"},
                    {"label": "D", "text": "180 buah"},
                    {"label": "E", "text": "200 buah"}
                ],
                "kunci": "C",
                "pembahasan": "Luas lantai = 600 cm × 400 cm = 240.000 cm². Luas satu ubin = 40 cm × 40 cm = 1.600 cm². Jumlah ubin = 240.000 / 1.600 = 150 buah (C)."
            },
            {
                "id": "pm-5-q3",
                "soal": "Keliling sebidang tanah persegi panjang yang dipagari penuh 4 sisi adalah 80 meter. Luas maksimum tanah tersebut adalah...",
                "opsi": [
                    {"label": "A", "text": "300 m²"},
                    {"label": "B", "text": "360 m²"},
                    {"label": "C", "text": "400 m²"},
                    {"label": "D", "text": "450 m²"},
                    {"label": "E", "text": "500 m²"}
                ],
                "kunci": "C",
                "pembahasan": "Luas 4 sisi maksimum terjadi saat berbentuk persegi (bujur sangkar): sisi s = 80 / 4 = 20 m. Luas maks = 20 × 20 = 400 m² (C)."
            },
            {
                "id": "pm-5-q4",
                "soal": "Sebuah bak mandi berbentuk balok tanpa tutup memiliki panjang 1 m, lebar 0,8 m, dan tinggi 0,6 m. Luas permukaan bagian dalam bak mandi yang perlu dipasangi keramik adalah...",
                "opsi": [
                    {"label": "A", "text": "2,46 m²"},
                    {"label": "B", "text": "2,96 m²"},
                    {"label": "C", "text": "3,16 m²"},
                    {"label": "D", "text": "3,76 m²"},
                    {"label": "E", "text": "1,96 m²"}
                ],
                "kunci": "B",
                "pembahasan": "Tanpa tutup: Luas = (p × l) + 2(p × t) + 2(l × t) = (1 × 0,8) + 2(1 × 0,6) + 2(0,8 × 0,6) = 0,8 + 1,2 + 0,96 = 2,96 m² (B)."
            },
            {
                "id": "pm-5-q5",
                "soal": "Kolam renang berukuran 10 m × 5 m dengan kedalaman rata-rata 1,5 meter akan diisi air hingga penuh. Volume air yang dibutuhkan adalah...",
                "opsi": [
                    {"label": "A", "text": "50.000 liter"},
                    {"label": "B", "text": "75.000 liter"},
                    {"label": "C", "text": "100.000 liter"},
                    {"label": "D", "text": "125.000 liter"},
                    {"label": "E", "text": "150.000 liter"}
                ],
                "kunci": "B",
                "pembahasan": "Volume = p × l × t = 10 × 5 × 1,5 = 75 m³. Karena 1 m³ = 1.000 liter, maka 75 m³ = 75.000 liter (B)."
            }
        ],
        "keyTakeaways": [
            "Optimasi 3 sisi: Panjang selalu dua kali Lebar.",
            "Optimasi 4 sisi: Luas maksimum selalu berbentuk Bujur Sangkar.",
            "Bulatkan kebutuhan bahan riil (cat, ubin) selalu ke atas.",
            "1 m³ air = 1.000 liter."
        ],
        "rekomendasiLatihan": "Latih soal optimasi geometri terapan di paket SNBT Gemilang."
    },
    {
        "id": "pm-statistika-dan-pengambilan-keputusan",
        "babNumber": 6,
        "slug": "pm-statistika-dan-pengambilan-keputusan",
        "subtestKode": "PM",
        "judul": "Statistika Inferensial & Pengambilan Keputusan Bisnis",
        "durasiBacaMenit": 13,
        "ringkasanSingkat": "Pemanfaatan indikator statistika (rata-rata, varians, standar deviasi) untuk memilih kandidat pelamar kerja terbaik, strategi produk, dan manajemen stok gudang.",
        "learningObjectives": [
            "Memilih opsi investasi dengan mempertimbangkan trade-off rata-rata return dan risiko (standar deviasi).",
            "Mengevaluasi konsistensi performa: varians rendah menunjukkan konsistensi tinggi.",
            "Menghitung skor gabungan berbobot (weighted composite score) untuk rekrutmen karyawan.",
            "Menganalisis anomali outlier data yang mendistorsi nilai rata-rata sampel."
        ],
        "konsepTeori": [
            {
                "subjudul": "1. Rata-Rata vs Variabilitas (Standar Deviasi)",
                "isi": "Dalam seleksi kandidat atau instrumen investasi:\n- Rata-rata tinggi = potensi hasil tinggi.\n- Standar deviasi rendah = risiko rendah, hasil stabil dan konsisten.\nJika dua kandidat memiliki rata-rata nilai sama, pilih kandidat dengan STANDAR DEVIASI LEBIH RENDAH karena performanya lebih stabil dan dapat diprediksi.",
                "poinPenting": [
                    "Koefisien Variasi (CV) = (Standar Deviasi / Rata-rata) × 100% (mengukur risiko per unit return)."
                ]
            },
            {
                "subjudul": "2. Skor Tertimbang (Weighted Scoring)",
                "isi": "Skor Akhir = w1 × S1 + w2 × S2 + w3 × S3 (dengan total bobot w1 + w2 + w3 = 100%).",
                "poinPenting": [
                    "Perhatikan bobot persentase masing-masing kriteria evaluasi."
                ]
            }
        ],
        "trikCepat": "Trik Seleksi Konsistensi: Saat soal menanyakan 'Kandidat yang paling konsisten performanya', JANGAN cari nilai tertinggi! Cari kandidat dengan RENTANG (JANGKAUAN) atau STANDAR DEVIASI TERKECIL!",
        "jebakanUmum": "Hanya melihat nilai rata-rata tertinggi tanpa memperhatikan standar deviasi yang sangat besar (fluktuasi ekstrem).",
        "contohSoal": [
            {
                "soal": "Dua mesin pemotong pipa diuji menghasilkan pipa berdiameter target 10 cm:\nMesin X: Rata-rata diameter 10,01 cm dengan standar deviasi 0,02 cm.\nMesin Y: Rata-rata diameter 10,02 cm dengan standar deviasi 0,08 cm.\nKeputusan manajer pabrik yang paling rasional berdasarkan data adalah...",
                "opsi": {
                    "A": "Memilih Mesin Y karena diameternya lebih besar",
                    "B": "Memilih Mesin X karena memiliki presisi dan konsistensi pemotongan yang jauh lebih tinggi",
                    "C": "Menolak kedua mesin karena tidak sempurna 10 cm",
                    "D": "Memilih Mesin Y karena variansnya lebih tinggi",
                    "E": "Kedua mesin menghasilkan kualitas produk yang identik"
                },
                "kunci": "B",
                "pembahasanLangkah": [
                    "Mesin X memiliki standar deviasi 0,02 cm, jauh lebih kecil dibandingkan Mesin Y (0,08 cm).",
                    "Standar deviasi kecil menunjukkan tingkat presisi tinggi dan variabilitas kesalahan yang sangat minim.",
                    "Selain itu rata-rata Mesin X (10,01) lebih mendekati target 10 cm dibanding Mesin Y (10,02).",
                    "Maka keputusan rasional adalah memilih Mesin X (B)."
                ]
            }
        ],
        "kuisPemahaman": [
            {
                "id": "pm-6-q1",
                "soal": "Kriteria penilaian seleksi beasiswa: Tes Akademik (bobot 50%), Wawancara (bobot 30%), dan Portofolio (bobot 20%). Seorang siswa memperoleh nilai Akademik 80, Wawancara 90, dan Portofolio 70. Nilai akhir siswa tersebut adalah...",
                "opsi": [
                    {"label": "A", "text": "80"},
                    {"label": "B", "text": "81"},
                    {"label": "C", "text": "82"},
                    {"label": "D", "text": "83"},
                    {"label": "E", "text": "85"}
                ],
                "kunci": "B",
                "pembahasan": "Nilai Akhir = (0,50 × 80) + (0,30 × 90) + (0,20 × 70) = 40 + 27 + 14 = 81 (B)."
            },
            {
                "id": "pm-6-q2",
                "soal": "Ukuran statistik manakah yang paling tahan (robust) terhadap keberadaan nilai pencilan ekstrem (outlier)?",
                "opsi": [
                    {"label": "A", "text": "Rata-rata (mean)"},
                    {"label": "B", "text": "Median"},
                    {"label": "C", "text": "Jangkauan (range)"},
                    {"label": "D", "text": "Varians"},
                    {"label": "E", "text": "Standar deviasi"}
                ],
                "kunci": "B",
                "pembahasan": "Median (nilai tengah) adalah ukuran pemusatan data yang paling tahan terhadap outlier karena tidak memperhitungkan besaran angka di ujung ekstrem (B)."
            },
            {
                "id": "pm-6-q3",
                "soal": "Jika seorang manajer ingin meminimalkan risiko dalam memilih pemasok bahan baku, ia harus memprioritaskan pemasok dengan...",
                "opsi": [
                    {"label": "A", "text": "Harga termahal"},
                    {"label": "B", "text": "Waktu pengiriman dengan varians terkecil (paling konsisten)"},
                    {"label": "C", "text": "Karyawan paling banyak"},
                    {"label": "D", "text": "Kantor cabang terbanyak"},
                    {"label": "E", "text": "Waktu pengiriman dengan standar deviasi terbesar"}
                ],
                "kunci": "B",
                "pembahasan": "Varians terkecil mencerminkan waktu pengiriman yang konsisten dan tepat waktu, meminimalkan risiko keterlambatan rantai pasok (B)."
            },
            {
                "id": "pm-6-q4",
                "soal": "Nilai rapor lima semester seorang siswa adalah: 80, 82, 85, 88, 90. Jangkauan (range) nilai siswa tersebut adalah...",
                "opsi": [
                    {"label": "A", "text": "5"},
                    {"label": "B", "text": "8"},
                    {"label": "C", "text": "10"},
                    {"label": "D", "text": "12"},
                    {"label": "E", "text": "15"}
                ],
                "kunci": "C",
                "pembahasan": "Jangkauan = Nilai Tertinggi - Nilai Terendah = 90 - 80 = 10 (C)."
            },
            {
                "id": "pm-6-q5",
                "soal": "Sebuah data distribusi simetris (kurva lonceng normal) memiliki rata-rata 75 dan standar deviasi 5. Sekitar 68% data terletak pada rentang nilai...",
                "opsi": [
                    {"label": "A", "text": "70 sampai 80"},
                    {"label": "B", "text": "65 sampai 85"},
                    {"label": "C", "text": "60 sampai 90"},
                    {"label": "D", "text": "75 sampai 80"},
                    {"label": "E", "text": "50 sampai 100"}
                ],
                "kunci": "A",
                "pembahasan": "Aturan empiris kurva normal (68-95-99.7 Rule): 68% data berada dalam rentang 1 standar deviasi dari rata-rata: (μ - σ) hingga (μ + σ) = (75 - 5) hingga (75 + 5) = 70 sampai 80 (A)."
            }
        ],
        "keyTakeaways": [
            "Standar deviasi rendah menunjukkan stabilitas dan konsistensi tinggi.",
            "Median kebal terhadap nilai pencilan (outlier) ekstrem.",
            "Skor komposit berbobot: kalikan masing-masing nilai dengan persentase bobotnya.",
            "Aturan empiris: 68% populasi normal berada di rentang ± 1 standar deviasi."
        ],
        "rekomendasiLatihan": "Selesaikan kuis statistika keputusan di portal belajar Gemilang."
    },
    {
        "id": "pm-peluang-terapan-dan-risiko",
        "babNumber": 7,
        "slug": "pm-peluang-terapan-dan-risiko",
        "subtestKode": "PM",
        "judul": "Probabilitas Terapan, Nilai Harapan & Manajemen Risiko",
        "durasiBacaMenit": 14,
        "ringkasanSingkat": "Konsep nilai harapan keuntungan finansial E(X) = Σ x·P(x), analisis risiko cacat mutu produksi (quality control), dan probabilitas kejadian bersyarat P(A|B).",
        "learningObjectives": [
            "Menghitung Nilai Harapan (Expected Value) dari skenario investasi berisiko.",
            "Mengevaluasi keputusan asuransi: apakah premi sebanding dengan ekspektasi kerugian.",
            "Menerapkan aturan peluang kejadian bebas: P(A ∩ B) = P(A) × P(B).",
            "Menghitung probabilitas cacat pada lini perakitan manufaktur bertingkat."
        ],
        "konsepTeori": [
            {
                "subjudul": "1. Nilai Harapan (Expected Value / E(X))",
                "isi": "E(X) = x1 × P(x1) + x2 × P(x2) + ... + xn × P(xn).\nJika E(X) > 0, keputusan investasi secara matematis menguntungkan dalam jangka panjang. Jika E(X) < 0, keputusan tersebut merugikan (contoh: judi kasino selalu memiliki E(X) < 0 untuk pemain).",
                "poinPenting": [
                    "Jangan pernah mengambil keputusan bisnis semata-mata dari potensi untung terbesar tanpa mengalikan dengan peluang terjadinya."
                ]
            },
            {
                "subjudul": "2. Peluang Kejadian Saling Bebas",
                "isi": "Dua sistem berjalan independen: kegagalan sistem utama P(A) = 0,05 dan cadangan P(B) = 0,05. Kegagalan total kedua sistem terjadi bersamaan jika P(A ∩ B) = 0,05 × 0,05 = 0,0025 (hanya 0,25%!).",
                "poinPenting": [
                    "Sistem cadangan (redundancy) memangkas risiko secara kuadratik."
                ]
            }
        ],
        "trikCepat": "Rumus Nilai Harapan Cepat: Kalikan masing-masing kemungkinan laba/rugi dengan probabilitasnya, lalu jumlahkan semuanya! Jika hasilnya positif, proyek layak dijalankan!",
        "jebakanUmum": "Lupa menyertakan tanda negatif (-) pada nilai kerugian saat menghitung Expected Value.",
        "contohSoal": [
            {
                "soal": "Sebuah perusahaan memiliki peluang 70% memenangkan tender dengan laba bersih Rp200.000.000,00, dan peluang 30% kalah dengan biaya riset hangus Rp50.000.000,00 (-Rp50 juta). Nilai harapan keuntungan (Expected Value) dari tender tersebut adalah...",
                "opsi": {
                    "A": "Rp110.000.000,00",
                    "B": "Rp125.000.000,00",
                    "C": "Rp140.000.000,00",
                    "D": "Rp150.000.000,00",
                    "E": "Rp175.000.000,00"
                },
                "kunci": "B",
                "pembahasanLangkah": [
                    "Laba saat menang: +Rp200 juta dengan probabilitas 0,70.",
                    "Rugi saat kalah: -Rp50 juta dengan probabilitas 0,30.",
                    "E(X) = (200.000.000 × 0,70) + (-50.000.000 × 0,30).",
                    "E(X) = 140.000.000 - 15.000.000 = Rp125.000.000,00.",
                    "Maka nilai harapan keuntungan adalah Rp125.000.000,00 (B)."
                ]
            }
        ],
        "kuisPemahaman": [
            {
                "id": "pm-7-q1",
                "soal": "Peluang sebuah bohlam lampu rusak selama perjalanan pengiriman adalah 2%. Jika dikirim 1.000 bohlam, perkiraan jumlah bohlam yang rusak adalah...",
                "opsi": [
                    {"label": "A", "text": "10 bohlam"},
                    {"label": "B", "text": "20 bohlam"},
                    {"label": "C", "text": "50 bohlam"},
                    {"label": "D", "text": "100 bohlam"},
                    {"label": "E", "text": "200 bohlam"}
                ],
                "kunci": "B",
                "pembahasan": "Frekuensi Harapan = n × P = 1.000 × 2% = 20 bohlam (B)."
            },
            {
                "id": "pm-7-q2",
                "soal": "Dua mesin produksi A dan B bekerja independen. Peluang mesin A mengalami mogok adalah 0,1 dan peluang mesin B mogok adalah 0,2. Peluang kedua mesin mogok bersamaan adalah...",
                "opsi": [
                    {"label": "A", "text": "0,02"},
                    {"label": "B", "text": "0,03"},
                    {"label": "C", "text": "0,28"},
                    {"label": "D", "text": "0,30"},
                    {"label": "E", "text": "0,002"}
                ],
                "kunci": "A",
                "pembahasan": "Kejadian saling bebas: P(A ∩ B) = P(A) × P(B) = 0,1 × 0,2 = 0,02 (2%) (A)."
            },
            {
                "id": "pm-7-q3",
                "soal": "Sebuah permainan melempar koin adil: jika muncul Angka pemain menang Rp10.000, jika muncul Gambar pemain kalah Rp8.000. Nilai harapan (expected value) pemain dalam satu lemparan adalah...",
                "opsi": [
                    {"label": "A", "text": "+Rp1.000"},
                    {"label": "B", "text": "+Rp2.000"},
                    {"label": "C", "text": "-Rp1.000"},
                    {"label": "D", "text": "Rp0 (adil)"},
                    {"label": "E", "text": "+Rp5.000"}
                ],
                "kunci": "A",
                "pembahasan": "E(X) = (0,5 × 10.000) + (0,5 × (-8.000)) = 5.000 - 4.000 = +Rp1.000 (A)."
            },
            {
                "id": "pm-7-q4",
                "soal": "Peluang siswa lulus tes tahap I adalah 0,8 dan peluang lulus tahap II setelah lolos tahap I adalah 0,7. Peluang seorang siswa lulus kedua tahap tersebut adalah...",
                "opsi": [
                    {"label": "A", "text": "0,56"},
                    {"label": "B", "text": "0,75"},
                    {"label": "C", "text": "0,15"},
                    {"label": "D", "text": "0,80"},
                    {"label": "E", "text": "0,50"}
                ],
                "kunci": "A",
                "pembahasan": "P(I ∩ II) = P(I) × P(II|I) = 0,8 × 0,7 = 0,56 (56%) (A)."
            },
            {
                "id": "pm-7-q5",
                "soal": "Peluang minimal satu mesin dari dua mesin cadangan berfungsi normal (jika peluang masing-masing rusak adalah 0,1 secara independen) adalah...",
                "opsi": [
                    {"label": "A", "text": "0,81"},
                    {"label": "B", "text": "0,90"},
                    {"label": "C", "text": "0,99"},
                    {"label": "D", "text": "0,95"},
                    {"label": "E", "text": "0,89"}
                ],
                "kunci": "C",
                "pembahasan": "Gunakan komplemen: P(minimal 1 normal) = 1 - P(kedua mesin rusak). Peluang keduanya rusak = 0,1 × 0,1 = 0,01. Maka P = 1 - 0,01 = 0,99 (99%) (C)."
            }
        ],
        "keyTakeaways": [
            "Expected Value: E(X) = Σ x·P(x).",
            "Kejadian saling bebas: P(A ∩ B) = P(A) × P(B).",
            "Trik komplemen keandalan: P(min 1 aktif) = 1 - P(semua gagal).",
            "Frekuensi harapan = n × P."
        ],
        "rekomendasiLatihan": "Latih kalkulasi nilai harapan dan manajemen risiko di Gemilang."
    },
    {
        "id": "pm-barisan-dan-deret-terapan",
        "babNumber": 8,
        "slug": "pm-barisan-dan-deret-terapan",
        "subtestKode": "PM",
        "judul": "Barisan & Deret Terapan: Pertumbuhan, Peluruhan & Anuitas",
        "durasiBacaMenit": 14,
        "ringkasanSingkat": "Aplikasi barisan aritmetika dan geometri: pertumbuhan populasi bakteri Mn = M0(1 + r)ⁿ, peluruhan radioaktif/depresiasi aset Mn = M0(1 - r)ⁿ, dan tabungan anuitas.",
        "learningObjectives": [
            "Menghitung pertumbuhan populasi eksponensial (bakteri membelah diri tiap t menit).",
            "Menghitung penyusutan nilai aset (depresiasi harga kendaraan) per tahun.",
            "Menghitung jumlah cicilan anuitas pinjaman berkala.",
            "Membedakan kapan menggunakan deret aritmetika vs deret geometri pada fenomena alam."
        ],
        "konsepTeori": [
            {
                "subjudul": "1. Model Pertumbuhan dan Peluruhan Geometrik",
                "isi": "- Pertumbuhan Eksponensial: M_n = M_0 × (1 + r)ⁿ (dengan r = laju pertumbuhan desimal).\n- Pembelahan Bakteri: Setiap t menit membelah menjadi k kali lipat: M_t = M_0 × k^(Waktu Total / t).\n- Peluruhan (Penyusutan Nilai Aset): M_n = M_0 × (1 - r)ⁿ.",
                "poinPenting": [
                    "Waktu paruh zat radioaktif: M_t = M_0 × (1/2)^(t / T_setengah)."
                ]
            },
            {
                "subjudul": "2. Barisan Aritmetika Terapan (Penambahan Tetap)",
                "isi": "Digunakan jika penambahan bersifat nominal konstan (misal: gaji naik Rp200.000 setiap tahun, kursi gedung bertambah 4 tiap baris).\n- Un = a + (n - 1)b\n- Sn = n/2 × (2a + (n - 1)b) = n/2 × (a + Un).",
                "poinPenting": [
                    "Kapasitas total gedung bioskop/stadion dihitung dengan Sn deret aritmetika."
                ]
            }
        ],
        "trikCepat": "Trik Pembelahan: Hitung frekuensi pembelahan n = (Waktu Total / Interval Pembelahan). Jumlah akhir = Populasi Awal × (Faktor Pembelahan)ⁿ!",
        "jebakanUmum": "Menghitung nilai n salah satu angka (misal pembelahan dari menit ke-0 ke menit ke-60 dengan interval 15 menit, ada 4 kali pembelahan, bukan 5 kali).",
        "contohSoal": [
            {
                "soal": "Sebuah bakteri membelah diri menjadi 2 setiap 15 menit. Jika pada awal pengamatan terdapat 20 bakteri, banyak bakteri setelah 1 jam adalah...",
                "opsi": {
                    "A": "80 bakteri",
                    "B": "160 bakteri",
                    "C": "320 bakteri",
                    "D": "640 bakteri",
                    "E": "1.280 bakteri"
                },
                "kunci": "C",
                "pembahasanLangkah": [
                    "Waktu total = 1 jam = 60 menit.",
                    "Banyak siklus pembelahan n = 60 / 15 = 4 kali.",
                    "Faktor pembelahan k = 2.",
                    "Populasi akhir = 20 × 2⁴ = 20 × 16 = 320 bakteri.",
                    "Maka ada 320 bakteri (C)."
                ]
            }
        ],
        "kuisPemahaman": [
            {
                "id": "pm-8-q1",
                "soal": "Harga sebuah mobil baru adalah Rp200.000.000,00. Setiap tahun nilainya menyusut 10% dari tahun sebelumnya. Harga mobil tersebut setelah 2 tahun adalah...",
                "opsi": [
                    {"label": "A", "text": "Rp160.000.000,00"},
                    {"label": "B", "text": "Rp162.000.000,00"},
                    {"label": "C", "text": "Rp170.000.000,00"},
                    {"label": "D", "text": "Rp180.000.000,00"},
                    {"label": "E", "text": "Rp150.000.000,00"}
                ],
                "kunci": "B",
                "pembahasan": "M2 = M0 × (1 - 0,10)² = 200.000.000 × (0,9)² = 200.000.000 × 0,81 = Rp162.000.000,00 (B)."
            },
            {
                "id": "pm-8-q2",
                "soal": "Gedung pertunjukan memiliki 15 baris kursi. Baris pertama berisi 20 kursi, dan setiap baris berikutnya bertambah 3 kursi dari baris di depannya. Total kapasitas kursi gedung tersebut adalah...",
                "opsi": [
                    {"label": "A", "text": "585 kursi"},
                    {"label": "B", "text": "600 kursi"},
                    {"label": "C", "text": "615 kursi"},
                    {"label": "D", "text": "630 kursi"},
                    {"label": "E", "text": "650 kursi"}
                ],
                "kunci": "C",
                "pembahasan": "Deret aritmetika: a = 20, b = 3, n = 15. S15 = 15/2 × [2(20) + (15 - 1)3] = 15/2 × [40 + 42] = 15/2 × 82 = 15 × 41 = 615 kursi (C)."
            },
            {
                "id": "pm-8-q3",
                "soal": "Suatu zat radioaktif meluruh dengan waktu paruh 4 hari. Jika mula-mula massa zat adalah 80 gram, sisa massa zat setelah 12 hari adalah...",
                "opsi": [
                    {"label": "A", "text": "5 gram"},
                    {"label": "B", "text": "10 gram"},
                    {"label": "C", "text": "20 gram"},
                    {"label": "D", "text": "40 gram"},
                    {"label": "E", "text": "2,5 gram"}
                ],
                "kunci": "B",
                "pembahasan": "Siklus peluruhan n = 12 / 4 = 3 kali. Sisa massa = 80 × (1/2)³ = 80 / 8 = 10 gram (B)."
            },
            {
                "id": "pm-8-q4",
                "soal": "Produksi pabrik sepatu bertambah secara tetap 50 pasang setiap bulan. Jika pada bulan pertama produksi 500 pasang, jumlah seluruh sepatu yang diproduksi selama satu tahun pertama adalah...",
                "opsi": [
                    {"label": "A", "text": "8.500 pasang"},
                    {"label": "B", "text": "9.000 pasang"},
                    {"label": "C", "text": "9.300 pasang"},
                    {"label": "D", "text": "9.600 pasang"},
                    {"label": "E", "text": "10.000 pasang"}
                ],
                "kunci": "C",
                "pembahasan": "n = 12 bulan, a = 500, b = 50. S12 = 12/2 × [2(500) + 11(50)] = 6 × [1.000 + 550] = 6 × 1.550 = 9.300 pasang (C)."
            },
            {
                "id": "pm-8-q5",
                "soal": "Sebuah bola dijatuhkan dari ketinggian 12 meter dan memantul kembali dengan ketinggian 2/3 dari tinggi sebelumnya secara terus-menerus hingga berhenti. Panjang lintasan total bola tersebut adalah...",
                "opsi": [
                    {"label": "A", "text": "36 meter"},
                    {"label": "B", "text": "48 meter"},
                    {"label": "C", "text": "60 meter"},
                    {"label": "D", "text": "72 meter"},
                    {"label": "E", "text": "84 meter"}
                ],
                "kunci": "C",
                "pembahasan": "Rumus kilat pantulan bola tak hingga: S_total = h × (b + a) / (b - a) untuk rasio a/b. Di sini h = 12 m, rasio = 2/3 (a=2, b=3). S_total = 12 × (3 + 2) / (3 - 2) = 12 × 5 / 1 = 60 meter (C)."
            }
        ],
        "keyTakeaways": [
            "Rumus kilat pantulan bola tak hingga: h × (b + a) / (b - a).",
            "Pertumbuhan: Mn = M0(1 + r)ⁿ ; Peluruhan: Mn = M0(1 - r)ⁿ.",
            "Waktu paruh zat: sisa = M0 × (1/2)ⁿ.",
            "Kapasitas kursi stadion/teater dihitung dengan Sn deret aritmetika."
        ],
        "rekomendasiLatihan": "Latih model pertumbuhan dan peluruhan di bank soal PM Gemilang."
    },
    {
        "id": "pm-kombinatorika-dan-penugasan",
        "babNumber": 9,
        "slug": "pm-kombinatorika-dan-penugasan",
        "subtestKode": "PM",
        "judul": "Kombinatorika Terapan: Rute Logistik, Penugasan & Shift",
        "durasiBacaMenit": 14,
        "ringkasanSingkat": "Menyelesaikan masalah jalur perjalanan jaringan (grid path), kombinasi tim perawat piket malam dengan batasan shift, dan alokasi tugas optimal.",
        "learningObjectives": [
            "Menghitung jumlah jalur terpendek pada peta kota kisi-kisi (grid path combination).",
            "Menghitung kombinasi tim kerja dengan syarat minimal anggota perempuan/senior.",
            "Menyelesaikan masalah penjadwalan shift kerja yang tidak boleh berturut-turut.",
            "Menghitung peluang pembagian kelompok tugas tanpa ada anggota yang terabaikan."
        ],
        "konsepTeori": [
            {
                "subjudul": "1. Kombinatorika Jalur Grid (Kisi-Kisi)",
                "isi": "Banyaknya rute terpendek dari titik asal (0,0) ke titik tujuan (m, n) pada jalan berpola kisi-kisi adalah:\nTotal langkah = m langkah ke kanan + n langkah ke atas = (m + n) langkah.\nBanyak jalur = (m + n)! / (m! × n!) = (m + n) C m.",
                "poinPenting": [
                    "Jika rute wajib melewati titik transit K(x, y), hitung: Jalur = (Rute ke K) × (Rute dari K ke Tujuan)."
                ]
            },
            {
                "subjudul": "2. Pembentukan Tim Bersyarat (Minimal/Maksimal)",
                "isi": "Jika sebuah tim beranggotakan 4 orang harus memuat minimal 1 wanita dari 5 pria dan 3 wanita:\nHitung via komplemen: Total Tim - Tim Tanpa Wanita (Semua Pria) = 8C4 - 5C4.",
                "poinPenting": [
                    "Teknik komplemen memangkas waktu dari 3 perhitungan kasus menjadi 1 perhitungan."
                ]
            }
        ],
        "trikCepat": "Trik Rute Grid Terpendek: Jika harus bergerak m langkah ke kanan dan n langkah ke atas, jawabannya SELALU (m + n) C m! Contoh: 3 blok ke kanan dan 2 blok ke atas → (3+2)C2 = 5C2 = 10 rute!",
        "jebakanUmum": "Lupa mengalikan jumlah rute sebelum titik transit dengan rute setelah titik transit (mengira dijumlahkan).",
        "contohSoal": [
            {
                "soal": "Dari 6 dokter dan 4 perawat akan dibentuk tim medis beranggotakan 4 orang untuk bertugas di posko bencana. Jika tim tersebut harus terdiri atas minimal 1 perawat, berapa banyak susunan tim yang dapat dibentuk?",
                "opsi": {
                    "A": "180 susunan",
                    "B": "195 susunan",
                    "C": "205 susunan",
                    "D": "210 susunan",
                    "E": "225 susunan"
                },
                "kunci": "B",
                "pembahasanLangkah": [
                    "Total orang = 6 dokter + 4 perawat = 10 orang.",
                    "Total semua kemungkinan tim 4 orang = 10C4 = (10 × 9 × 8 × 7) / (4 × 3 × 2 × 1) = 210.",
                    "Gunakan komplemen: Tim yang TIDAK memiliki perawat sama sekali (semuanya 4 dokter) = 6C4 = 6C2 = (6 × 5) / 2 = 15.",
                    "Tim dengan minimal 1 perawat = Total - Tim Semua Dokter = 210 - 15 = 195 susunan.",
                    "Maka jawabannya adalah 195 susunan (B)."
                ]
            }
        ],
        "kuisPemahaman": [
            {
                "id": "pm-9-q1",
                "soal": "Kurir ingin mengantar paket dari titik A ke titik B pada jaringan jalan kisi-kisi berukuran 4 blok ke timur dan 3 blok ke utara. Banyak rute terpendek yang dapat dilalui adalah...",
                "opsi": [
                    {"label": "A", "text": "21 rute"},
                    {"label": "B", "text": "28 rute"},
                    {"label": "C", "text": "35 rute"},
                    {"label": "D", "text": "42 rute"},
                    {"label": "E", "text": "48 rute"}
                ],
                "kunci": "C",
                "pembahasan": "Total langkah = 4 timur + 3 utara = 7 langkah. Banyak rute = 7C3 = (7 × 6 × 5) / (3 × 2 × 1) = 35 rute (C)."
            },
            {
                "id": "pm-9-q2",
                "soal": "Dari 5 orang staf IT dan 4 orang staf akuntansi akan dipilih tim proyek berjumlah 3 orang dengan syarat harus terdiri atas 2 staf IT dan 1 staf akuntansi. Banyak cara pemilihannya adalah...",
                "opsi": [
                    {"label": "A", "text": "30 cara"},
                    {"label": "B", "text": "40 cara"},
                    {"label": "C", "text": "50 cara"},
                    {"label": "D", "text": "60 cara"},
                    {"label": "E", "text": "80 cara"}
                ],
                "kunci": "B",
                "pembahasan": "Pilih 2 dari 5 IT: 5C2 = 10. Pilih 1 dari 4 Akuntansi: 4C1 = 4. Total kombinasi = 10 × 4 = 40 cara (B)."
            },
            {
                "id": "pm-9-q3",
                "soal": "Berapa banyak jabat tangan yang terjadi dalam sebuah ruangan rapat jika dihadiri oleh 12 orang dan setiap orang saling berjabat tangan tepat satu kali?",
                "opsi": [
                    {"label": "A", "text": "55 jabat tangan"},
                    {"label": "B", "text": "66 jabat tangan"},
                    {"label": "C", "text": "72 jabat tangan"},
                    {"label": "D", "text": "132 jabat tangan"},
                    {"label": "E", "text": "144 jabat tangan"}
                ],
                "kunci": "B",
                "pembahasan": "Jabat tangan melibatkan 2 orang: 12C2 = (12 × 11) / 2 = 66 jabat tangan (B)."
            },
            {
                "id": "pm-9-q4",
                "soal": "Sebuah restoran memiliki 4 pilihan hidangan pembuka, 5 hidangan utama, dan 3 hidangan penutup. Banyak paket menu lengkap yang dapat dipilih pelanggan adalah...",
                "opsi": [
                    {"label": "A", "text": "12 paket"},
                    {"label": "B", "text": "20 paket"},
                    {"label": "C", "text": "60 paket"},
                    {"label": "D", "text": "80 paket"},
                    {"label": "E", "text": "120 paket"}
                ],
                "kunci": "C",
                "pembahasan": "Aturan perkalian: 4 × 5 × 3 = 60 paket menu (C)."
            },
            {
                "id": "pm-9-q5",
                "soal": "Dari angka 0, 1, 2, 3, 4, 5 akan disusun kode PIN 4-digit yang boleh berulang. Banyak kode PIN yang dapat dibuat adalah...",
                "opsi": [
                    {"label": "A", "text": "360"},
                    {"label": "B", "text": "720"},
                    {"label": "C", "text": "1.080"},
                    {"label": "D", "text": "1.296"},
                    {"label": "E", "text": "1.500"}
                ],
                "kunci": "D",
                "pembahasan": "Ada 6 opsi angka untuk masing-masing dari 4 slot PIN (angka 0 boleh di depan untuk nomor PIN): 6 × 6 × 6 × 6 = 6⁴ = 1.296 kode (D)."
            }
        ],
        "keyTakeaways": [
            "Rute grid kisi-kisi terpendek: (m + n) C m.",
            "Tim bersyarat minimal 1: gunakan komplemen Total - Nol.",
            "Jabat tangan n orang: nC2 = n(n - 1) / 2.",
            "Rute transit berantai: kalikan rute tahap 1 dengan rute tahap 2."
        ],
        "rekomendasiLatihan": "Tuntaskan seluruh 46 bab modul UTBK-SNBT untuk persiapan prima!"
    }
]

with open(os.path.join(MODUL_DIR, 'pmModul.js'), 'w', encoding='utf-8') as f:
    f.write(f"""// src/data/modul/pmModul.js
// Modul Belajar UTBK-SNBT Bimbel Gemilang (AmbisPTN Standard)
// 100% UNLOCKED UNTUK SELURUH SISWA GEMILANG

export const PM_MODUL = {json.dumps(PM_DATA, indent=2, ensure_ascii=False)};
""")
print(f"✅ Generated pmModul.js with {len(PM_DATA)} bab.")
