# scripts/kmerdeka_questions_part2.py
# Chapter 3: Home Sweet Home (Unit 1, 2, 3) & Chapter 4: My School Activities (Unit 1, 2, 3)

SOAL_PART2 = [
    # ========================================================
    # CHAPTER 3: HOME SWEET HOME (SEMESTER 1)
    # UNIT 1: My House (Soal 31-35)
    # ========================================================
    {
        'nomor': 31,
        'semester': 'Semester 1',
        'chapter': 'Chapter 3: Home Sweet Home',
        'unit': 'Unit 1: My House',
        'tipe': 'pg_sederhana',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Describing Rooms and Belongings',
        'capaian_pembelajaran': 'Mendeskripsikan ruangan rumah dan perbandingan spesifikasi perlengkapan belajar siswa.',
        'bacaan': {
            'grup': 'tabel_tiga_ransel',
            'teks': 'Compare the specifications of three student school backpacks below for questions number 31 to 35!\n\n[SPECIFICATION TABLE: 3 SCHOOL BACKPACKS]\n1. AERO BAG\n   • Material: High-density Ripstop Nylon (Waterproof Rating: 100% Water Resistant)\n   • Capacity: 22 Liters (Laptop Sleeve: Fits up to 14-inch laptop)\n   • Empty Weight: 550 grams\n   • Price: Rp185.000\n\n2. TERRA PACK\n   • Material: Heavy-duty Canvas (Waterproof Rating: Water Repellent with Rain Cover included)\n   • Capacity: 28 Liters (Laptop Sleeve: Fits up to 15.6-inch laptop)\n   • Empty Weight: 850 grams\n   • Price: Rp240.000\n\n3. NOVA TOTE\n   • Material: Recycled Polyester (Waterproof Rating: Splash Resistant only)\n   • Capacity: 18 Liters (Laptop Sleeve: Padded tablet sleeve up to 11-inch)\n   • Empty Weight: 420 grams\n   • Price: Rp150.000',
            'gambar': ['bab8_backpacks_table.png']
        },
        'gambar': ['bab8_backpacks_table.png'],
        'teks_soal': 'Which backpack is the MOST EXPENSIVE and has the LARGEST capacity?',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'Aero Bag'},
            {'label': 'B', 'teks': 'Terra Pack'},
            {'label': 'C', 'teks': 'Nova Tote'},
            {'label': 'D', 'teks': 'All three bags have the exact same price and capacity.'}
        ],
        'kunci_jawaban': 'B',
        'pembahasan': 'Berdasarkan tabel, Terra Pack memiliki kapasitas terbesar (28 Liter) dan harga paling mahal (Rp240.000). Pilihan B tepat.'
    },
    {
        'nomor': 32,
        'semester': 'Semester 1',
        'chapter': 'Chapter 3: Home Sweet Home',
        'unit': 'Unit 1: My House',
        'tipe': 'pg_sederhana',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Grammar Focus: Prepositions of Place',
        'capaian_pembelajaran': 'Menerapkan kata depan tempat (prepositions of place: on, under, next to, behind) dalam mendeskripsikan letak benda di kamar tidur.',
        'bacaan': {
            'grup': 'tabel_tiga_ransel',
            'teks': 'Andre is organizing his bedroom.'
        },
        'gambar': [],
        'teks_soal': 'Look at the description: ”Andre places his study lamp ... the desk, right ... his laptop.”\nWhich pair of prepositions correctly completes the sentence?',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'under – inside'},
            {'label': 'B', 'teks': 'on – next to'},
            {'label': 'C', 'teks': 'behind – above'},
            {'label': 'D', 'teks': 'between – through'}
        ],
        'kunci_jawaban': 'B',
        'pembahasan': 'Lampu belajar ditaruh di atas permukaan meja ("on the desk") di sebelah laptop ("next to his laptop"). Pilihan B tepat.'
    },
    {
        'nomor': 33,
        'semester': 'Semester 1',
        'chapter': 'Chapter 3: Home Sweet Home',
        'unit': 'Unit 1: My House',
        'tipe': 'pg_kompleks',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Backpack Features Comparison',
        'capaian_pembelajaran': 'Menganalisis fitur produk tas sekolah multimodal.',
        'bacaan': {
            'grup': 'tabel_tiga_ransel',
            'teks': 'Refer to the 3 School Backpacks table.'
        },
        'gambar': ['bab8_backpacks_table.png'],
        'teks_soal': '[Pilihan Ganda Kompleks — Pilih Dua Jawaban Benar!]\nWhich two statements are TRUE based on the backpack specification table? (Choose TWO correct answers)',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'Nova Tote is the lightest bag among the three (only 420 grams).'},
            {'label': 'B', 'teks': 'Aero Bag offers 100% waterproof protection made of Ripstop Nylon.'},
            {'label': 'C', 'teks': 'Terra Pack is made of cheap paper and costs Rp50.000.'},
            {'label': 'D', 'teks': 'Nova Tote can fit a 17-inch gaming laptop.'}
        ],
        'kunci_jawaban': 'A, B',
        'pembahasan': 'Pilihan A benar (Nova Tote paling ringan, 420 gram) dan B benar (Aero Bag tahan air 100% dari bahan Ripstop Nylon).'
    },
    {
        'nomor': 34,
        'semester': 'Semester 1',
        'chapter': 'Chapter 3: Home Sweet Home',
        'unit': 'Unit 1: My House',
        'tipe': 'benar_salah',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'True/False Backpack Comparison',
        'capaian_pembelajaran': 'Mengevaluasi kebenaran data perbandingan berat dan harga perlengkapan rumah/sekolah.',
        'bacaan': {
            'grup': 'tabel_tiga_ransel',
            'teks': 'Refer to the 3 School Backpacks table.'
        },
        'gambar': ['bab8_backpacks_table.png'],
        'teks_soal': '[Tabel Benar / Salah (True or False)] Give a tick in the True or False column based on the table!',
        'pernyataan': [
            {'teks': 'The price difference between Terra Pack (Rp240.000) and Aero Bag (Rp185.000) is Rp55.000.', 'jawaban': 'B'},
            {'teks': 'Terra Pack is lighter than Nova Tote by 300 grams.', 'jawaban': 'S'},
            {'teks': 'Nova Tote is made from environmentally friendly recycled polyester.', 'jawaban': 'B'}
        ],
        'kunci_jawaban': 'B,S,B',
        'pembahasan': '(a) Benar: Rp240.000 - Rp185.000 = Rp55.000. (b) Salah: Terra Pack lebih berat (850g vs 420g). (c) Benar: Nova Tote dibuat dari bahan poliester daur ulang.'
    },
    {
        'nomor': 35,
        'semester': 'Semester 1',
        'chapter': 'Chapter 3: Home Sweet Home',
        'unit': 'Unit 1: My House',
        'tipe': 'pg_sederhana',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Degrees of Comparison',
        'capaian_pembelajaran': 'Menerapkan tingkat perbandingan (comparative & superlative degrees) pada benda sehari-hari.',
        'bacaan': {
            'grup': 'tabel_tiga_ransel',
            'teks': 'Refer to the 3 School Backpacks table.'
        },
        'gambar': ['bab8_backpacks_table.png'],
        'teks_soal': 'Which comparative sentence correctly describes the three bags?',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'Nova Tote is cheaper than Aero Bag, but Terra Pack is the most expensive of all.'},
            {'label': 'B', 'teks': 'Terra Pack is cheaper than Nova Tote.'},
            {'label': 'C', 'teks': 'Aero Bag is the heaviest backpack.'},
            {'label': 'D', 'teks': 'All three bags are equally heavy.'}
        ],
        'kunci_jawaban': 'A',
        'pembahasan': 'Nova Tote (Rp150k) lebih murah dari Aero Bag (Rp185k), dan Terra Pack (Rp240k) adalah yang paling mahal. Pilihan A tepat.'
    },

    # ========================================================
    # UNIT 2: My House Chores (Soal 36-40)
    # ========================================================
    {
        'nomor': 36,
        'semester': 'Semester 1',
        'chapter': 'Chapter 3: Home Sweet Home',
        'unit': 'Unit 2: My House Chores',
        'tipe': 'pg_sederhana',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Daily House Chores & Responsibility',
        'capaian_pembelajaran': 'Mendeskripsikan pembagian tugas kebersihan rumah tangga dalam keluarga.',
        'bacaan': {
            'grup': 'jadwal_kebersihan_rumah',
            'teks': 'Read the text below for questions number 36 to 40!\n\nIn Galang’s family, keeping the house clean and comfortable is a shared responsibility. Every Saturday morning after breakfast, each family member has a specific chore:\n• Galang’s father sweeps the front yard, trims the garden bushes, and washes the motorcycle.\n• Galang’s mother wipes the kitchen counters, mops the dining area, and cooks lunch.\n• Galang cleans his own bedroom, sweeps the living room, and waters the flower pots in the porch.\n• Galang’s sister, Ara, wipes the glass windows and washes the breakfast dishes at the sink.\nBy working together, the entire house looks sparkling clean and tidy in less than two hours.',
            'gambar': []
        },
        'gambar': [],
        'teks_soal': 'Who is responsible for washing the breakfast dishes at the kitchen sink?',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'Galang’s father'},
            {'label': 'B', 'teks': 'Galang’s sister, Ara'},
            {'label': 'C', 'teks': 'Galang himself'},
            {'label': 'D', 'teks': 'Their neighbor'}
        ],
        'kunci_jawaban': 'B',
        'pembahasan': 'Teks menyebutkan: "Galang’s sister, Ara, wipes the glass windows and washes the breakfast dishes at the sink." Pilihan B tepat.'
    },
    {
        'nomor': 37,
        'semester': 'Semester 1',
        'chapter': 'Chapter 3: Home Sweet Home',
        'unit': 'Unit 2: My House Chores',
        'tipe': 'pg_sederhana',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Grammar Focus: Subject-Verb Agreement in Chores',
        'capaian_pembelajaran': 'Menerapkan tata bahasa Simple Present Tense untuk kebiasaan rutin rumah tangga.',
        'bacaan': {
            'grup': 'jadwal_kebersihan_rumah',
            'teks': 'Refer to Galang’s family chore text.'
        },
        'gambar': [],
        'teks_soal': 'Complete the sentence with the correct verb forms!\n”Every Saturday, Galang ... the living room while his parents ... in the kitchen and yard.”',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'sweep – works'},
            {'label': 'B', 'teks': 'sweeps – work'},
            {'label': 'C', 'teks': 'swept – working'},
            {'label': 'D', 'teks': 'is sweeping – works'}
        ],
        'kunci_jawaban': 'B',
        'pembahasan': 'Galang (tunggal) memerlukan kata kerja "sweeps", sedangkan his parents (jamak) memerlukan "work". Pilihan B tepat.'
    },
    {
        'nomor': 38,
        'semester': 'Semester 1',
        'chapter': 'Chapter 3: Home Sweet Home',
        'unit': 'Unit 2: My House Chores',
        'tipe': 'pg_kompleks',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Household Cleaning Vocabulary',
        'capaian_pembelajaran': 'Mengidentifikasi frasa kata kerja tugas rumah tangga (chores verb phrases).',
        'bacaan': {
            'grup': 'jadwal_kebersihan_rumah',
            'teks': 'Refer to Galang’s family chore text.'
        },
        'gambar': [],
        'teks_soal': '[Pilihan Ganda Kompleks — Pilih Dua Jawaban Benar!]\nWhich two chores are specifically performed by GALANG according to the text? (Choose TWO correct answers)',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'Sweeping the living room and tidying his bedroom.'},
            {'label': 'B', 'teks': 'Watering the flower pots in the porch.'},
            {'label': 'C', 'teks': 'Trimming the tall garden bushes with a mechanical saw.'},
            {'label': 'D', 'teks': 'Washing the family car and motorcycle.'}
        ],
        'kunci_jawaban': 'A, B',
        'pembahasan': 'Galang membersihkan kamarnya, menyapu ruang tamu (A), dan menyiram tanaman bunga di teras (B). Memangkas semak dan mencuci motor dilakukan ayahnya.'
    },
    {
        'nomor': 39,
        'semester': 'Semester 1',
        'chapter': 'Chapter 3: Home Sweet Home',
        'unit': 'Unit 2: My House Chores',
        'tipe': 'benar_salah',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Fact Checking in Family Collaboration',
        'capaian_pembelajaran': 'Memeriksa detail fakta pembagian tugas rumah tangga.',
        'bacaan': {
            'grup': 'jadwal_kebersihan_rumah',
            'teks': 'Refer to Galang’s family chore text.'
        },
        'gambar': [],
        'teks_soal': '[Tabel Benar / Salah (True or False)] Give a tick in the True or False column based on the text!',
        'pernyataan': [
            {'teks': 'Galang’s father does all the house chores alone without any help.', 'jawaban': 'S'},
            {'teks': 'Working together enables the family to finish cleaning the house in less than two hours.', 'jawaban': 'B'},
            {'teks': 'Galang’s mother is responsible for wiping kitchen counters and mopping the dining area.', 'jawaban': 'B'}
        ],
        'kunci_jawaban': 'S,B,B',
        'pembahasan': '(a) Salah: Semua anggota keluarga berbagi tugas bersama. (b) Benar: Kerja sama membuat rumah bersih dalam waktu kurang dari 2 jam. (c) Benar: Ibu mengelap konter dapur dan mengepel ruang makan.'
    },
    {
        'nomor': 40,
        'semester': 'Semester 1',
        'chapter': 'Chapter 3: Home Sweet Home',
        'unit': 'Unit 2: My House Chores',
        'tipe': 'pg_sederhana',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Values and Character Education in Texts',
        'capaian_pembelajaran': 'Menyimpulkan nilai karakter gotong royong dan tanggung jawab dalam keluarga.',
        'bacaan': {
            'grup': 'jadwal_kebersihan_rumah',
            'teks': 'Refer to Galang’s family chore text.'
        },
        'gambar': [],
        'teks_soal': 'What positive value can students learn from Galang’s family routine?',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'Teamwork and mutual responsibility make heavy work feel lighter and quicker.'},
            {'label': 'B', 'teks': 'Children should avoid doing chores and let parents work all day.'},
            {'label': 'C', 'teks': 'Houses do not need to be cleaned if we stay in our bedrooms.'},
            {'label': 'D', 'teks': 'Eating breakfast is a waste of time on Saturday mornings.'}
        ],
        'kunci_jawaban': 'A',
        'pembahasan': 'Nilai karakter utama adalah gotong royong dan rasa tanggung jawab bersama (teamwork & mutual responsibility) yang meringankan beban pekerjaan rumah (A).'
    },

    # ========================================================
    # UNIT 3: Let’s Clean Up! (Soal 41-45)
    # ========================================================
    {
        'nomor': 41,
        'semester': 'Semester 1',
        'chapter': 'Chapter 3: Home Sweet Home',
        'unit': 'Unit 3: Let’s Clean Up!',
        'tipe': 'pg_sederhana',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Visual Procedure: Upcycling Plastic Bottles',
        'capaian_pembelajaran': 'Menganalisis teks prosedur visual multimodal pembuatan pot swasiram (self-watering pot) dari botol bekas.',
        'bacaan': {
            'grup': 'prosedur_pot_swasiram',
            'teks': 'Study the 4-step visual procedure guide below for questions number 41 to 45!\n\nHOW TO MAKE A SELF-WATERING POT FROM USED PLASTIC BOTTLES\n\nStep 1: Cut a clean 1.5-liter plastic bottle horizontally into two halves using scissors.\nStep 2: Poke a small drainage hole in the plastic bottle cap and thread a piece of cotton wick/cloth strip through it.\nStep 3: Invert the top bottle half (upside down) and place it inside the bottom half filled with water. The wick will absorb water upward.\nStep 4: Fill the inverted top section with fertile planting soil and plant your seedling. Water once, and the self-watering system will keep the soil moist automatically.',
            'gambar': ['bab19_procedure_self_watering_pot.jpg']
        },
        'gambar': ['bab19_procedure_self_watering_pot.jpg'],
        'teks_soal': 'What is the main environmental benefit of making a self-watering pot according to the guide?',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'It increases the use of brand-new single-use plastic cups.'},
            {'label': 'B', 'teks': 'It reduces household plastic waste by upcycling discarded bottles into functional plant pots.'},
            {'label': 'C', 'teks': 'It requires cutting down tall trees in the rainforest.'},
            {'label': 'D', 'teks': 'It uses huge amounts of electricity to pump water.'}
        ],
        'kunci_jawaban': 'B',
        'pembahasan': 'Manfaat lingkungan terpenting adalah mengurangi sampah plastik dengan mendaur ulang (upcycling) botol bekas menjadi pot swasiram fungsional (B).'
    },
    {
        'nomor': 42,
        'semester': 'Semester 1',
        'chapter': 'Chapter 3: Home Sweet Home',
        'unit': 'Unit 3: Let’s Clean Up!',
        'tipe': 'pg_sederhana',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Functional Mechanics in Scientific Procedure',
        'capaian_pembelajaran': 'Menjelaskan fungsi bagian benda (cotton wick) pada mekanisme kapilaritas pot tanaman.',
        'bacaan': {
            'grup': 'prosedur_pot_swasiram',
            'teks': 'Refer to the Self-Watering Pot guide.'
        },
        'gambar': ['bab19_procedure_self_watering_pot.jpg'],
        'teks_soal': 'What is the primary function of the cotton wick/cloth strip in Step 2 and Step 3?',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'To color the water into rainbow shades.'},
            {'label': 'B', 'teks': 'To absorb water from the bottom reservoir up into the fertile soil automatically.'},
            {'label': 'C', 'teks': 'To keep insects trapped inside the bottle cap.'},
            {'label': 'D', 'teks': 'To heat up the soil during nighttime.'}
        ],
        'kunci_jawaban': 'B',
        'pembahasan': 'Fungsi sumbu kain katun (cotton wick) adalah menyerap air dari wadah penampung bawah ke tanah secara kapilaritas (B).'
    },
    {
        'nomor': 43,
        'semester': 'Semester 1',
        'chapter': 'Chapter 3: Home Sweet Home',
        'unit': 'Unit 3: Let’s Clean Up!',
        'tipe': 'pg_kompleks',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Materials Identification in Eco-DIY',
        'capaian_pembelajaran': 'Mengidentifikasi bahan daur ulang yang diperlukan dalam proyek swakarya lingkungan.',
        'bacaan': {
            'grup': 'prosedur_pot_swasiram',
            'teks': 'Refer to the Self-Watering Pot guide.'
        },
        'gambar': ['bab19_procedure_self_watering_pot.jpg'],
        'teks_soal': '[Pilihan Ganda Kompleks — Pilih Dua Jawaban Benar!]\nWhich two materials are essential to create the self-watering container? (Choose TWO correct answers)',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'A clean 1.5-liter used plastic bottle with its cap.'},
            {'label': 'B', 'teks': 'A strip of cotton cloth or wick.'},
            {'label': 'C', 'teks': 'A large ceramic brick.'},
            {'label': 'D', 'teks': 'An electric battery motor.'}
        ],
        'kunci_jawaban': 'A, B',
        'pembahasan': 'Bahan inti adalah botol plastik bekas 1,5 liter beserta tutupnya (A) dan sehelai sumbu/kain katun (B).'
    },
    {
        'nomor': 44,
        'semester': 'Semester 1',
        'chapter': 'Chapter 3: Home Sweet Home',
        'unit': 'Unit 3: Let’s Clean Up!',
        'tipe': 'benar_salah',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Step Verification in Illustrated Guide',
        'capaian_pembelajaran': 'Memvalidasi urutan dan teknik perakitan pot tanaman swasiram.',
        'bacaan': {
            'grup': 'prosedur_pot_swasiram',
            'teks': 'Refer to the Self-Watering Pot guide.'
        },
        'gambar': ['bab19_procedure_self_watering_pot.jpg'],
        'teks_soal': '[Tabel Benar / Salah (True or False)] Give a tick in the True or False column based on the guide!',
        'pernyataan': [
            {'teks': 'The bottle is cut into two equal halves horizontally.', 'jawaban': 'B'},
            {'teks': 'Water is poured into the top inverted section while soil is stored at the bottom.', 'jawaban': 'S'},
            {'teks': 'The self-watering pot allows plants to receive moisture continuously without daily manual pouring.', 'jawaban': 'B'}
        ],
        'kunci_jawaban': 'B,S,B',
        'pembahasan': '(a) Benar: Botol dipotong melintang menjadi 2 bagian. (b) Salah: Air di wadah bawah, tanah di wadah atas terbalik. (c) Benar: Sistem ini menjaga kelembapan tanah secara mandiri.'
    },
    {
        'nomor': 45,
        'semester': 'Semester 1',
        'chapter': 'Chapter 3: Home Sweet Home',
        'unit': 'Unit 3: Let’s Clean Up!',
        'tipe': 'pg_sederhana',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Environmental Notices & Rules',
        'capaian_pembelajaran': 'Menginterpretasikan papan peringatan kebersihan lingkungan sekolah dan taman publik.',
        'bacaan': {
            'grup': 'papan_peringatan_taman',
            'teks': 'Observe the notice board at the School Eco-Park: ”DO NOT LITTER! Keep our school garden clean and green. Violators will be fined Rp50.000 or assigned 2 hours of community compost duty.”'
        },
        'gambar': ['bab12_ecopark_notice.jpg'],
        'teks_soal': 'What happens if a student throws plastic wrappers carelessly in the school garden?',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'They will receive free snacks from the principal.'},
            {'label': 'B', 'teks': 'They must pay a fine of Rp50.000 or do 2 hours of community compost duty.'},
            {'label': 'C', 'teks': 'They are awarded a gold medal for creativity.'},
            {'label': 'D', 'teks': 'They are allowed to throw more rubbish.'}
        ],
        'kunci_jawaban': 'B',
        'pembahasan': 'Berdasarkan papan peringatan, pelanggar yang membuang sampah sembarangan akan didenda Rp50.000 atau menjalani 2 jam tugas kompos (B).'
    },

    # ========================================================
    # CHAPTER 4: MY SCHOOL ACTIVITIES (SEMESTER 2)
    # UNIT 1: My Class Schedule (Soal 46-50)
    # ========================================================
    {
        'nomor': 46,
        'semester': 'Semester 2',
        'chapter': 'Chapter 4: My School Activities',
        'unit': 'Unit 1: My Class Schedule',
        'tipe': 'pg_sederhana',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'School Subjects and Timetables',
        'capaian_pembelajaran': 'Membaca dan membandingkan jadwal pelajaran mingguan antar dua kelas pada jenjang SMP.',
        'bacaan': {
            'grup': 'jadwal_7a_7b',
            'teks': 'Compare the Wednesday Morning Schedule of Class 7A and Class 7B below for questions number 46 to 50!\n\n[WEDNESDAY MORNING TIMETABLE]\n• 07.15 – 08.35:\n  - Class 7A: English (with Mr. Rahmat)\n  - Class 7B: Mathematics (with Mrs. Tari)\n• 08.35 – 09.55:\n  - Class 7A: Natural Science (with Mr. Joko)\n  - Class 7B: English (with Mr. Rahmat)\n• 09.55 – 10.15:\n  - First Break (Istirahat Pertama — 20 minutes)\n• 10.15 – 11.35:\n  - Class 7A: Mathematics (with Mrs. Tari)\n  - Class 7B: Indonesian Language (with Mrs. Dewi)',
            'gambar': ['bab5_jadwal_7a_7b.png']
        },
        'gambar': ['bab5_jadwal_7a_7b.png'],
        'teks_soal': 'Which subject does Class 7A study on Wednesday at 07.15 – 08.35 AM?',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'Mathematics'},
            {'label': 'B', 'teks': 'English (with Mr. Rahmat)'},
            {'label': 'C', 'teks': 'Natural Science'},
            {'label': 'D', 'teks': 'Indonesian Language'}
        ],
        'kunci_jawaban': 'B',
        'pembahasan': 'Jadwal menunjukkan Kelas 7A belajar English bersama Mr. Rahmat pada pukul 07.15 – 08.35 (B).'
    },
    {
        'nomor': 47,
        'semester': 'Semester 2',
        'chapter': 'Chapter 4: My School Activities',
        'unit': 'Unit 1: My Class Schedule',
        'tipe': 'pg_sederhana',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Calculating Lesson Duration',
        'capaian_pembelajaran': 'Menghitung durasi waktu pembelajaran dalam bahasa Inggris menggunakan format jam dan menit.',
        'bacaan': {
            'grup': 'jadwal_7a_7b',
            'teks': 'Refer to the Wednesday Morning Schedule.'
        },
        'gambar': ['bab5_jadwal_7a_7b.png'],
        'teks_soal': 'How long does the first lesson session last (from 07.15 to 08.35)?',
        'opsi_jawaban': [
            {'label': 'A', 'teks': '45 minutes'},
            {'label': 'B', 'teks': '60 minutes'},
            {'label': 'C', 'teks': '80 minutes'},
            {'label': 'D', 'teks': '120 minutes'}
        ],
        'kunci_jawaban': 'C',
        'pembahasan': 'Dari pukul 07.15 hingga 08.35 berdurasi 1 jam 20 menit = 80 menit (C).'
    },
    {
        'nomor': 48,
        'semester': 'Semester 2',
        'chapter': 'Chapter 4: My School Activities',
        'unit': 'Unit 1: My Class Schedule',
        'tipe': 'pg_kompleks',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Schedule Comparison & Facts',
        'capaian_pembelajaran': 'Mengidentifikasi persamaan dan perbedaan jadwal dua kelas secara komparatif.',
        'bacaan': {
            'grup': 'jadwal_7a_7b',
            'teks': 'Refer to the Wednesday Morning Schedule.'
        },
        'gambar': ['bab5_jadwal_7a_7b.png'],
        'teks_soal': '[Pilihan Ganda Kompleks — Pilih Dua Jawaban Benar!]\nWhich two statements are CORRECT based on the Wednesday schedule? (Choose TWO correct answers)',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'Both Class 7A and Class 7B have their First Break at 09.55 – 10.15 (20 minutes).'},
            {'label': 'B', 'teks': 'Mr. Rahmat teaches English to Class 7A first, and then to Class 7B at 08.35.'},
            {'label': 'C', 'teks': 'Class 7A studies Indonesian Language at 10.15.'},
            {'label': 'D', 'teks': 'There is no break time on Wednesday morning.'}
        ],
        'kunci_jawaban': 'A, B',
        'pembahasan': 'Pilihan A benar (istirahat bersama pukul 09.55–10.15) dan B benar (Mr. Rahmat mengajar 7A di sesi 1 lalu 7B di sesi 2).'
    },
    {
        'nomor': 49,
        'semester': 'Semester 2',
        'chapter': 'Chapter 4: My School Activities',
        'unit': 'Unit 1: My Class Schedule',
        'tipe': 'benar_salah',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'True/False Timetable Verification',
        'capaian_pembelajaran': 'Memverifikasi kebenaran informasi alokasi waktu mata pelajaran.',
        'bacaan': {
            'grup': 'jadwal_7a_7b',
            'teks': 'Refer to the Wednesday Morning Schedule.'
        },
        'gambar': ['bab5_jadwal_7a_7b.png'],
        'teks_soal': '[Tabel Benar / Salah (True or False)] Give a tick in the True or False column based on the schedule!',
        'pernyataan': [
            {'teks': 'Mrs. Tari teaches Mathematics to Class 7B in the first session (07.15 – 08.35).', 'jawaban': 'B'},
            {'teks': 'Class 7A finishes their morning Mathematics class at 11.35 AM.', 'jawaban': 'B'},
            {'teks': 'Natural Science for Class 7A starts at 07.15 AM.', 'jawaban': 'S'}
        ],
        'kunci_jawaban': 'B,B,S',
        'pembahasan': '(a) Benar: Mrs. Tari mengajar MTK kelas 7B di sesi pertama. (b) Benar: Sesi ketiga kelas 7A selesai pukul 11.35. (c) Salah: IPA kelas 7A dimulai pukul 08.35, bukan 07.15.'
    },
    {
        'nomor': 50,
        'semester': 'Semester 2',
        'chapter': 'Chapter 4: My School Activities',
        'unit': 'Unit 1: My Class Schedule',
        'tipe': 'pg_sederhana',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Grammar Focus: Prepositions of Time (at, on, in)',
        'capaian_pembelajaran': 'Menerapkan preposisi waktu (at untuk jam, on untuk hari, in untuk bulan/bagian hari) secara tepat.',
        'bacaan': None,
        'gambar': [],
        'teks_soal': 'Complete the sentence with the correct prepositions of time!\n”Class 7A has English ... Wednesday ... 07.15 in the morning.”',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'at – on'},
            {'label': 'B', 'teks': 'on – at'},
            {'label': 'C', 'teks': 'in – on'},
            {'label': 'D', 'teks': 'by – for'}
        ],
        'kunci_jawaban': 'B',
        'pembahasan': 'Hari menggunakan "on" (on Wednesday), sedangkan jam spesifik menggunakan "at" (at 07.15). Pilihan B tepat.'
    },

    # ========================================================
    # UNIT 2: My Online Class (Soal 51-60: 10 Gambar Jam Digital Asli)
    # ========================================================
    {
        'nomor': 51,
        'semester': 'Semester 2',
        'chapter': 'Chapter 4: My School Activities',
        'unit': 'Unit 2: My Online Class',
        'tipe': 'pg_sederhana',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Telling Time: Exact Hour',
        'capaian_pembelajaran': 'Menyatakan waktu tepat (o’clock) dalam bahasa Inggris berdasarkan stimulus jam digital.',
        'bacaan': None,
        'gambar': ['bab5_clock_soal1.png'],
        'teks_soal': 'Look at the digital clock below!\nWhat time is it?',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'It is one o’clock.'},
            {'label': 'B', 'teks': 'It is two o’clock.'},
            {'label': 'C', 'teks': 'It is twelve o’clock.'},
            {'label': 'D', 'teks': 'It is half past two.'}
        ],
        'kunci_jawaban': 'B',
        'pembahasan': 'Jam digital menunjukkan 02.00, dinyatakan: "It is two o’clock" (B).'
    },
    {
        'nomor': 52,
        'semester': 'Semester 2',
        'chapter': 'Chapter 4: My School Activities',
        'unit': 'Unit 2: My Online Class',
        'tipe': 'pg_sederhana',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Telling Time: Minutes Past',
        'capaian_pembelajaran': 'Menyatakan waktu lewat menit (past) dalam bahasa Inggris.',
        'bacaan': None,
        'gambar': ['bab5_clock_soal2.png'],
        'teks_soal': 'Look at the digital clock below!\nWhat time is it?',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'It is twenty past two.'},
            {'label': 'B', 'teks': 'It is two past twenty.'},
            {'label': 'C', 'teks': 'It is half past two.'},
            {'label': 'D', 'teks': 'It is twenty to three.'}
        ],
        'kunci_jawaban': 'A',
        'pembahasan': 'Jam digital menunjukkan 02.20, dinyatakan: "It is twenty past two" (B).'
    },
    {
        'nomor': 53,
        'semester': 'Semester 2',
        'chapter': 'Chapter 4: My School Activities',
        'unit': 'Unit 2: My Online Class',
        'tipe': 'pg_sederhana',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Telling Time: A Quarter Past',
        'capaian_pembelajaran': 'Menyatakan waktu lewat seperempat jam (a quarter past).',
        'bacaan': None,
        'gambar': ['bab5_clock_soal3.png'],
        'teks_soal': 'Look at the digital clock below!\nWhat time is it?',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'It is four past fifteen.'},
            {'label': 'B', 'teks': 'It is a quarter past four.'},
            {'label': 'C', 'teks': 'It is a quarter to four.'},
            {'label': 'D', 'teks': 'It is half past four.'}
        ],
        'kunci_jawaban': 'B',
        'pembahasan': 'Jam digital menunjukkan 04.15, dinyatakan: "It is a quarter past four" (B).'
    },
    {
        'nomor': 54,
        'semester': 'Semester 2',
        'chapter': 'Chapter 4: My School Activities',
        'unit': 'Unit 2: My Online Class',
        'tipe': 'pg_sederhana',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Telling Time: Minutes Past',
        'capaian_pembelajaran': 'Menyatakan waktu lewat menit pada jam sembilan.',
        'bacaan': None,
        'gambar': ['bab5_clock_soal4.png'],
        'teks_soal': 'Look at the digital clock below!\nWhat time is it?',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'It is twenty-five past nine.'},
            {'label': 'B', 'teks': 'It is twenty-five to nine.'},
            {'label': 'C', 'teks': 'It is nine past twenty-five.'},
            {'label': 'D', 'teks': 'It is half past nine.'}
        ],
        'kunci_jawaban': 'A',
        'pembahasan': 'Jam digital menunjukkan 09.25, dinyatakan: "It is twenty-five past nine" (A).'
    },
    {
        'nomor': 55,
        'semester': 'Semester 2',
        'chapter': 'Chapter 4: My School Activities',
        'unit': 'Unit 2: My Online Class',
        'tipe': 'pg_sederhana',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Telling Time: Half Past',
        'capaian_pembelajaran': 'Menyatakan waktu lewat setengah jam (half past).',
        'bacaan': None,
        'gambar': ['bab5_clock_soal5.png'],
        'teks_soal': 'Look at the digital clock below!\nWhat time is it?',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'It is ten o’clock.'},
            {'label': 'B', 'teks': 'It is half past ten.'},
            {'label': 'C', 'teks': 'It is half past eleven.'},
            {'label': 'D', 'teks': 'It is a quarter past ten.'}
        ],
        'kunci_jawaban': 'B',
        'pembahasan': 'Jam digital menunjukkan 10.30, dinyatakan: "It is half past ten" (B).'
    },
    {
        'nomor': 56,
        'semester': 'Semester 2',
        'chapter': 'Chapter 4: My School Activities',
        'unit': 'Unit 2: My Online Class',
        'tipe': 'pg_sederhana',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Telling Time: Minutes To',
        'capaian_pembelajaran': 'Menyatakan waktu menuju jam berikutnya menggunakan kata "to".',
        'bacaan': None,
        'gambar': ['bab5_clock_soal6.png'],
        'teks_soal': 'Look at the digital clock below!\nWhat time is it?',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'It is twenty-five to nine.'},
            {'label': 'B', 'teks': 'It is thirty-five past eight.'},
            {'label': 'C', 'teks': 'It is twenty-five past eight.'},
            {'label': 'D', 'teks': 'It is eight to thirty-five.'}
        ],
        'kunci_jawaban': 'A',
        'pembahasan': 'Jam 08.35 berarti kurang 25 menit menuju jam 9: "It is twenty-five to nine" (A).'
    },
    {
        'nomor': 57,
        'semester': 'Semester 2',
        'chapter': 'Chapter 4: My School Activities',
        'unit': 'Unit 2: My Online Class',
        'tipe': 'pg_sederhana',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Telling Time: A Quarter To',
        'capaian_pembelajaran': 'Menyatakan waktu kurang seperempat jam (a quarter to).',
        'bacaan': None,
        'gambar': ['bab5_clock_soal7.png'],
        'teks_soal': 'Look at the digital clock below!\nWhat time is it?',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'It is a quarter to twelve.'},
            {'label': 'B', 'teks': 'It is a quarter past eleven.'},
            {'label': 'C', 'teks': 'It is eleven forty-five o’clock.'},
            {'label': 'D', 'teks': 'It is half past eleven.'}
        ],
        'kunci_jawaban': 'A',
        'pembahasan': 'Jam 11.45 berarti kurang seperempat jam menuju jam 12: "It is a quarter to twelve" (A).'
    },
    {
        'nomor': 58,
        'semester': 'Semester 2',
        'chapter': 'Chapter 4: My School Activities',
        'unit': 'Unit 2: My Online Class',
        'tipe': 'pg_sederhana',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Telling Time: Minutes To',
        'capaian_pembelajaran': 'Menyatakan waktu sepuluh menit menuju jam berikutnya.',
        'bacaan': None,
        'gambar': ['bab5_clock_soal8.png'],
        'teks_soal': 'Look at the digital clock below!\nWhat time is it?',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'It is ten to ten.'},
            {'label': 'B', 'teks': 'It is nine to fifty.'},
            {'label': 'C', 'teks': 'It is ten past nine.'},
            {'label': 'D', 'teks': 'It is fifty past ten.'}
        ],
        'kunci_jawaban': 'A',
        'pembahasan': 'Jam 09.50 berarti kurang 10 menit menuju jam 10: "It is ten to ten" (A).'
    },
    {
        'nomor': 59,
        'semester': 'Semester 2',
        'chapter': 'Chapter 4: My School Activities',
        'unit': 'Unit 2: My Online Class',
        'tipe': 'pg_sederhana',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Telling Time: Minutes To',
        'capaian_pembelajaran': 'Menyatakan waktu dua puluh menit menuju jam satu.',
        'bacaan': None,
        'gambar': ['bab5_clock_soal9.png'],
        'teks_soal': 'Look at the digital clock below!\nWhat time is it?',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'It is twenty to one.'},
            {'label': 'B', 'teks': 'It is forty past twelve.'},
            {'label': 'C', 'teks': 'It is twenty past one.'},
            {'label': 'D', 'teks': 'It is half past twelve.'}
        ],
        'kunci_jawaban': 'A',
        'pembahasan': 'Jam 12.40 berarti kurang 20 menit menuju jam 1: "It is twenty to one" (A).'
    },
    {
        'nomor': 60,
        'semester': 'Semester 2',
        'chapter': 'Chapter 4: My School Activities',
        'unit': 'Unit 2: My Online Class',
        'tipe': 'pg_sederhana',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Telling Time: Precise Minutes To',
        'capaian_pembelajaran': 'Menyatakan waktu menit ganjil presisi sebelum jam genap.',
        'bacaan': None,
        'gambar': ['bab5_clock_soal10.png'],
        'teks_soal': 'Look at the digital clock below!\nWhat time is it?',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'It is eight minutes to two.'},
            {'label': 'B', 'teks': 'It is fifty-two minutes past one.'},
            {'label': 'C', 'teks': 'It is eight past two.'},
            {'label': 'D', 'teks': 'It is two to eight.'}
        ],
        'kunci_jawaban': 'A',
        'pembahasan': 'Jam 01.52 berarti kurang 8 menit menuju jam 2: "It is eight minutes to two" (A).'
    },

    # ========================================================
    # UNIT 3: My Study Habits (Soal 61-65)
    # ========================================================
    {
        'nomor': 61,
        'semester': 'Semester 2',
        'chapter': 'Chapter 4: My School Activities',
        'unit': 'Unit 3: My Study Habits',
        'tipe': 'pg_sederhana',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Digital Habits and Student Productivity',
        'capaian_pembelajaran': 'Menganalisis data survei kebiasaan belajar dan pemanfaatan gawai di kalangan siswa SMP.',
        'bacaan': {
            'grup': 'survei_gawai_belajar',
            'teks': 'Read the school survey report below for questions number 61 to 65!\n\nSURVEY DATA: SCREEN TIME & STUDENT PRODUCTIVITY (SMP NUSANTARA, 240 STUDENTS)\n• 45% of students (108 students) use gadgets primarily for Collaborative Learning & Digital Creation (designing e-magazines, programming robots, and practicing English).\n• 35% of students (84 students) use gadgets mainly for Social Media & Short Videos.\n• 20% of students (48 students) use gadgets mainly for Online Gaming.\n\nStudent Reflection — Nadia (Grade 7A): ”In my view, laptops and tablets are super beneficial when we work together in the library. However, we must always set a daily time limit for social media so we stay productive and don’t lose focus.”',
            'gambar': ['bab21_students_digital_robotics.jpg']
        },
        'gambar': ['bab21_students_digital_robotics.jpg'],
        'teks_soal': 'What is the main finding regarding students who use gadgets productively at SMP Nusantara?',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'Almost half of the students (45%) utilize gadgets for collaborative learning and digital creation.'},
            {'label': 'B', 'teks': 'All students spend 10 hours a day playing video games.'},
            {'label': 'C', 'teks': 'Gadgets are strictly banned inside the library.'},
            {'label': 'D', 'teks': 'No student uses tablets for English learning.'}
        ],
        'kunci_jawaban': 'A',
        'pembahasan': 'Data survei menunjukkan 45% (108 siswa) memanfaatkan gawai untuk collaborative learning dan kreasi digital (A).'
    },
    {
        'nomor': 62,
        'semester': 'Semester 2',
        'chapter': 'Chapter 4: My School Activities',
        'unit': 'Unit 3: My Study Habits',
        'tipe': 'pg_sederhana',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Grammar Focus: Adverbs of Frequency',
        'capaian_pembelajaran': 'Menerapkan kata keterangan frekuensi (always, usually, sometimes, never) dalam mendeskripsikan kebiasaan belajar.',
        'bacaan': {
            'grup': 'survei_gawai_belajar',
            'teks': 'Refer to the study habits text.'
        },
        'gambar': [],
        'teks_soal': 'Nadia studies every single day without missing a day. Which adverb of frequency correctly completes the sentence?\n”Nadia ... reviews her class notes before going to bed.”',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'never'},
            {'label': 'B', 'teks': 'rarely'},
            {'label': 'C', 'teks': 'always'},
            {'label': 'D', 'teks': 'seldom'}
        ],
        'kunci_jawaban': 'C',
        'pembahasan': 'Karena dilakukan setiap hari 100% tanpa putus, kata keterangan frekuensi yang tepat adalah "always" (selalu) (C).'
    },
    {
        'nomor': 63,
        'semester': 'Semester 2',
        'chapter': 'Chapter 4: My School Activities',
        'unit': 'Unit 3: My Study Habits',
        'tipe': 'pg_kompleks',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Positive Study Habits',
        'capaian_pembelajaran': 'Mengidentifikasi kebiasaan belajar efektif berbantuan teknologi digital.',
        'bacaan': {
            'grup': 'survei_gawai_belajar',
            'teks': 'Refer to the survey text.'
        },
        'gambar': ['bab21_students_digital_robotics.jpg'],
        'teks_soal': '[Pilihan Ganda Kompleks — Pilih Dua Jawaban Benar!]\nAccording to Nadia’s reflection and the survey, which TWO habits support high academic productivity? (Choose TWO correct answers)',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'Working collaboratively on digital learning projects in the library.'},
            {'label': 'B', 'teks': 'Setting a clear daily time limit for social media and short videos.'},
            {'label': 'C', 'teks': 'Scrolling social media until 3 AM on school nights.'},
            {'label': 'D', 'teks': 'Skipping study sessions to play games during class.'}
        ],
        'kunci_jawaban': 'A, B',
        'pembahasan': 'Dua kebiasaan positif yang disarankan adalah kolaborasi belajar digital di perpustakaan (A) dan membatasi waktu media sosial secara disiplin (B).'
    },
    {
        'nomor': 64,
        'semester': 'Semester 2',
        'chapter': 'Chapter 4: My School Activities',
        'unit': 'Unit 3: My Study Habits',
        'tipe': 'benar_salah',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'True/False Survey Data Evaluation',
        'capaian_pembelajaran': 'Memverifikasi perbandingan persentase data survei siswa.',
        'bacaan': {
            'grup': 'survei_gawai_belajar',
            'teks': 'Refer to the survey text.'
        },
        'gambar': ['bab21_students_digital_robotics.jpg'],
        'teks_soal': '[Tabel Benar / Salah (True or False)] Give a tick in the True or False column based on the survey data!',
        'pernyataan': [
            {'teks': 'More students use gadgets for collaborative learning (108) than for online gaming (48).', 'jawaban': 'B'},
            {'teks': 'Social media and short videos account for 35% of total screen time.', 'jawaban': 'B'},
            {'teks': 'Nadia suggests that students should never touch computers for school work.', 'jawaban': 'S'}
        ],
        'kunci_jawaban': 'B,B,S',
        'pembahasan': '(a) Benar: 108 siswa (45%) > 48 siswa (20%). (b) Benar: Media sosial sebesar 35%. (c) Salah: Nadia justru mendukung pemanfaatan laptop/tablet untuk proyek bersama.'
    },
    {
        'nomor': 65,
        'semester': 'Semester 2',
        'chapter': 'Chapter 4: My School Activities',
        'unit': 'Unit 3: My Study Habits',
        'tipe': 'pg_sederhana',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Expressing Opinion in Discourse',
        'capaian_pembelajaran': 'Mengidentifikasi frasa pengantar opini pribadi (introducing personal opinion).',
        'bacaan': {
            'grup': 'survei_gawai_belajar',
            'teks': 'Refer to Nadia’s quote in the survey text.'
        },
        'gambar': [],
        'teks_soal': 'Which phrase did Nadia use to state her personal viewpoint?',
        'opsi_jawaban': [
            {'label': 'A', 'teks': '”In my view, ...”'},
            {'label': 'B', 'teks': '”I strictly forbid you to ...”'},
            {'label': 'C', 'teks': '”The teacher ordered us to ...”'},
            {'label': 'D', 'teks': '”Never believe that ...”'}
        ],
        'kunci_jawaban': 'A',
        'pembahasan': 'Nadia menyatakan pandangan pribadinya dengan frasa pengantar opini: "In my view, ..." (A).'
    }
]

print(f"Loaded Part 2: {len(SOAL_PART2)} questions (Soal 31-65).")
