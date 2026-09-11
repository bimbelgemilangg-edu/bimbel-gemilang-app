// src/data/bukuInteraktif.js
// KONTEN BUKU INTERAKTIF DIGITAL -- v1 statis.
// Tipe blok: 'p' | 'list' | 'math' | 'contoh' | 'tips'
// Tipe soal: 'pg' | 'multi' | 'bs'
// Field `visual` (opsional): 'termometer' | 'tabel' | 'garis' | 'gambar'

export const DAFTAR_BAB = [
    {
      id: 'bab-1',
      judul: 'Bilangan Bulat dan Pecahan',
      mapel: 'Matematika',
      jenjang: 'SMP/MTs',
      kelas: 9,
      emoji: '🔢',
      warna: '#4C6EF5',
      deskripsi: 'Hierarki operasi, sifat-sifat bilangan, dan operasi pecahan.',
      sections: [
        {
          id: 'bab-1-a',
          judul: 'A. Bilangan Bulat',
          blocks: [
            { tipe: 'p', teks: 'Bilangan bulat terdiri dari bilangan bulat positif, nol, dan bilangan bulat negatif. Himpunan bilangan bulat biasanya dinyatakan dengan simbol $\\mathbb{Z}$.' },
            { tipe: 'p', teks: 'Hierarki (urutan tingkatan) pada operasi bilangan:' },
            { tipe: 'list', items: [
              'Kerjakan operasi bilangan yang berada di dalam tanda kurung terlebih dahulu.',
              'Kerjakan bentuk perpangkatan / penarikan akar.',
              'Kerjakan bentuk perkalian / pembagian.',
              'Kerjakan bentuk penjumlahan / pengurangan.',
            ] },
            { tipe: 'contoh', teks: '$2 + 3 \\times 4 = 2 + 12 = 14$ (bukan $20$), karena perkalian dikerjakan lebih dulu. Sedangkan $(2 + 3) \\times 4 = 20$, karena isi kurung dikerjakan lebih dulu.' },
            { tipe: 'p', teks: 'Perubahan tanda pada operasi perkalian dan pembagian:' },
            { tipe: 'list', items: [
              'Bilangan bertanda sama jika dikalikan atau dibagi menghasilkan bilangan positif (+).',
              'Bilangan berbeda tanda jika dikalikan atau dibagi menghasilkan bilangan negatif (−).',
              'Operasi penjumlahan dan pengurangan tidak mengenali perubahan tanda.',
            ] },
            { tipe: 'contoh', teks: '$(-2) \\times (-3) = 6$ ; $(-12) : 3 = -4$ ; $-5 + (-3) = -8$.' },
          ],
        },
        {
          id: 'bab-1-b',
          judul: 'B. Sifat-sifat Bilangan Bulat',
          blocks: [
            { tipe: 'list', items: [
              'Tertutup terhadap penjumlahan dan perkalian: untuk $a, b$ bilangan bulat, hasil $a + b$ dan $a \\times b$ juga bilangan bulat.',
              'Komutatif (tukar tempat): $a + b = b + a$ dan $a \\times b = b \\times a$.',
              'Asosiatif (pengelompokan): $(a + b) + c = a + (b + c)$ dan $(a \\times b) \\times c = a \\times (b \\times c)$.',
              'Identitas: $a + 0 = 0 + a = a$ (0 faktor identitas penjumlahan); $a \\times 1 = 1 \\times a = a$ (1 faktor identitas perkalian).',
              'Invers: $a + (-a) = 0$ (invers penjumlahan dari $a$ adalah $-a$); $a \\times \\frac{1}{a} = 1$ (invers perkalian dari $a$ adalah $\\frac{1}{a}$).',
              'Distributif (penyebaran): $(a \\pm b) \\times c = (a \\times c) \\pm (b \\times c)$ dan $a \\times (b \\pm c) = (a \\times b) \\pm (a \\times c)$.',
              'Tidak ada pembagi nol: jika $a \\times b = 0$, maka $a = 0$ atau $b = 0$.',
            ] },
            { tipe: 'tips', teks: 'Saat ragu urutan operasi, ingat jembatan keledai: Ku-Ku-Ka-Ba (Kurung, Kuasa/akar, Kali-Bagi, Tambah-Kurang).' },
          ],
        },
        {
          id: 'bab-1-c',
          judul: 'C. Bilangan Pecahan',
          blocks: [
            { tipe: 'p', teks: 'Bilangan pecahan adalah bilangan yang dinyatakan dalam bentuk $\\frac{a}{b}$ atau a/b dengan $b \\neq 0$.' },
            { tipe: 'p', teks: '$a$ disebut pembilang dan $b$ disebut penyebut. Penyebut tidak boleh sama dengan nol karena pembagian dengan nol tidak terdefinisi.' },
          ],
        },
        {
          id: 'bab-1-d',
          judul: 'D. Sifat-sifat Pecahan',
          blocks: [
            { tipe: 'list', items: [
              '$\\frac{a}{b} = \\frac{a \\times c}{b \\times c}$, untuk $b \\neq 0$ dan $c \\neq 0$.',
              '$\\frac{-a}{b} = \\frac{a}{-b} = -\\frac{a}{b}$, untuk $b \\neq 0$.',
              '$\\frac{a}{b} \\times \\frac{c}{d} = \\frac{a \\times c}{b \\times d}$, untuk $b \\neq 0$ dan $d \\neq 0$.',
              '$\\frac{a}{b} : \\frac{c}{d} = \\frac{a}{b} \\times \\frac{d}{c} = \\frac{a \\times d}{b \\times c}$, untuk $b \\neq 0$ dan $\\frac{c}{d} \\neq 0$.',
              '$\\frac{a}{b} + \\frac{c}{b} = \\frac{a + c}{b}$ dan $\\frac{a}{b} - \\frac{c}{b} = \\frac{a - c}{b}$, untuk $b \\neq 0$.',
              '$\\frac{a}{a} = 1$, untuk $a, b \\neq 0$.',
              'Penyebut berbeda: $\\frac{a}{b} + \\frac{c}{d} = \\frac{ad + bc}{bd}$, untuk $b, d \\neq 0$.',
            ] },
            { tipe: 'tips', teks: 'Dua pecahan yang dijumlahkan harus disamakan penyebutnya dengan mencari KPK dari penyebut-penyebutnya.' },
            { tipe: 'contoh', teks: '$2\\frac{1}{3} + 5\\frac{1}{4} - 1\\frac{1}{2} = (2 + 5 - 1) + (\\frac{1}{3} + \\frac{1}{4} - \\frac{1}{2}) = 6 + \\frac{1}{12} = 6\\frac{1}{12}$.' },
          ],
        },
      ],
      ujiPemahaman: [
        { id: 'u1', tipe: 'pg', level: 'sedang', soal: 'Suhu di kaki gunung X (ketinggian 1.200 mdpl) adalah 14 °C. Suhu menurun 2 °C setiap ketinggian naik 300 m. Jika puncak gunung X berada di 3.900 mdpl, maka suhu di puncak adalah....', pilihan: ['2 °C', '0 °C', '−2 °C', '−4 °C'], benar: 3, pembahasan: 'Selisih ketinggian = 3.900 − 1.200 = 2.700 m; frekuensi penurunan = 2.700 : 300 = 9 kali; total penurunan = 9 × 2 = 18 °C; suhu puncak = 14 − 18 = −4 °C.' },
        { id: 'u2', tipe: 'pg', level: 'mudah', soal: 'Harga setengah kilogram cabe rawit hari ini Rp35.000,00. Jika Ibu membeli 2¼ kg, total harga yang harus dibayar adalah....', pilihan: ['Rp175.000,00', 'Rp157.500,00', 'Rp140.000,00', 'Rp87.500,00'], benar: 1, pembahasan: 'Harga 1 kg = 2 × 35.000 = 70.000; total = 9/4 × 70.000 = 157.500.' },
        { id: 'u3', tipe: 'pg', level: 'sedang', soal: 'Perhatikan data titik beku empat jenis cairan pada termometer berikut! Cairan yang memiliki titik beku paling rendah adalah....', visual: { tipe: 'termometer', data: [{ nama: 'Cairan A', nilai: -5 }, { nama: 'Cairan B', nilai: -12 }, { nama: 'Cairan C', nilai: 2 }, { nama: 'Cairan D', nilai: -8 }] }, pilihan: ['Cairan A', 'Cairan B', 'Cairan C', 'Cairan D'], benar: 1, pembahasan: '−12 < −8 < −5 < 2; titik beku paling rendah = Cairan B (−12 °C).' },
        { id: 'u4', tipe: 'pg', level: 'sedang', soal: 'Urutan dari terbesar ke terkecil untuk $1\\frac{1}{4}$; 1,3; 128%; $\\frac{6}{5}$ adalah....', pilihan: ['1,3; 128%; 6/5; 1¼', '1,3; 128%; 1¼; 6/5', '128%; 6/5; 1¼; 1,3', '128%; 1,3; 6/5; 1¼'], benar: 1, pembahasan: 'Desimal: 1,30 > 1,28 > 1,25 > 1,20.' },
        { id: 'u5', tipe: 'multi', level: 'sedang', soal: 'Manakah pernyataan operasi hitung berikut yang hasilnya benar? (pilih lebih dari satu)', pilihan: ['−12 + 15 : 0,5 − 10 = 8', '25 + (−20) × ¼ − 10 = 10', '18 + ((−12) : (−3)) − 15 = 7', '−20 − 10 × 10% + 15 = −4'], benar: [0, 1, 2], pembahasan: 'Pernyataan 4: −20 − 1 + 15 = −6, bukan −4. Pernyataan 1: −12 + 30 − 10 = 8 ✓; pernyataan 2: 25 − 5 − 10 = 10 ✓; pernyataan 3: 18 + 4 − 15 = 7 ✓.' },
        { id: 'u6', tipe: 'bs', level: 'sulit', soal: 'Peternakan ayam "Makmur" memiliki 500 ekor ayam; setiap hari satu ekor menghabiskan 120 gram pakan; pakan dikemas 50 kg per karung. Tentukan benar/salah:', pernyataan: ['Kebutuhan pakan untuk 1 ekor ayam selama 30 hari adalah 3,6 kg.', 'Seluruh ayam menghabiskan 60 kg pakan dalam satu hari.', 'Total pakan untuk 500 ekor selama 30 hari adalah 1,5 ton.', 'Peternak perlu membeli minimal 36 karung untuk persediaan 30 hari.'], benar: [true, true, false, true], pembahasan: 'P1: 120 × 30 = 3.600 g = 3,6 kg ✓. P2: 500 × 0,12 = 60 kg ✓. P3: 60 × 30 = 1.800 kg = 1,8 ton (bukan 1,5 ton) ✗. P4: 1.800 : 50 = 36 karung ✓.' },
        { id: 'u7', tipe: 'bs', level: 'sulit', soal: 'Kompetisi sains: 50 soal; benar +4, salah −1, tidak dijawab 0. Raka benar 38 dan salah 8. Tentukan benar/salah:', pernyataan: ['Banyak soal yang tidak dijawab Raka adalah 4 soal.', 'Skor yang diperoleh Raka dari jawaban benar adalah 152.', 'Total pengurangan skor akibat jawaban salah adalah 8 poin.', 'Total skor akhir Raka adalah 140.'], benar: [true, true, true, false], pembahasan: 'Tidak dijawab = 50 − 46 = 4 ✓; skor benar = 38 × 4 = 152 ✓; pengurangan = 8 × 1 = 8 ✓; skor akhir = 152 − 8 = 144 (bukan 140) ✗.' },
        { id: 'u8', tipe: 'bs', level: 'sulit', soal: 'Final lomba Sains diikuti empat siswa: Andi, Budi, Candra, dan Dewi. Perhatikan tabel skor berikut, lalu tentukan benar/salah setiap pernyataan:', visual: { tipe: 'tabel', caption: 'Hasil akhir skor (dari nilai sempurna)', kepala: ['Nama', 'Skor'], baris: [['Andi', '0,6'], ['Budi', '55%'], ['Candra', '2/3'], ['Dewi', '0,54']] }, pernyataan: ['Candra menempati urutan pertama karena memiliki skor tertinggi.', 'Skor yang diperoleh Budi lebih besar daripada skor Andi.', 'Urutan juara 1–4: Candra – Andi – Budi – Dewi.', 'Selisih skor antara Andi dan Dewi adalah 0,06.'], benar: [true, false, true, true], pembahasan: 'Desimal: 0,667 > 0,600 > 0,550 > 0,540. Budi (0,55) < Andi (0,60) jadi pernyataan 2 salah; selisih Andi−Dewi = 0,06 ✓.' },
        { id: 'u9', tipe: 'multi', level: 'mudah', soal: 'Manakah pembulatan ke puluhan terdekat yang benar? (pilih lebih dari satu)', pilihan: ['Perkiraan 512 + 376 adalah 890.', 'Perkiraan 943 − 218 adalah 720.', 'Perkiraan 1.267 + 511 adalah 1.770.', 'Perkiraan 854 − 322 adalah 530.'], benar: [0, 1, 3], pembahasan: '510 + 380 = 890 ✓; 940 − 220 = 720 ✓; 1.270 + 510 = 1.780 (bukan 1.770) ✗; 850 − 320 = 530 ✓.' },
        { id: 'u10', tipe: 'pg', level: 'mudah', soal: 'Suhu di dalam kulkas sebelum dihidupkan 22 °C. Setelah dinyalakan 4 jam suhunya menjadi −5 °C. Perbedaan suhu sebelum dan sesudah adalah....', pilihan: ['−27 °C', '−17 °C', '17 °C', '27 °C'], benar: 3, pembahasan: 'Perbedaan = 22 − (−5) = 27 °C.' },
        { id: 'u11', tipe: 'multi', level: 'sulit', soal: 'Suhu daging saat keluar kulkas −18 °C; setiap 2 menit direbus suhunya naik 3 °C. Pilih SEMUA pernyataan yang benar:', pilihan: ['Setelah 10 menit direbus, suhu daging sudah di atas 0 °C.', 'Total kenaikan suhu setelah 30 menit direbus adalah 45 °C.', 'Suhu akhir daging setelah 30 menit direbus adalah 27 °C.', 'Laju kenaikan suhu daging adalah 1,5 °C per menit.'], benar: [1, 2, 3], pembahasan: '10 menit: −18 + 15 = −3 °C (masih di bawah 0) ✗; 30 menit: 15 interval × 3 = 45 °C ✓; suhu akhir = −18 + 45 = 27 °C ✓; laju = 3 : 2 = 1,5 °C/menit ✓.' },
        { id: 'u12', tipe: 'bs', level: 'sulit', soal: 'Kompetisi Matematika: 40 soal; benar +4, salah −2, tidak dijawab −1. Tentukan benar/salah:', pernyataan: ['Rini mendapat skor 109 saat menjawab benar 31 dan salah 6.', 'Dahlia menjawab semua benar sehingga skornya di atas 200.', 'Dita dan Sinta berskor sama karena sama-sama salah 3 soal.'], benar: [true, false, false], pembahasan: 'Rini: 124 − 12 − 3 = 109 ✓; Dahlia: 40 × 4 = 160 (tidak di atas 200) ✗; Dita & Sinta: jumlah benar/kosong tidak diketahui ✗.' },
        { id: 'u13', tipe: 'pg', level: 'sedang', soal: 'Pak Budi membagi uang: anak ke-1 dapat 1/3 bagian, ke-2 1/4, ke-3 1/6, ke-4 setengah bagian anak pertama, sisa Rp4.000.000,00 disumbangkan. Jumlah uang Pak Budi semula....', pilihan: ['Rp12.000.000,00', 'Rp24.000.000,00', 'Rp36.000.000,00', 'Rp48.000.000,00'], benar: 3, pembahasan: 'Sisa = 1 − (4/12 + 3/12 + 2/12 + 2/12) = 1/12 bagian = 4 juta → total = 48 juta.' },
        { id: 'u14', tipe: 'pg', level: 'mudah', soal: 'Stok beras Ibu 2⅓ kg, dibeli lagi 5¼ kg, setelah dimasak 1½ kg. Persediaan beras Ibu tinggal....', pilihan: ['6 1/12 kg', '6 1/4 kg', '6 1/2 kg', '6 3/4 kg'], benar: 0, pembahasan: '(2 + 5 − 1) + (1/3 + 1/4 − 1/2) = 6 + 1/12 = 6 1/12 kg.' },
        { id: 'u15', tipe: 'pg', level: 'mudah', soal: 'Suhu kamar ber-AC 18 °C. Setelah AC dimatikan suhu naik 2 °C setiap menit. Suhu kamar setelah 4 menit adalah....', pilihan: ['24 °C', '26 °C', '29 °C', '31 °C'], benar: 1, pembahasan: '18 + (4 × 2) = 26 °C.' },
        { id: 'u16', tipe: 'pg', level: 'mudah', soal: 'Ibu membeli 30 kg gula; 1/3 bagian untuk nenek, 1/4 bagian untuk kue, sisanya dibungkus plastik @ ½ kg. Banyak plastik yang diperlukan....', pilihan: ['20 biji', '25 biji', '30 biji', '35 biji'], benar: 1, pembahasan: 'Sisa = (1 − 1/3 − 1/4) × 30 = 5/12 × 30 = 12,5 kg; plastik = 12,5 : 0,5 = 25 biji.' },
        { id: 'u17', tipe: 'pg', level: 'sulit', soal: 'Pukul 07.00 suhu Semarang = Surabaya = 24 °C. Semarang naik 1 °C tiap 20 menit; Surabaya naik 2 °C tiap 30 menit. Selisih suhu keduanya pukul 09.00 adalah....', pilihan: ['0 °C', '1 °C', '2 °C', '3 °C'], benar: 2, pembahasan: 'Semarang: 120/20 = 6 kali × 1 = +6 → 30 °C; Surabaya: 120/30 = 4 kali × 2 = +8 → 32 °C; selisih = 2 °C.' },
      ],
    },
    {
      id: 'bab-2',
      judul: 'Bilangan Berpangkat dan Bentuk Akar',
      mapel: 'Matematika',
      jenjang: 'SMP/MTs',
      kelas: 9,
      emoji: '📐',
      warna: '#0D9488',
      deskripsi: 'Eksponen, sifat-sifat pangkat, bentuk akar, dan merasionalkan penyebut.',
      sections: [
        {
          id: 'bab-2-a',
          judul: 'A. Bilangan Berpangkat',
          blocks: [
            { tipe: 'p', teks: 'Perpangkatan merupakan perkalian berulang dari sebuah bilangan dengan bilangan itu sendiri.' },
            { tipe: 'p', teks: 'Definisi: "$a^n$" ("a pangkat n") didefinisikan sebagai $a \\times a \\times \\cdots \\times a$ sebanyak n faktor.' },
            { tipe: 'list', items: [
              '$a$ disebut basis.',
              '$n$ disebut pangkat atau eksponen.',
            ] },
            { tipe: 'contoh', teks: '$3^5 = 3 \\times 3 \\times 3 \\times 3 \\times 3$ ; $(a+b)^2 = (a+b)(a+b)$.' },
          ],
        },
        {
          id: 'bab-2-b',
          judul: 'B. Sifat-sifat Bilangan Berpangkat',
          blocks: [
            { tipe: 'list', items: [
              '$a^m \\times a^n = a^{m+n}$',
              '$a^m : a^n = a^{m-n}$',
              '$(a^m)^n = a^{m \\cdot n}$',
              '$(a \\times b)^m = a^m \\times b^m$',
              '$(a : b)^m = a^m : b^m$',
              '$a^0 = 1$, untuk $a \\neq 0$',
              '$a^{-n} = \\frac{1}{a^n}$, untuk $a \\neq 0$',
            ] },
            { tipe: 'tips', teks: 'Pangkat negatif berarti "pindahkan ke sisi lain pecahan": $\\frac{1}{a^{-n}} = a^n$.' },
          ],
        },
        {
          id: 'bab-2-c',
          judul: 'C. Bentuk Akar',
          blocks: [
            { tipe: 'p', teks: 'Akar adalah bentuk invers dari pangkat. Simbol "√" disebut tanda akar, digunakan untuk menyimbolkan akar pangkat 2. Bilangan yang berada di dalam tanda akar tidak boleh negatif.' },
            { tipe: 'p', teks: 'Bentuk akar adalah akar dari suatu bilangan yang hasilnya bukan bilangan rasional. Contoh: $\\sqrt{2}, \\sqrt{5}, \\sqrt{7}, \\dots$' },
          ],
        },
        {
          id: 'bab-2-d',
          judul: 'D. Sifat-sifat Bentuk Akar',
          blocks: [
            { tipe: 'list', items: [
              '$\\sqrt{a} = a^{1/2}$',
              '$\\sqrt{a^m} = a^{m/2}$',
              '$\\sqrt{a \\times b} = \\sqrt{a} \\times \\sqrt{b}$',
              '$\\sqrt{a : b} = \\sqrt{a} : \\sqrt{b}$',
              'Jika $b^n = a$, maka $b = \\sqrt[n]{a}$',
            ] },
          ],
        },
        {
          id: 'bab-2-e',
          judul: 'E. Operasi Bilangan pada Bentuk Akar',
          blocks: [
            { tipe: 'p', teks: 'Mengubah bentuk akar ke bentuk akar campuran: faktorkan menjadi bentuk perkalian antara bilangan kuadrat dengan suatu bilangan tertentu.' },
            { tipe: 'contoh', teks: '$\\sqrt{32} = \\sqrt{16 \\times 2} = 4\\sqrt{2}$ ; $\\sqrt{75} = \\sqrt{25 \\times 3} = 5\\sqrt{3}$.' },
            { tipe: 'p', teks: 'Penjumlahan dan pengurangan bentuk akar hanya dapat dioperasikan jika bentuk akarnya sama: $a\\sqrt{p} \\pm b\\sqrt{p} = (a \\pm b)\\sqrt{p}$.' },
            { tipe: 'contoh', teks: '$2\\sqrt{3} + 3\\sqrt{3} = 5\\sqrt{3}$ ; sedangkan $2\\sqrt{3} + 3\\sqrt{5}$ tidak dapat dikerjakan karena bentuk akar berbeda.' },
            { tipe: 'p', teks: 'Perkalian dan pembagian bentuk akar: $\\sqrt{a} \\times \\sqrt{b} = \\sqrt{a \\times b}$ dan $\\sqrt{a} : \\sqrt{b} = \\sqrt{a : b}$.' },
            { tipe: 'contoh', teks: '$2\\sqrt{3} \\times 4\\sqrt{2} = 8\\sqrt{6}$.' },
            { tipe: 'p', teks: 'Merasionalkan penyebut (menghilangkan akar dari penyebut dengan mengalikan sekawan):' },
            { tipe: 'list', items: [
              '$\\frac{a}{\\sqrt{b}} = \\frac{a\\sqrt{b}}{b}$',
              '$\\frac{a}{b - \\sqrt{c}}$ dikalikan sekawan $(b + \\sqrt{c})$ menjadi $\\frac{a(b + \\sqrt{c})}{b^2 - c}$',
              '$\\frac{a}{\\sqrt{b} + \\sqrt{c}}$ dikalikan sekawan $(\\sqrt{b} - \\sqrt{c})$ menjadi $\\frac{a(\\sqrt{b} - \\sqrt{c})}{b - c}$',
            ] },
            { tipe: 'tips', teks: 'Bentuk sekawan dari $\\sqrt{a} + \\sqrt{b}$ adalah $\\sqrt{a} - \\sqrt{b}$, dan sebaliknya.' },
          ],
        },
      ],
      ujiPemahaman: [
        { id: 'u1', tipe: 'pg', level: 'mudah', soal: 'Hasil dari $\\frac{3^5 \\times 3^{-2}}{3^4}$ adalah....', pilihan: ['9', '3', '1/3', '1/9'], benar: 2, pembahasan: 'Pembilang: $3^{5+(-2)} = 3^3$; pembagian: $3^{3-4} = 3^{-1} = \\frac{1}{3}$.' },
        { id: 'u2', tipe: 'pg', level: 'mudah', soal: 'Hasil dari operasi perpangkatan $(8^5 \\times 8^6) : 8^3$ adalah....', pilihan: ['8²', '8⁸', '8¹¹', '8¹⁴'], benar: 1, pembahasan: '$8^{5+6} : 8^3 = 8^{11-3} = 8^8$.' },
        { id: 'u3', tipe: 'pg', level: 'sedang', soal: 'Perhatikan gambar berikut! Diketahui panjang $AI = 3\\sqrt{32}$ cm, $AC = 2\\sqrt{18}$ cm, dan $CF = 2\\sqrt{8}$ cm. Panjang $FI$ adalah....', visual: { tipe: 'garis', titik: ['A', 'C', 'F', 'I'], keterangan: 'Titik-titik terletak pada satu garis lurus' }, pilihan: ['2√2 cm', '2√3 cm', '3√2 cm', '3√3 cm'], benar: 0, pembahasan: 'Sederhanakan: $AI = 12\\sqrt{2}$, $AC = 6\\sqrt{2}$, $CF = 4\\sqrt{2}$; $FI = AI - AC - CF = 12\\sqrt{2} - 6\\sqrt{2} - 4\\sqrt{2} = 2\\sqrt{2}$ cm.' },
        { id: 'u4', tipe: 'pg', level: 'mudah', soal: 'Bentuk sederhana dari $\\sqrt{32} - \\sqrt{50} + 2\\sqrt{2}$ adalah....', pilihan: ['√2', '2√2', '3√2', '4√2'], benar: 0, pembahasan: '$4\\sqrt{2} - 5\\sqrt{2} + 2\\sqrt{2} = (4 - 5 + 2)\\sqrt{2} = \\sqrt{2}$.' },
        { id: 'u5', tipe: 'pg', level: 'sedang', soal: 'Jika $4^x : 2^x = 128$, maka nilai $x - 5$ adalah....', pilihan: ['−4', '−2', '2', '4'], benar: 2, pembahasan: 'CATATAN: kunci pembahasan cetak di modul tertulis A, namun secara matematika $(2^2)^x : 2^x = 2^{2x-x} = 2^x = 128 = 2^7 \\Rightarrow x = 7$, sehingga $x - 5 = 2$ (C). Sistem memakai kunci yang benar secara matematika.' },
        { id: 'u6', tipe: 'multi', level: 'sedang', soal: 'Manakah pernyataan mengenai operasi bilangan berpangkat berikut yang benar? (pilih lebih dari satu)', pilihan: ['Nilai dari 27^(1/3) adalah 3.', 'Nilai dari 16^(3/4) adalah 8.', 'Nilai dari 125^(1/3) adalah 5.', 'Hasil dari 27^(1/3) + 16^(3/4) − 125^(1/3) adalah 12.'], benar: [0, 1, 2], pembahasan: 'P1: $(3^3)^{1/3} = 3$ ✓; P2: $(2^4)^{3/4} = 2^3 = 8$ ✓; P3: $(5^3)^{1/3} = 5$ ✓; P4: $3 + 8 - 5 = 6$, bukan 12 ✗.' },
        { id: 'u7', tipe: 'multi', level: 'sedang', soal: 'Manakah pernyataan penyederhanaan bentuk akar berikut yang benar? (pilih lebih dari satu)', pilihan: ['√75 = 5√3', '2√27 = 6√3', 'Hasil dari √75 − 2√27 adalah −√3.', 'Hasil dari √75 − 2√27 adalah 3√3.'], benar: [0, 1, 2], pembahasan: 'P1: $\\sqrt{25 \\times 3} = 5\\sqrt{3}$ ✓; P2: $2 \\times 3\\sqrt{3} = 6\\sqrt{3}$ ✓; P3: $5\\sqrt{3} - 6\\sqrt{3} = -\\sqrt{3}$ ✓; P4 salah karena hasilnya $-\\sqrt{3}$.' },
        { id: 'u8', tipe: 'multi', level: 'sedang', soal: 'Manakah pernyataan yang benar mengenai penyederhanaan operasi $\\frac{3\\sqrt{12} + 2\\sqrt{27}}{2\\sqrt{3}}$? (pilih lebih dari satu)', pilihan: ['Nilai dari 3√12 adalah 6√3.', 'Nilai dari 2√27 adalah 6√3.', 'Pembilang dapat disederhanakan menjadi 12√3.', 'Hasil akhir pembagian tersebut adalah 6.'], benar: [0, 1, 2, 3], pembahasan: 'P1: $3 \\times 2\\sqrt{3} = 6\\sqrt{3}$ ✓; P2: $2 \\times 3\\sqrt{3} = 6\\sqrt{3}$ ✓; P3: $6\\sqrt{3} + 6\\sqrt{3} = 12\\sqrt{3}$ ✓; P4: $12\\sqrt{3} : 2\\sqrt{3} = 6$ ✓.' },
        { id: 'u9', tipe: 'bs', level: 'sedang', soal: 'Seorang ilmuwan menulis massa sebuah partikel sebagai 0,0000000000025 kg dan editor menyarankan notasi ilmiah. Tentukan benar/salah:', pernyataan: ['Saran editor untuk menggunakan notasi ilmiah adalah tepat dan efektif.', 'Bentuk notasi ilmiah yang benar adalah 2,5 × 10⁻¹² kg.', 'Bentuk 25 × 10⁻¹³ kg juga merupakan cara penulisan yang valid meskipun bukan bentuk baku.'], benar: [true, true, true], pembahasan: 'P1: notasi ilmiah menghindari kesalahan penulisan nol terlalu banyak ✓; P2: ada 11 nol di belakang koma sebelum angka 25, desimal digeser 12 kali → $2,5 \\times 10^{-12}$ ✓; P3: $25 \\times 10^{-13} = 2,5 \\times 10^{-12}$, valid tapi tidak memenuhi syarat bentuk baku $1 \\le a < 10$ ✓.' },
        { id: 'u10', tipe: 'bs', level: 'sulit', soal: 'Diketahui $AF = 2\\sqrt{98}$ cm; $AB = 3\\sqrt{18}$ cm; $BC = 3\\sqrt{8}$ cm; $EF = 2\\sqrt{8}$ cm. Tentukan benar atau salah setiap pernyataan berikut!', pernyataan: ['Panjang DC = 5√2 cm.', 'Panjang ED = 6√2 cm.', 'Luas BCDG = 60 cm².'], benar: [true, false, true], pembahasan: 'Sederhanakan: $AF = 14\\sqrt{2}$, $AB = 9\\sqrt{2}$, $BC = 6\\sqrt{2}$, $EF = 4\\sqrt{2}$. P1: $DC = AB - EF = 9\\sqrt{2} - 4\\sqrt{2} = 5\\sqrt{2}$ ✓; P2: $ED = AF - BC = 14\\sqrt{2} - 6\\sqrt{2} = 8\\sqrt{2}$ (bukan 6√2) ✗; P3: luas $= DC \\times BC = 5\\sqrt{2} \\times 6\\sqrt{2} = 60$ ✓.' },
        { id: 'u11', tipe: 'bs', level: 'sulit', soal: 'Lapangan persegi berluas 400 m²; di tengahnya dipasang tiang lampu dan kabel ditarik ke salah satu pojok mengikuti garis diagonal. Informasi tambahan: $\\sqrt{2} = 1,4$. Tentukan benar/salah:', pernyataan: ['Panjang sisi lapangan tersebut adalah 20 m.', 'Panjang diagonal lapangan tersebut adalah 20√2 m.', 'Panjang kabel minimal yang dibutuhkan adalah 28 m.', 'Panjang kabel minimal yang dibutuhkan adalah 14 m.'], benar: [true, true, false, true], pembahasan: 'P1: sisi $= \\sqrt{400} = 20$ m ✓; P2: diagonal $= 20\\sqrt{2}$ m ✓; kabel = setengah diagonal $= 10\\sqrt{2} = 10 \\times 1,4 = 14$ m → P3 ✗, P4 ✓.' },
        { id: 'u12', tipe: 'multi', level: 'sulit', soal: 'Bentuk $\\sqrt[4]{\\frac{q^2}{8p^9 r^{15}}}$ disederhanakan menjadi bentuk pangkat. Sifat-sifat bilangan berpangkat apa saja yang digunakan dalam penyederhanaan tersebut? (pilih lebih dari satu)', pilihan: ['a^m : a^n = a^(m−n)', '(a^m)^n = a^(m·n)', 'a^m × a^n = a^(m+n)'], benar: [0, 1], pembahasan: 'Sifat pembagian dipakai saat menyatukan pangkat pembilang/penyebut; sifat $(a^m)^n$ dipakai saat mengubah akar keempat menjadi pangkat 1/4; sifat $a^{-n} = 1/a^n$ dipakai saat menuliskan pangkat negatif (tidak ada di pilihan). Sifat perkalian $a^m \\times a^n$ TIDAK dipakai.' },
        { id: 'u13', tipe: 'bs', level: 'sedang', soal: 'Hasil dari $\\frac{\\sqrt{3} \\times \\sqrt{12}}{\\sqrt{6}}$ adalah M. Tentukan benar atau salah untuk setiap pernyataan berikut terkait nilai M!', pernyataan: ['M merupakan bilangan genap.', 'M dikuadratkan hasilnya lebih besar daripada nol.', 'M × 3 + 7√6 = 10√6.'], benar: [false, true, true], pembahasan: '$M = \\frac{\\sqrt{36}}{\\sqrt{6}} = \\frac{6}{\\sqrt{6}} = \\sqrt{6}$. P1: $\\sqrt{6}$ bukan bilangan genap ✗; P2: $M^2 = 6 > 0$ ✓; P3: $3\\sqrt{6} + 7\\sqrt{6} = 10\\sqrt{6}$ ✓.' },
        { id: 'u14', tipe: 'pg', level: 'mudah', soal: 'Hasil dari $27^{2/3} + 4^{3/2}$ adalah....', pilihan: ['9', '8', '17', '31'], benar: 2, pembahasan: '$(3^3)^{2/3} + (2^2)^{3/2} = 3^2 + 2^3 = 9 + 8 = 17$.' },
        { id: 'u15', tipe: 'pg', level: 'mudah', soal: 'Bentuk sederhana dari $\\sqrt{27} - \\sqrt{12} + 2\\sqrt{3}$ adalah....', pilihan: ['11√3', '10√3', '7√3', '3√3'], benar: 3, pembahasan: '$3\\sqrt{3} - 2\\sqrt{3} + 2\\sqrt{3} = 3\\sqrt{3}$.' },
        { id: 'u16', tipe: 'pg', level: 'mudah', soal: 'Bentuk sederhana dari $\\frac{2}{\\sqrt{3} + \\sqrt{5}}$ adalah....', pilihan: ['√5 − √3', '√3 − √5', '2√5 − 2√3', '2√3 − 2√5'], benar: 0, pembahasan: 'Kalikan sekawan: $\\frac{2(\\sqrt{3} - \\sqrt{5})}{(\\sqrt{3} + \\sqrt{5})(\\sqrt{3} - \\sqrt{5})} = \\frac{2(\\sqrt{3} - \\sqrt{5})}{3 - 5} = -(\\sqrt{3} - \\sqrt{5}) = \\sqrt{5} - \\sqrt{3}$.' },
      ],
    },
    // Bab berikutnya: tambah object baru ke array ini.
  ];