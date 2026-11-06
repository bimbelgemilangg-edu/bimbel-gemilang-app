# scripts/kmerdeka_questions_part3.py
# Chapter 5: This is My School (Unit 1, 2, 3)

SOAL_PART3 = [
    # ========================================================
    # CHAPTER 5: THIS IS MY SCHOOL (SEMESTER 2)
    # UNIT 1: School Buildings (Soal 66-70)
    # ========================================================
    {
        'nomor': 66,
        'semester': 'Semester 2',
        'chapter': 'Chapter 5: This is My School',
        'unit': 'Unit 1: School Buildings',
        'tipe': 'pg_sederhana',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Describing School Buildings & Direction',
        'capaian_pembelajaran': 'Mendeskripsikan denah gedung sekolah, fasilitas belajar, dan arah lokasi dalam bahasa Inggris.',
        'bacaan': {
            'grup': 'gedung_smp_nusantara',
            'teks': 'Read the descriptive passage below for questions number 66 to 70!\n\nSMP Nusantara is a green and modern junior high school located in a peaceful area. The school has three main two-story buildings surrounding a spacious green courtyard. As you enter through the main gate, the administration office and teachers’ room are on your left. Directly in front of the gate across the courtyard is the Digital Library, which stores thousands of e-books and printed references. Next to the library on the right wing is the Integrated Science Laboratory and the Robotics Makerspace. The school cafeteria and eco-garden are behind the main hall. Every building is equipped with ramps for wheelchair accessibility, wide glass windows for natural lighting, and waste separation bins.',
            'gambar': []
        },
        'gambar': [],
        'teks_soal': 'Where is the Digital Library located according to the description?',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'Behind the parking lot outside the school complex.'},
            {'label': 'B', 'teks': 'Directly in front of the main gate across the courtyard.'},
            {'label': 'C', 'teks': 'Inside the principal’s private garage.'},
            {'label': 'D', 'teks': 'Under the sports field stadium.'}
        ],
        'kunci_jawaban': 'B',
        'pembahasan': 'Teks menyatakan: "Directly in front of the gate across the courtyard is the Digital Library...". Pilihan B tepat.'
    },
    {
        'nomor': 67,
        'semester': 'Semester 2',
        'chapter': 'Chapter 5: This is My School',
        'unit': 'Unit 1: School Buildings',
        'tipe': 'pg_sederhana',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'School Facilities Function',
        'capaian_pembelajaran': 'Mengidentifikasi fungsi ruangan dan fasilitas laboratorium sains serta ruang kreasi robotika.',
        'bacaan': {
            'grup': 'gedung_smp_nusantara',
            'teks': 'Refer to the SMP Nusantara school buildings text.'
        },
        'gambar': [],
        'teks_soal': 'In which facility can students practice coding robots and doing science experiments?',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'The school parking lot.'},
            {'label': 'B', 'teks': 'The Integrated Science Laboratory and Robotics Makerspace.'},
            {'label': 'C', 'teks': 'The school cafeteria.'},
            {'label': 'D', 'teks': 'The security guard post.'}
        ],
        'kunci_jawaban': 'B',
        'pembahasan': 'Fasilitas untuk eksperimen sains dan robotika adalah "Integrated Science Laboratory and Robotics Makerspace" (B).'
    },
    {
        'nomor': 68,
        'semester': 'Semester 2',
        'chapter': 'Chapter 5: This is My School',
        'unit': 'Unit 1: School Buildings',
        'tipe': 'pg_kompleks',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Facility Features Analysis',
        'capaian_pembelajaran': 'Menganalisis fasilitas ramah lingkungan dan aksesibilitas inklusif di lingkungan sekolah.',
        'bacaan': {
            'grup': 'gedung_smp_nusantara',
            'teks': 'Refer to the SMP Nusantara school buildings text.'
        },
        'gambar': [],
        'teks_soal': '[Pilihan Ganda Kompleks — Pilih Dua Jawaban Benar!]\nWhich two eco-friendly and inclusive features are highlighted in the school buildings? (Choose TWO correct answers)',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'Ramps for wheelchair accessibility and inclusive mobility.'},
            {'label': 'B', 'teks': 'Wide glass windows for natural lighting and waste separation bins.'},
            {'label': 'C', 'teks': 'High smoke chimneys burning coal inside classrooms.'},
            {'label': 'D', 'teks': 'Single-use plastic cups provided in every corridor.'}
        ],
        'kunci_jawaban': 'A, B',
        'pembahasan': 'Fasilitas inklusif & hijau meliputi jalur landai kursi roda (A) serta jendela kaca lebar hemat energi dan tempat sampah pilah (B).'
    },
    {
        'nomor': 69,
        'semester': 'Semester 2',
        'chapter': 'Chapter 5: This is My School',
        'unit': 'Unit 1: School Buildings',
        'tipe': 'benar_salah',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'True/False Layout Verification',
        'capaian_pembelajaran': 'Memvalidasi detail tata letak ruangan sekolah pada teks deskriptif.',
        'bacaan': {
            'grup': 'gedung_smp_nusantara',
            'teks': 'Refer to the SMP Nusantara school buildings text.'
        },
        'gambar': [],
        'teks_soal': '[Tabel Benar / Salah (True or False)] Give a tick in the True or False column based on the school layout!',
        'pernyataan': [
            {'teks': 'The administration office and teachers’ room are on the left as you enter the gate.', 'jawaban': 'B'},
            {'teks': 'The school has no green courtyard and is covered completely in dark mud.', 'jawaban': 'S'},
            {'teks': 'The cafeteria and eco-garden are situated behind the school main hall.', 'jawaban': 'B'}
        ],
        'kunci_jawaban': 'B,S,B',
        'pembahasan': '(a) Benar: Ruang guru & TU di sebelah kiri gerbang. (b) Salah: Sekolah memiliki halaman rumput hijau yang luas. (c) Benar: Kantin dan taman lingkungan berada di belakang aula utama.'
    },
    {
        'nomor': 70,
        'semester': 'Semester 2',
        'chapter': 'Chapter 5: This is My School',
        'unit': 'Unit 1: School Buildings',
        'tipe': 'pg_sederhana',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Vocabulary: Architecture & Space',
        'capaian_pembelajaran': 'Menentukan arti kata sifat deskripsi ruangan luas dan terbuka.',
        'bacaan': None,
        'gambar': [],
        'teks_soal': '”The school has three main two-story buildings surrounding a spacious green courtyard.”\nWhat does the word ”spacious” mean?',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'Large, roomy, and having lots of open space.'},
            {'label': 'B', 'teks': 'Extremely narrow and cramped.'},
            {'label': 'C', 'teks': 'Very dark and dangerous.'},
            {'label': 'D', 'teks': 'Completely flooded with dirty water.'}
        ],
        'kunci_jawaban': 'A',
        'pembahasan': 'Kata "spacious" berarti luas, lapang, dan beruang terbuka banyak (large and having ample space) (A).'
    },

    # ========================================================
    # UNIT 2: Extracurricular Activities (Soal 71-75)
    # ========================================================
    {
        'nomor': 71,
        'semester': 'Semester 2',
        'chapter': 'Chapter 5: This is My School',
        'unit': 'Unit 2: Extracurricular Activities',
        'tipe': 'pg_sederhana',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Extracurricular Club Comparison',
        'capaian_pembelajaran': 'Menganalisis tabel perbandingan klub ekstrakurikuler sekolah dan biaya keikutsertaan.',
        'bacaan': {
            'grup': 'tabel_ekskul_smp',
            'teks': 'Study the Extracurricular Clubs table below for questions number 71 to 75!\n\n[SMP NUSANTARA EXTRACURRICULAR CLUBS]\n1. CLUB 1: BADMINTON CLUB\n   • Training Days: Tuesday & Thursday (03.30 – 05.00 PM)\n   • Venue: Indoor Sports Hall (Room 12)\n   • Coach: Coach Bima (Certified PBSI Coach)\n   • Monthly Fee: Rp45.000 (shuttlecocks maintenance)\n   • Target: All Grades (7, 8, 9)\n\n2. CLUB 2: SCOUT (PRAMUKA)\n   • Training Days: Friday afternoon (02.00 – 04.00 PM)\n   • Venue: School Courtyard & Scout Base\n   • Coach: Kak Dimas\n   • Monthly Fee: Rp0 (Free / Funded by School Operational BOS)\n   • Target: Mandatory for Grade 7, optional for Grade 8 & 9\n\n3. CLUB 3: ROBOTICS & CODING CLUB\n   • Training Days: Saturday morning (08.30 – 11.00 AM)\n   • Venue: Robotics Makerspace\n   • Coach: Mr. Indra\n   • Monthly Fee: Rp50.000 (microcontroller components & sensors)\n   • Target: Grade 7 & 8',
            'gambar': ['eval4_ekskul_table.png']
        },
        'gambar': ['eval4_ekskul_table.png'],
        'teks_soal': 'Which extracurricular club has NO monthly fee (Rp0 / Free) and is mandatory for all Grade 7 students?',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'Club 1: Badminton Club'},
            {'label': 'B', 'teks': 'Club 2: Scout (Pramuka)'},
            {'label': 'C', 'teks': 'Club 3: Robotics & Coding Club'},
            {'label': 'D', 'teks': 'All clubs require a mandatory Rp100.000 fee.'}
        ],
        'kunci_jawaban': 'B',
        'pembahasan': 'Tabel menunjukkan Club 2: Scout berbiaya Rp0 (gratis didanai BOS) dan wajib bagi siswa Kelas 7 (B).'
    },
    {
        'nomor': 72,
        'semester': 'Semester 2',
        'chapter': 'Chapter 5: This is My School',
        'unit': 'Unit 2: Extracurricular Activities',
        'tipe': 'pg_sederhana',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Cost Calculation in Club Activities',
        'capaian_pembelajaran': 'Menghitung total biaya iuran kegiatan ekstrakurikuler dalam bahasa Inggris.',
        'bacaan': {
            'grup': 'tabel_ekskul_smp',
            'teks': 'Refer to the Extracurricular Clubs table.'
        },
        'gambar': ['eval4_ekskul_table.png'],
        'teks_soal': 'Andre wants to join both the Badminton Club (Rp45.000/month) and Robotics Club (Rp50.000/month). What is his total monthly fee?',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'Rp45.000'},
            {'label': 'B', 'teks': 'Rp50.000'},
            {'label': 'C', 'teks': 'Rp95.000'},
            {'label': 'D', 'teks': 'Rp150.000'}
        ],
        'kunci_jawaban': 'C',
        'pembahasan': 'Total iuran bulanan: Rp45.000 + Rp50.000 = Rp95.000 (C).'
    },
    {
        'nomor': 73,
        'semester': 'Semester 2',
        'chapter': 'Chapter 5: This is My School',
        'unit': 'Unit 2: Extracurricular Activities',
        'tipe': 'pg_kompleks',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Club Scheduling & Eligibility',
        'capaian_pembelajaran': 'Menganalisis kesesuaian waktu latihan dan tingkatan kelas pada ekstrakurikuler.',
        'bacaan': {
            'grup': 'tabel_ekskul_smp',
            'teks': 'Refer to the Extracurricular Clubs table.'
        },
        'gambar': ['eval4_ekskul_table.png'],
        'teks_soal': '[Pilihan Ganda Kompleks — Pilih Dua Jawaban Benar!]\nWhich two statements are TRUE based on the extracurricular schedule? (Choose TWO correct answers)',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'Badminton Club trains twice a week on Tuesday and Thursday afternoons.'},
            {'label': 'B', 'teks': 'Robotics Club holds its training sessions on Saturday mornings in the Makerspace.'},
            {'label': 'C', 'teks': 'Scout training is held at midnight on Sunday in the science laboratory.'},
            {'label': 'D', 'teks': 'Grade 7 students are strictly forbidden from joining any club.'}
        ],
        'kunci_jawaban': 'A, B',
        'pembahasan': 'Pilihan A benar (Badminton latihan Selasa & Kamis sore) dan B benar (Robotika latihan Sabtu pagi di Makerspace).'
    },
    {
        'nomor': 74,
        'semester': 'Semester 2',
        'chapter': 'Chapter 5: This is My School',
        'unit': 'Unit 2: Extracurricular Activities',
        'tipe': 'benar_salah',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'True/False Extracurricular Verification',
        'capaian_pembelajaran': 'Memverifikasi keabsahan data tempat dan pelatih kegiatan sekolah.',
        'bacaan': {
            'grup': 'tabel_ekskul_smp',
            'teks': 'Refer to the Extracurricular Clubs table.'
        },
        'gambar': ['eval4_ekskul_table.png'],
        'teks_soal': '[Tabel Benar / Salah (True or False)] Give a tick in the True or False column based on the club table!',
        'pernyataan': [
            {'teks': 'Coach Bima is a certified PBSI coach leading the Badminton Club in Room 12.', 'jawaban': 'B'},
            {'teks': 'Badminton Club and Robotics Club have a direct schedule conflict on Tuesday afternoon.', 'jawaban': 'S'},
            {'teks': 'Club 2 (Scout) is funded by the school so students pay zero monthly fee.', 'jawaban': 'B'}
        ],
        'kunci_jawaban': 'B,S,B',
        'pembahasan': '(a) Benar: Pelatih bulutangkis adalah Coach Bima bersertifikat PBSI di Room 12. (b) Salah: Badminton Selasa/Kamis sore, sedangkan Robotika Sabtu pagi, jadi tidak ada bentrok jadwal. (c) Benar: Pramuka gratis didanai sekolah.'
    },
    {
        'nomor': 75,
        'semester': 'Semester 2',
        'chapter': 'Chapter 5: This is My School',
        'unit': 'Unit 2: Extracurricular Activities',
        'tipe': 'pg_sederhana',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Recommending Appropriate Activities',
        'capaian_pembelajaran': 'Memberikan rekomendasi kegiatan ekstrakurikuler yang sesuai dengan minat dan bakat teman.',
        'bacaan': {
            'grup': 'tabel_ekskul_smp',
            'teks': 'Andre loves computer programming and building microcontrollers. Galang asks him which club he should sign up for.'
        },
        'gambar': ['eval4_ekskul_table.png'],
        'teks_soal': 'Which club is the MOST SUITABLE for Andre based on his hobby?',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'Club 3: Robotics & Coding Club on Saturday morning.'},
            {'label': 'B', 'teks': 'Cooking Club'},
            {'label': 'C', 'teks': 'Traditional Dance Club'},
            {'label': 'D', 'teks': 'Swimming Club'}
        ],
        'kunci_jawaban': 'A',
        'pembahasan': 'Karena Andre gemar coding dan merakit komponen komputer, klub paling tepat adalah Robotics & Coding Club (A).'
    },

    # ========================================================
    # UNIT 3: School Festival (Soal 76-80)
    # ========================================================
    {
        'nomor': 76,
        'semester': 'Semester 2',
        'chapter': 'Chapter 5: This is My School',
        'unit': 'Unit 3: School Festival',
        'tipe': 'pg_sederhana',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Comparing Event Posters',
        'capaian_pembelajaran': 'Menganalisis dan membandingkan informasi teks poster pengumuman festival sekolah.',
        'bacaan': {
            'grup': 'poster_festival_sekolah',
            'teks': 'Observe and compare the two school event posters below for questions number 76 to 80!\n\n[POSTER A: SCHOOL SCIENCE FAIR 2026]\n• Date & Time: Saturday, 14 November 2026 (08.00 AM – 02.00 PM)\n• Venue: School Main Hall\n• Participation Rule: Team of 3 Students (bring your own project materials; registration closes 10 November 2026)\n• Registration Fee: Free for all SMP students\n\n[POSTER B: ENGLISH STORYTELLING FESTIVAL 2026]\n• Date & Time: Sunday, 15 November 2026 (09.00 AM – 01.00 PM)\n• Venue: School Auditorium\n• Participation Rule: Individual / Solo Participant (7-minute Indonesian folktale in English; traditional costume is optional)\n• Registration Fee: Free for all SMP students',
            'gambar': ['bab21_school_festival_posters.jpg']
        },
        'gambar': ['bab21_school_festival_posters.jpg'],
        'teks_soal': 'What is the main difference between the participation rules in Poster A and Poster B?',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'Poster A requires a team of 3 students, whereas Poster B is for individual (solo) participants.'},
            {'label': 'B', 'teks': 'Poster A is only for teachers, while Poster B is for parents.'},
            {'label': 'C', 'teks': 'Poster A charges Rp200.000, while Poster B is completely free.'},
            {'label': 'D', 'teks': 'Poster A takes place on Monday morning at 6 AM.'}
        ],
        'kunci_jawaban': 'A',
        'pembahasan': 'Poster A mewajibkan tim beranggotakan 3 siswa (team of 3), sedangkan Poster B adalah kompetisi individu/solo (A).'
    },
    {
        'nomor': 77,
        'semester': 'Semester 2',
        'chapter': 'Chapter 5: This is My School',
        'unit': 'Unit 3: School Festival',
        'tipe': 'pg_sederhana',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Comparing Event Duration & Schedule',
        'capaian_pembelajaran': 'Membandingkan durasi waktu dan tanggal pelaksanaan dua kegiatan festival sekolah.',
        'bacaan': {
            'grup': 'poster_festival_sekolah',
            'teks': 'Refer to the School Event Posters.'
        },
        'gambar': ['bab21_school_festival_posters.jpg'],
        'teks_soal': 'Compare the duration of the two events! Which statement is CORRECT?',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'The Science Fair lasts for 6 hours (08.00 AM – 02.00 PM), which is 2 hours longer than the Storytelling Festival (4 hours).'},
            {'label': 'B', 'teks': 'Both events last for exactly 10 hours.'},
            {'label': 'C', 'teks': 'The Storytelling Festival lasts longer than the Science Fair.'},
            {'label': 'D', 'teks': 'The Science Fair only lasts for 30 minutes.'}
        ],
        'kunci_jawaban': 'A',
        'pembahasan': 'Science Fair: 08.00–14.00 (6 jam). Storytelling Festival: 09.00–13.00 (4 jam). Selisihnya adalah 2 jam lebih lama (A).'
    },
    {
        'nomor': 78,
        'semester': 'Semester 2',
        'chapter': 'Chapter 5: This is My School',
        'unit': 'Unit 3: School Festival',
        'tipe': 'pg_kompleks',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Event Facts Analysis',
        'capaian_pembelajaran': 'Menganalisis jadwal dan tempat kompetisi festival.',
        'bacaan': {
            'grup': 'poster_festival_sekolah',
            'teks': 'Refer to the School Event Posters.'
        },
        'gambar': ['bab21_school_festival_posters.jpg'],
        'teks_soal': '[Pilihan Ganda Kompleks — Pilih Dua Jawaban Benar!]\nDimas wants to join both events with his friends. Which two statements are TRUE based on the posters? (Choose TWO correct answers)',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'Dimas can join the Science Fair on Saturday and the Storytelling Festival on Sunday because the dates do not conflict.'},
            {'label': 'B', 'teks': 'Both competitions are free of charge (free registration) for all SMP students.'},
            {'label': 'C', 'teks': 'Both events take place in the school swimming pool.'},
            {'label': 'D', 'teks': 'Students must pay a registration fee of Rp150.000 for each event.'}
        ],
        'kunci_jawaban': 'A, B',
        'pembahasan': 'Pilihan A benar (Sabtu 14 Nov vs Minggu 15 Nov, jadwal tidak bentrok) dan B benar (kedua acara gratis untuk seluruh siswa SMP).'
    },
    {
        'nomor': 79,
        'semester': 'Semester 2',
        'chapter': 'Chapter 5: This is My School',
        'unit': 'Unit 3: School Festival',
        'tipe': 'benar_salah',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'True/False Festival Posters Verification',
        'capaian_pembelajaran': 'Memvalidasi rincian persyaratan lomba pada poster pengumuman.',
        'bacaan': {
            'grup': 'poster_festival_sekolah',
            'teks': 'Refer to the School Event Posters.'
        },
        'gambar': ['bab21_school_festival_posters.jpg'],
        'teks_soal': '[Tabel Benar / Salah (True or False)] Give a tick in the True or False column based on the posters!',
        'pernyataan': [
            {'teks': 'The School Science Fair is held in the School Main Hall on Saturday, 14 November 2026.', 'jawaban': 'B'},
            {'teks': 'In the Storytelling Festival, participants perform a 7-minute Indonesian folktale in English.', 'jawaban': 'B'},
            {'teks': 'Wearing expensive traditional costumes is strictly mandatory for the Storytelling Festival.', 'jawaban': 'S'}
        ],
        'kunci_jawaban': 'B,B,S',
        'pembahasan': '(a) Benar: Science Fair di Aula Utama pada Sabtu 14 Nov. (b) Benar: Storytelling berdurasi 7 menit berbahasa Inggris tentang cerita rakyat Indonesia. (c) Salah: Kostum tradisional bersifat opsional (optional), bukan wajib.'
    },
    {
        'nomor': 80,
        'semester': 'Semester 2',
        'chapter': 'Chapter 5: This is My School',
        'unit': 'Unit 3: School Festival',
        'tipe': 'pg_sederhana',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Congratulating Expressions in School Events',
        'capaian_pembelajaran': 'Mengucapkan ucapan selamat (congratulations) atas prestasi teman dalam festival sekolah.',
        'bacaan': None,
        'gambar': [],
        'teks_soal': 'Dimas wins First Place in the English Storytelling Festival. What should his classmates say to congratulate him?',
        'opsi_jawaban': [
            {'label': 'A', 'teks': '”Congratulations on winning first prize, Dimas! Your storytelling was truly inspiring.”'},
            {'label': 'B', 'teks': '”I am so sorry for your terrible loss.”'},
            {'label': 'C', 'teks': '”Don’t mention it, you are welcome.”'},
            {'label': 'D', 'teks': '”Please forgive me for not knowing you.”'}
        ],
        'kunci_jawaban': 'A',
        'pembahasan': 'Ucapan selamat yang tepat atas kemenangan juara 1 adalah: "Congratulations on winning first prize, Dimas! Your storytelling was truly inspiring" (A).'
    }
]

print(f"Loaded Part 3: {len(SOAL_PART3)} questions (Soal 66-80).")
