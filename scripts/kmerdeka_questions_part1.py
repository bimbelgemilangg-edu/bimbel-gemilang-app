# scripts/kmerdeka_questions_part1.py
# Chapter 1: About Me (Unit 1, Unit 2, Unit 3) & Chapter 2: Culinary and Me (Unit 1, Unit 2, Unit 3)

SOAL_PART1 = [
    # ========================================================
    # CHAPTER 1: ABOUT ME (SEMESTER 1)
    # UNIT 1: Galang from Kalimantan (Soal 1-5)
    # ========================================================
    {
        'nomor': 1,
        'semester': 'Semester 1',
        'chapter': 'Chapter 1: About Me',
        'unit': 'Unit 1: Galang from Kalimantan',
        'tipe': 'pg_sederhana',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Greetings & Self Introduction',
        'capaian_pembelajaran': 'Mengidentifikasi dan menggunakan ungkapan sapaan, perkenalan diri, dan informasi identitas pribadi sesuai CP Fase D.',
        'bacaan': {
            'grup': 'dialog_galang_mr_rahmat',
            'teks': 'Read the dialogue below for questions number 1 to 5!\n\nGalang : Good morning, Sir. Excuse me, are you Mr. Rahmat, the new English teacher?\nMr. Rahmat : Good morning. Yes, I am. And what is your name?\nGalang : Allow me to introduce myself, Sir. My name is Galang Pratama from Class VII-A. I come from Kalimantan and now I live in SMP Nusantara dormitory. Welcome to our school!\nMr. Rahmat : Thank you, Galang. It’s a pleasure to meet you. By the way, I need to go to the teachers’ office now. See you in class at 9 o’clock.\nGalang : It’s a pleasure to meet you too, Sir. Have a nice day!',
            'gambar': []
        },
        'gambar': [],
        'teks_soal': 'Where does Galang come from and which class is he in?',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'He comes from Sumatra and he is in Class VII-B.'},
            {'label': 'B', 'teks': 'He comes from Kalimantan and he is in Class VII-A.'},
            {'label': 'C', 'teks': 'He comes from Java and he is in Class VIII-A.'},
            {'label': 'D', 'teks': 'He comes from Bali and he is in Class IX-C.'}
        ],
        'kunci_jawaban': 'B',
        'pembahasan': 'Berdasarkan dialog, Galang menyatakan: "My name is Galang Pratama from Class VII-A. I come from Kalimantan...". Pilihan B tepat.'
    },
    {
        'nomor': 2,
        'semester': 'Semester 1',
        'chapter': 'Chapter 1: About Me',
        'unit': 'Unit 1: Galang from Kalimantan',
        'tipe': 'pg_sederhana',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Grammar Focus: To Be (am, is, are)',
        'capaian_pembelajaran': 'Menerapkan kaidah tata bahasa dasar to be dan kata ganti orang dalam kalimat perkenalan diri dan orang lain.',
        'bacaan': {
            'grup': 'dialog_galang_mr_rahmat',
            'teks': 'Galang is introducing his new friend, Andre, to Mr. Rahmat.'
        },
        'gambar': [],
        'teks_soal': 'Complete the sentences with the correct form of "to be"!\n"Andre and Galang ... new students at SMP Nusantara. Galang ... from Kalimantan, while Andre ... from Surabaya."',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'is – are – is'},
            {'label': 'B', 'teks': 'are – is – is'},
            {'label': 'C', 'teks': 'am – is – are'},
            {'label': 'D', 'teks': 'are – am – are'}
        ],
        'kunci_jawaban': 'B',
        'pembahasan': 'Subjek jamak "Andre and Galang" memakai "are". Subjek tunggal orang ketiga "Galang" dan "Andre" memakai "is". Urutan yang tepat adalah are – is – is (B).'
    },
    {
        'nomor': 3,
        'semester': 'Semester 1',
        'chapter': 'Chapter 1: About Me',
        'unit': 'Unit 1: Galang from Kalimantan',
        'tipe': 'pg_kompleks',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Greetings & Introductions',
        'capaian_pembelajaran': 'Menganalisis ungkapan sapaan dan perkenalan formal dan kasual dalam situasi sekolah.',
        'bacaan': {
            'grup': 'dialog_galang_mr_rahmat',
            'teks': 'Refer to the dialogue between Galang and Mr. Rahmat.'
        },
        'gambar': [],
        'teks_soal': '[Pilihan Ganda Kompleks — Pilih Dua Jawaban Benar!]\nWhich of the following expressions in the dialogue are used for INTRODUCING ONESELF? (Choose TWO correct answers)',
        'opsi_jawaban': [
            {'label': 'A', 'teks': '”Allow me to introduce myself, Sir.”'},
            {'label': 'B', 'teks': '”My name is Galang Pratama from Class VII-A.”'},
            {'label': 'C', 'teks': '”See you in class at 9 o’clock.”'},
            {'label': 'D', 'teks': '”I need to go to the teachers’ office now.”'}
        ],
        'kunci_jawaban': 'A, B',
        'pembahasan': 'Ungkapan untuk memperkenalkan diri (introducing oneself) adalah "Allow me to introduce myself, Sir" (A) dan "My name is Galang Pratama..." (B). Pilihan C adalah leave-taking (berpamitan).'
    },
    {
        'nomor': 4,
        'semester': 'Semester 1',
        'chapter': 'Chapter 1: About Me',
        'unit': 'Unit 1: Galang from Kalimantan',
        'tipe': 'benar_salah',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Evaluating Dialogue Statements',
        'capaian_pembelajaran': 'Mengevaluasi kebenaran informasi faktual dalam dialog sapaan dan perkenalan.',
        'bacaan': {
            'grup': 'dialog_galang_mr_rahmat',
            'teks': 'Refer to the dialogue between Galang and Mr. Rahmat.'
        },
        'gambar': [],
        'teks_soal': '[Tabel Benar / Salah (True or False)] Read the statements based on the dialogue and give a tick in the True or False column!',
        'pernyataan': [
            {'teks': 'Galang greets Mr. Rahmat politely in the morning before class begins.', 'jawaban': 'B'},
            {'teks': 'Mr. Rahmat is heading towards the school library to borrow books.', 'jawaban': 'S'},
            {'teks': '”Have a nice day!” is used by Galang as a polite leave-taking expression.', 'jawaban': 'B'}
        ],
        'kunci_jawaban': 'B,S,B',
        'pembahasan': '(a) Benar: Galang menyapa dengan sopan "Good morning, Sir". (b) Salah: Mr. Rahmat menuju teachers’ office (ruang guru), bukan perpustakaan. (c) Benar: "Have a nice day!" adalah ungkapan berpamitan santun.'
    },
    {
        'nomor': 5,
        'semester': 'Semester 1',
        'chapter': 'Chapter 1: About Me',
        'unit': 'Unit 1: Galang from Kalimantan',
        'tipe': 'pg_sederhana',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Leave-Taking Expressions',
        'capaian_pembelajaran': 'Menggunakan ungkapan berpamitan (leave-taking) yang tepat sesuai situasi sosial.',
        'bacaan': None,
        'gambar': [],
        'teks_soal': 'Mr. Rahmat says: ”I need to go to the teachers’ office now. See you in class at 9 o’clock.”\nWhat is the most appropriate response for Galang to say?',
        'opsi_jawaban': [
            {'label': 'A', 'teks': '”You’re welcome, Sir.”'},
            {'label': 'B', 'teks': '”See you later, Sir. Have a great day!”'},
            {'label': 'C', 'teks': '”I am very sorry to hear that.”'},
            {'label': 'D', 'teks': '”No problem, don’t mention it.”'}
        ],
        'kunci_jawaban': 'B',
        'pembahasan': 'Respon yang tepat terhadap ucapan berpamitan "See you in class..." adalah "See you later, Sir. Have a great day!" (B).'
    },

    # ========================================================
    # UNIT 2: I Love Fishing (Soal 6-10)
    # ========================================================
    {
        'nomor': 6,
        'semester': 'Semester 1',
        'chapter': 'Chapter 1: About Me',
        'unit': 'Unit 2: I Love Fishing',
        'tipe': 'pg_sederhana',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Talking about Hobbies',
        'capaian_pembelajaran': 'Mendeskripsikan hobi, minat, dan aktivitas waktu luang menggunakan Simple Present Tense.',
        'bacaan': {
            'grup': 'teks_galang_fishing',
            'teks': 'Read the short text below for questions number 6 to 10!\n\nGalang has an exciting hobby. He loves fishing in the calm river near his grandfather’s house in Kalimantan. Every Sunday morning, he prepares his fishing rod, natural bait, and a clean bucket. He usually goes fishing with his father. Galang says that fishing teaches him patience and helps him relax after studying all week. When he catches fresh fish, his mother cooks delicious grilled fish with spicy sambal for lunch.',
            'gambar': []
        },
        'gambar': [],
        'teks_soal': 'Why does Galang love fishing according to the text?',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'Because he wants to sell fish at the traditional market.'},
            {'label': 'B', 'teks': 'Because fishing teaches him patience and helps him relax after studying.'},
            {'label': 'C', 'teks': 'Because his teacher gives him homework to catch fish.'},
            {'label': 'D', 'teks': 'Because he dislikes playing outdoor games with his friends.'}
        ],
        'kunci_jawaban': 'B',
        'pembahasan': 'Teks menyebutkan secara eksplisit: "Galang says that fishing teaches him patience and helps him relax after studying all week." Pilihan B tepat.'
    },
    {
        'nomor': 7,
        'semester': 'Semester 1',
        'chapter': 'Chapter 1: About Me',
        'unit': 'Unit 2: I Love Fishing',
        'tipe': 'pg_sederhana',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Grammar Focus: Simple Present Verbs',
        'capaian_pembelajaran': 'Menerapkan kesesuaian subjek dan kata kerja (subject-verb agreement) pada kalimat afirmatif Simple Present Tense.',
        'bacaan': {
            'grup': 'teks_galang_fishing',
            'teks': 'Refer to Galang’s hobby text.'
        },
        'gambar': [],
        'teks_soal': 'Choose the grammatically correct sentence to describe Galang’s weekly routine!',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'Galang enjoy fishing in the river every Sunday.'},
            {'label': 'B', 'teks': 'Galang enjoys fishing in the river every Sunday.'},
            {'label': 'C', 'teks': 'Galang are enjoying fishing in the river every Sunday.'},
            {'label': 'D', 'teks': 'Galang enjoying fishing in the river every Sunday.'}
        ],
        'kunci_jawaban': 'B',
        'pembahasan': 'Subjek orang ketiga tunggal (Galang = he) dalam Simple Present Tense membutuhkan akhiran -s/-es pada kata kerjanya: "enjoys" (B).'
    },
    {
        'nomor': 8,
        'semester': 'Semester 1',
        'chapter': 'Chapter 1: About Me',
        'unit': 'Unit 2: I Love Fishing',
        'tipe': 'pg_kompleks',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Tools and Equipment for Hobbies',
        'capaian_pembelajaran': 'Mengidentifikasi kosakata benda dan perlengkapan terkait hobi luar ruangan.',
        'bacaan': {
            'grup': 'teks_galang_fishing',
            'teks': 'Refer to Galang’s hobby text.'
        },
        'gambar': [],
        'teks_soal': '[Pilihan Ganda Kompleks — Pilih Dua Jawaban Benar!]\nWhat items does Galang prepare before going fishing? (Choose TWO correct answers)',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'A fishing rod and natural bait.'},
            {'label': 'B', 'teks': 'A clean bucket for keeping the catch.'},
            {'label': 'C', 'teks': 'A badminton racket and shuttlecocks.'},
            {'label': 'D', 'teks': 'A laptop and a computer mouse.'}
        ],
        'kunci_jawaban': 'A, B',
        'pembahasan': 'Dalam teks dinyatakan: "he prepares his fishing rod, natural bait, and a clean bucket". Pilihan A dan B benar.'
    },
    {
        'nomor': 9,
        'semester': 'Semester 1',
        'chapter': 'Chapter 1: About Me',
        'unit': 'Unit 2: I Love Fishing',
        'tipe': 'benar_salah',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Fact Checking in Descriptive Passage',
        'capaian_pembelajaran': 'Memverifikasi kebenaran rincian informasi spesifik pada teks hobi.',
        'bacaan': {
            'grup': 'teks_galang_fishing',
            'teks': 'Refer to Galang’s hobby text.'
        },
        'gambar': [],
        'teks_soal': '[Tabel Benar / Salah (True or False)] Give a tick in the True or False column based on Galang’s fishing hobby!',
        'pernyataan': [
            {'teks': 'Galang always goes fishing alone in the deep sea.', 'jawaban': 'S'},
            {'teks': 'Galang usually goes fishing with his father in a calm river on Sundays.', 'jawaban': 'B'},
            {'teks': 'Galang’s mother cooks the caught fresh fish into delicious grilled fish.', 'jawaban': 'B'}
        ],
        'kunci_jawaban': 'S,B,B',
        'pembahasan': '(a) Salah: Galang memancing di sungai (river), bukan di laut dalam, dan ditemani ayahnya. (b) Benar: Galang memancing bersama ayahnya pada hari Minggu. (c) Benar: Ibunya memasak ikan hasil pancingan menjadi ikan bakar.'
    },
    {
        'nomor': 10,
        'semester': 'Semester 1',
        'chapter': 'Chapter 1: About Me',
        'unit': 'Unit 2: I Love Fishing',
        'tipe': 'pg_sederhana',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Vocabulary in Context',
        'capaian_pembelajaran': 'Menentukan arti kata sifat emosional dan sikap positif dalam teks.',
        'bacaan': None,
        'gambar': [],
        'teks_soal': '”Fishing teaches Galang patience ...”\nWhat is the closest meaning of the word ”patience”?',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'The ability to wait calmly without getting annoyed or angry.'},
            {'label': 'B', 'teks': 'The speed of running very fast in a competition.'},
            {'label': 'C', 'teks': 'The skill of speaking multiple foreign languages.'},
            {'label': 'D', 'teks': 'The strength to lift heavy metal objects.'}
        ],
        'kunci_jawaban': 'A',
        'pembahasan': 'Kata "patience" bermakna kesabaran (the ability to stay calm and wait without complaining). Pilihan A tepat.'
    },

    # ========================================================
    # UNIT 3: My Friends and I (Soal 11-15)
    # ========================================================
    {
        'nomor': 11,
        'semester': 'Semester 1',
        'chapter': 'Chapter 1: About Me',
        'unit': 'Unit 3: My Friends and I',
        'tipe': 'pg_sederhana',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Comparing Identity Profiles',
        'capaian_pembelajaran': 'Membandingkan informasi profil identitas pribadi dua siswa melalui media multimodal kartu pengenal.',
        'bacaan': {
            'grup': 'tabel_profil_monita_andre',
            'teks': 'Compare the two student profile cards below for questions number 11 to 15!\n\n[STUDENT 1: MONITA]\n• Origin: Pontianak\n• Age: 13 years old\n• Hobbies: Reading digital comics & swimming\n• Siblings: 1 older sister\n\n[STUDENT 2: ANDRE]\n• Origin: Surabaya\n• Age: 13 years old\n• Hobbies: Playing badminton & coding games\n• Siblings: Only child (no brothers or sisters)',
            'gambar': ['monita_andre_profile.png']
        },
        'gambar': ['monita_andre_profile.png'],
        'teks_soal': 'What do Monita and Andre have in common according to the profile cards?',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'Both of them are 13 years old.'},
            {'label': 'B', 'teks': 'Both of them come from Pontianak.'},
            {'label': 'C', 'teks': 'Both of them love playing badminton.'},
            {'label': 'D', 'teks': 'Both of them are only children.'}
        ],
        'kunci_jawaban': 'A',
        'pembahasan': 'Kedua kartu profil menunjukkan bahwa Monita berusia 13 tahun dan Andre berusia 13 tahun. Pilihan A tepat.'
    },
    {
        'nomor': 12,
        'semester': 'Semester 1',
        'chapter': 'Chapter 1: About Me',
        'unit': 'Unit 3: My Friends and I',
        'tipe': 'pg_sederhana',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Grammar Focus: Possessive Adjectives',
        'capaian_pembelajaran': 'Menggunakan kata sifat kepemilikan (possessive adjectives: my, his, her, their, our) secara tepat dalam mendeskripsikan orang lain.',
        'bacaan': {
            'grup': 'tabel_profil_monita_andre',
            'teks': 'Refer to the profile cards of Monita and Andre.'
        },
        'gambar': ['monita_andre_profile.png'],
        'teks_soal': 'Complete the sentences with the correct possessive adjectives!\n”Monita is proud of ... older sister. Meanwhile, Andre spends his weekend in ... bedroom coding games with ... laptop.”',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'his – her – his'},
            {'label': 'B', 'teks': 'her – his – his'},
            {'label': 'C', 'teks': 'my – your – their'},
            {'label': 'D', 'teks': 'their – our – her'}
        ],
        'kunci_jawaban': 'B',
        'pembahasan': 'Kepemilikan perempuan tunggal (Monita) menggunakan "her" (her older sister). Kepemilikan laki-laki tunggal (Andre) menggunakan "his" (his bedroom, his laptop). Pilihan B tepat.'
    },
    {
        'nomor': 13,
        'semester': 'Semester 1',
        'chapter': 'Chapter 1: About Me',
        'unit': 'Unit 3: My Friends and I',
        'tipe': 'pg_kompleks',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Profile Comparison Analysis',
        'capaian_pembelajaran': 'Mengidentifikasi detail perbedaan identitas dan hobi antar teman sebaya.',
        'bacaan': {
            'grup': 'tabel_profil_monita_andre',
            'teks': 'Refer to the profile cards of Monita and Andre.'
        },
        'gambar': ['monita_andre_profile.png'],
        'teks_soal': '[Pilihan Ganda Kompleks — Pilih Dua Jawaban Benar!]\nWhich statements are TRUE based on the profile cards? (Choose TWO correct answers)',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'Andre has an interest in coding games and playing badminton.'},
            {'label': 'B', 'teks': 'Monita has one older sister and enjoys swimming.'},
            {'label': 'C', 'teks': 'Monita comes from Surabaya, while Andre comes from Pontianak.'},
            {'label': 'D', 'teks': 'Andre has two younger brothers living with him.'}
        ],
        'kunci_jawaban': 'A, B',
        'pembahasan': 'Pilihan A benar (hobi Andre coding games & badminton). Pilihan B benar (Monita punya 1 older sister & suka berenang). Pilihan C salah (asal kota terbalik), dan D salah (Andre anak tunggal).'
    },
    {
        'nomor': 14,
        'semester': 'Semester 1',
        'chapter': 'Chapter 1: About Me',
        'unit': 'Unit 3: My Friends and I',
        'tipe': 'benar_salah',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'True/False Profile Evaluation',
        'capaian_pembelajaran': 'Menilai keabsahan pernyataan komparatif profil siswa.',
        'bacaan': {
            'grup': 'tabel_profil_monita_andre',
            'teks': 'Refer to the profile cards of Monita and Andre.'
        },
        'gambar': ['monita_andre_profile.png'],
        'teks_soal': '[Tabel Benar / Salah (True or False)] Give a tick in the True or False column based on the profile cards!',
        'pernyataan': [
            {'teks': 'Monita loves reading digital comics in her leisure time.', 'jawaban': 'B'},
            {'teks': 'Andre has an older brother who teaches him how to code games.', 'jawaban': 'S'},
            {'teks': 'Both Monita and Andre are Grade 7 students at SMP Nusantara.', 'jawaban': 'B'}
        ],
        'kunci_jawaban': 'B,S,B',
        'pembahasan': '(a) Benar: Hobi Monita adalah reading digital comics. (b) Salah: Andre adalah anak tunggal (only child). (c) Benar: Keduanya berumur 13 tahun dan bersekolah di SMP Nusantara.'
    },
    {
        'nomor': 15,
        'semester': 'Semester 1',
        'chapter': 'Chapter 1: About Me',
        'unit': 'Unit 3: My Friends and I',
        'tipe': 'pg_sederhana',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Constructing Self Introduction',
        'capaian_pembelajaran': 'Menyusun kalimat perkenalan diri lisan berdasarkan data profil pribadi.',
        'bacaan': {
            'grup': 'tabel_profil_monita_andre',
            'teks': 'Refer to Monita’s profile card.'
        },
        'gambar': ['monita_andre_profile.png'],
        'teks_soal': 'If Monita introduces herself in front of the class, what will she say?',
        'opsi_jawaban': [
            {'label': 'A', 'teks': '”Hello friends, I am from Surabaya and my hobby is coding games.”'},
            {'label': 'B', 'teks': '”Hi everyone, I am Monita from Pontianak. I am 13 years old and I love swimming and reading digital comics.”'},
            {'label': 'C', 'teks': '”Good morning, I am an only child and I have no siblings at home.”'},
            {'label': 'D', 'teks': '”Hello, I am fifteen years old and I dislike swimming.”'}
        ],
        'kunci_jawaban': 'B',
        'pembahasan': 'Perkenalan diri Monita yang akurat sesuai kartu profil adalah menyebutkan asal Pontianak, umur 13 tahun, serta hobi berenang dan membaca komik (B).'
    },

    # ========================================================
    # CHAPTER 2: CULINARY AND ME (SEMESTER 1)
    # UNIT 1: My Favorite Food (Soal 16-20)
    # ========================================================
    {
        'nomor': 16,
        'semester': 'Semester 1',
        'chapter': 'Chapter 2: Culinary and Me',
        'unit': 'Unit 1: My Favorite Food',
        'tipe': 'pg_sederhana',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Describing Traditional Food',
        'capaian_pembelajaran': 'Mendeskripsikan makanan khas Nusantara menggunakan kata sifat sensorik rasa dan tekstur.',
        'bacaan': {
            'grup': 'teks_pisang_goreng',
            'teks': 'Read the descriptive text below for questions number 16 to 20!\n\nIndonesia is famous for its rich culinary heritage. Galang’s absolute favorite afternoon snack is Pisang Goreng Pontianak (fried bananas). Unlike ordinary fried bananas, Pisang Goreng Pontianak is dipped in a special rice flour batter that creates a crispy, golden, fan-shaped crust outside, while the sweet Raja banana inside remains soft and moist. Galang enjoys eating it warm with a cup of hot sweet tea. The combination of sweet, savory, and crunchy textures makes it an irresistible treat.',
            'gambar': []
        },
        'gambar': [],
        'teks_soal': 'What is the main topic of the descriptive text above?',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'How to grow banana trees in Kalimantan.'},
            {'label': 'B', 'teks': 'The special characteristics and delicious taste of Pisang Goreng Pontianak.'},
            {'label': 'C', 'teks': 'The history of hot tea plantation in West Java.'},
            {'label': 'D', 'teks': 'Why fast food restaurants are popular in big cities.'}
        ],
        'kunci_jawaban': 'B',
        'pembahasan': 'Teks mendeskripsikan ciri khas, adonan renyah, dan kelezatan camilan tradisional Pisang Goreng Pontianak (B).'
    },
    {
        'nomor': 17,
        'semester': 'Semester 1',
        'chapter': 'Chapter 2: Culinary and Me',
        'unit': 'Unit 1: My Favorite Food',
        'tipe': 'pg_sederhana',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Sensory Adjectives: Texture & Taste',
        'capaian_pembelajaran': 'Mengidentifikasi kata sifat sensorik rasa dan tekstur makanan.',
        'bacaan': {
            'grup': 'teks_pisang_goreng',
            'teks': 'Refer to the Pisang Goreng text.'
        },
        'gambar': [],
        'teks_soal': 'Which words from the text describe the TEXTURE of the fried banana crust?',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'Spicy and salty'},
            {'label': 'B', 'teks': 'Crispy and crunchy'},
            {'label': 'C', 'teks': 'Bitter and sour'},
            {'label': 'D', 'teks': 'Cold and frozen'}
        ],
        'kunci_jawaban': 'B',
        'pembahasan': 'Tekstur kulit luar pisang goreng digambarkan sebagai "crispy" dan "crunchy" (renyah garing). Pilihan B tepat.'
    },
    {
        'nomor': 18,
        'semester': 'Semester 1',
        'chapter': 'Chapter 2: Culinary and Me',
        'unit': 'Unit 1: My Favorite Food',
        'tipe': 'pg_kompleks',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Sensory Descriptions of Food',
        'capaian_pembelajaran': 'Menganalisis perpaduan rasa pada makanan tradisional Indonesia.',
        'bacaan': {
            'grup': 'teks_pisang_goreng',
            'teks': 'Refer to the Pisang Goreng text.'
        },
        'gambar': [],
        'teks_soal': '[Pilihan Ganda Kompleks — Pilih Dua Jawaban Benar!]\nWhich two statements accurately describe Pisang Goreng Pontianak based on the text? (Choose TWO correct answers)',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'The banana inside the crust remains soft, sweet, and moist.'},
            {'label': 'B', 'teks': 'It has a crispy, golden, fan-shaped outer crust made from rice flour batter.'},
            {'label': 'C', 'teks': 'Galang prefers to eat it frozen with cold chili sauce.'},
            {'label': 'D', 'teks': 'It is an extremely bitter medicinal food from ancient times.'}
        ],
        'kunci_jawaban': 'A, B',
        'pembahasan': 'Pilihan A benar (pisang di dalamnya lembut, manis, dan lembap) dan B benar (kulit luar renyah berbentuk kipas dari adonan tepung beras).'
    },
    {
        'nomor': 19,
        'semester': 'Semester 1',
        'chapter': 'Chapter 2: Culinary and Me',
        'unit': 'Unit 1: My Favorite Food',
        'tipe': 'benar_salah',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Fact Checking in Culinary Descriptions',
        'capaian_pembelajaran': 'Menilai kebenaran pernyataan deskripsi kuliner nusantara.',
        'bacaan': {
            'grup': 'teks_pisang_goreng',
            'teks': 'Refer to the Pisang Goreng text.'
        },
        'gambar': [],
        'teks_soal': '[Tabel Benar / Salah (True or False)] Give a tick in the True or False column based on the text!',
        'pernyataan': [
            {'teks': 'Pisang Goreng Pontianak uses sweet Raja banana as its main filling.', 'jawaban': 'B'},
            {'teks': 'Galang enjoys eating fried bananas with a glass of ice-cold coffee at midnight.', 'jawaban': 'S'},
            {'teks': 'The combination of sweet, savory, and crunchy textures makes it delicious.', 'jawaban': 'B'}
        ],
        'kunci_jawaban': 'B,S,B',
        'pembahasan': '(a) Benar: Teks menyebutkan pisang Raja manis sebagai isian. (b) Salah: Galang menikmatinya hangat bersama teh manis hangat di sore hari. (c) Benar: Perpaduan manis, gurih, dan renyah membuatnya sangat lezat.'
    },
    {
        'nomor': 20,
        'semester': 'Semester 1',
        'chapter': 'Chapter 2: Culinary and Me',
        'unit': 'Unit 1: My Favorite Food',
        'tipe': 'pg_sederhana',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Idiomatic & Expressive Vocabulary',
        'capaian_pembelajaran': 'Memahami ungkapan ekspresif selera makan dalam teks bahasa Inggris.',
        'bacaan': None,
        'gambar': [],
        'teks_soal': '”The warm aroma of fried banana is totally mouth-watering.”\nWhat does the adjective ”mouth-watering” mean?',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'Looking or smelling so delicious that it makes you want to eat immediately.'},
            {'label': 'B', 'teks': 'Tasting excessively salty and making you thirsty.'},
            {'label': 'C', 'teks': 'Spilling water all over the dining table.'},
            {'label': 'D', 'teks': 'Being completely tasteless and unappealing.'}
        ],
        'kunci_jawaban': 'A',
        'pembahasan': 'Kata "mouth-watering" adalah ungkapan kiasan untuk makanan yang sangat menggugah selera (sangat lezat aromanya hingga menerbitkan air liur). Pilihan A tepat.'
    },

    # ========================================================
    # UNIT 2: My Favorite Snack (Soal 21-25)
    # ========================================================
    {
        'nomor': 21,
        'semester': 'Semester 1',
        'chapter': 'Chapter 2: Culinary and Me',
        'unit': 'Unit 2: My Favorite Snack',
        'tipe': 'pg_sederhana',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Reading Nutrition Facts Labels',
        'capaian_pembelajaran': 'Menganalisis label fakta nutrisi pada kemasan minuman dan camilan ringan.',
        'bacaan': {
            'grup': 'label_nutrisi_oat_choco',
            'teks': 'Observe and compare the two Nutrition Facts labels below for questions number 21 to 25!\n\nPRODUCT A: FRESH OAT MILK (250 ml)\n• Total Fat: 2.5 g (Saturated Fat: 0.5 g, Trans Fat: 0 g)\n• Cholesterol: 0 mg\n• Sodium: 85 mg\n• Total Carbohydrate: 18 g (Dietary Fiber: 4 g, Sugars: 4 g)\n• Protein: 8 g\n• Calcium: 35% DV, Vitamin D: 25% DV\n• Storage: Keep refrigerated at 4°C, consume within 3 days.\n\nPRODUCT B: CHOCO MALT DRINK (250 ml)\n• Total Fat: 6 g (Saturated Fat: 3.5 g, Trans Fat: 0 g)\n• Cholesterol: 15 mg\n• Sodium: 140 mg\n• Total Carbohydrate: 32 g (Dietary Fiber: 1 g, Sugars: 24 g)\n• Protein: 3 g\n• Calcium: 15% DV, Vitamin D: 10% DV\n• Storage: Store in a cool dry place.',
            'gambar': ['eval4_nutrition_facts_highres.jpg']
        },
        'gambar': ['eval4_nutrition_facts_highres.jpg'],
        'teks_soal': 'Which product has LOWER sugar content and HIGHER protein per serving?',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'Choco Malt Drink'},
            {'label': 'B', 'teks': 'Fresh Oat Milk'},
            {'label': 'C', 'teks': 'Both have identical sugar and protein levels.'},
            {'label': 'D', 'teks': 'Neither product contains any protein.'}
        ],
        'kunci_jawaban': 'B',
        'pembahasan': 'Fresh Oat Milk mengandung gula lebih rendah (4g vs 24g pada Choco Malt) dan protein lebih tinggi (8g vs 3g). Pilihan B tepat.'
    },
    {
        'nomor': 22,
        'semester': 'Semester 1',
        'chapter': 'Chapter 2: Culinary and Me',
        'unit': 'Unit 2: My Favorite Snack',
        'tipe': 'pg_kompleks',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Healthy Snacking Choices',
        'capaian_pembelajaran': 'Memilih makanan dan minuman bernutrisi seimbang untuk menjaga kesehatan remaja.',
        'bacaan': {
            'grup': 'label_nutrisi_oat_choco',
            'teks': 'Refer to the Nutrition Facts comparison.'
        },
        'gambar': ['eval4_nutrition_facts_highres.jpg'],
        'teks_soal': '[Pilihan Ganda Kompleks — Pilih Dua Jawaban Benar!]\nWhy is Fresh Oat Milk considered a healthier snack drink choice for students? (Choose TWO correct answers)',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'It provides significantly higher dietary fiber (4 g vs 1 g).'},
            {'label': 'B', 'teks': 'It contains 0 mg cholesterol and much lower sugar (4 g vs 24 g).'},
            {'label': 'C', 'teks': 'It contains higher saturated fat and artificial food coloring.'},
            {'label': 'D', 'teks': 'It is loaded with 50 g of added refined white sugar.'}
        ],
        'kunci_jawaban': 'A, B',
        'pembahasan': 'Oat milk lebih sehat karena serat pangan lebih tinggi (4g vs 1g) dan bebas kolesterol (0 mg) dengan gula jauh lebih rendah (4g vs 24g). Pilihan A dan B benar.'
    },
    {
        'nomor': 23,
        'semester': 'Semester 1',
        'chapter': 'Chapter 2: Culinary and Me',
        'unit': 'Unit 2: My Favorite Snack',
        'tipe': 'benar_salah',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'True/False Nutrition Label Verification',
        'capaian_pembelajaran': 'Memvalidasi klaim gizi dan petunjuk penyimpanan pada kemasan minuman.',
        'bacaan': {
            'grup': 'label_nutrisi_oat_choco',
            'teks': 'Refer to the Nutrition Facts comparison.'
        },
        'gambar': ['eval4_nutrition_facts_highres.jpg'],
        'teks_soal': '[Tabel Benar / Salah (True or False)] Give a tick in the True or False column based on the Nutrition Facts!',
        'pernyataan': [
            {'teks': 'Fresh Oat Milk supplies 35% of the Daily Value of Calcium.', 'jawaban': 'B'},
            {'teks': 'Choco Malt Drink contains 24 g of sugar per 250 ml serving.', 'jawaban': 'B'},
            {'teks': 'Fresh Oat Milk can be left open under hot direct sunlight for two months without spoiling.', 'jawaban': 'S'}
        ],
        'kunci_jawaban': 'B,B,S',
        'pembahasan': '(a) Benar: Calcium Oat Milk adalah 35% DV. (b) Benar: Choco Malt mengandung 24g gula. (c) Salah: Oat milk wajib disimpan di kulkas pada suhu 4°C dan dihabiskan dalam 3 hari.'
    },
    {
        'nomor': 24,
        'semester': 'Semester 1',
        'chapter': 'Chapter 2: Culinary and Me',
        'unit': 'Unit 2: My Favorite Snack',
        'tipe': 'pg_sederhana',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Mathematical Literacy in Reading Labels',
        'capaian_pembelajaran': 'Menghitung selisih kandungan gizi antar dua produk pangan dalam bahasa Inggris.',
        'bacaan': {
            'grup': 'label_nutrisi_oat_choco',
            'teks': 'Refer to the Nutrition Facts comparison.'
        },
        'gambar': ['eval4_nutrition_facts_highres.jpg'],
        'teks_soal': 'What is the difference in Carbohydrate content between Choco Malt Drink (32 g) and Fresh Oat Milk (18 g)?',
        'opsi_jawaban': [
            {'label': 'A', 'teks': '10 grams'},
            {'label': 'B', 'teks': '14 grams'},
            {'label': 'C', 'teks': '20 grams'},
            {'label': 'D', 'teks': '50 grams'}
        ],
        'kunci_jawaban': 'B',
        'pembahasan': 'Selisih karbohidrat: 32 g - 18 g = 14 g. Pilihan B tepat.'
    },
    {
        'nomor': 25,
        'semester': 'Semester 1',
        'chapter': 'Chapter 2: Culinary and Me',
        'unit': 'Unit 2: My Favorite Snack',
        'tipe': 'pg_sederhana',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Evaluating Health Recommendations',
        'capaian_pembelajaran': 'Menentukan rekomendasi produk konsumsi yang sesuai dengan kebutuhan kesehatan tubuh.',
        'bacaan': {
            'grup': 'label_nutrisi_oat_choco',
            'teks': 'Refer to the Nutrition Facts comparison.'
        },
        'gambar': ['eval4_nutrition_facts_highres.jpg'],
        'teks_soal': 'Bima is training for a basketball competition and his coach asks him to avoid sugary drinks while increasing calcium and protein. Which beverage should Bima choose?',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'Choco Malt Drink because it has 24 grams of sugar.'},
            {'label': 'B', 'teks': 'Fresh Oat Milk because it offers 8 grams of protein, 35% Calcium, and only 4 grams of sugar.'},
            {'label': 'C', 'teks': 'Carbonated soda with high artificial sweetener.'},
            {'label': 'D', 'teks': 'Sweet milk tea with extra sugar syrup.'}
        ],
        'kunci_jawaban': 'B',
        'pembahasan': 'Fresh Oat Milk memberikan protein tinggi (8g), kalsium tinggi (35%), dan kadar gula rendah (4g), paling sesuai untuk rekomendasi pelatih Bima (B).'
    },

    # ========================================================
    # UNIT 3: A Secret Recipe (Soal 26-30)
    # ========================================================
    {
        'nomor': 26,
        'semester': 'Semester 1',
        'chapter': 'Chapter 2: Culinary and Me',
        'unit': 'Unit 3: A Secret Recipe',
        'tipe': 'pg_sederhana',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Procedure Text: Goal and Ingredients',
        'capaian_pembelajaran': 'Memahami tujuan sosial, struktur teks (goal, ingredients, steps), dan fitur kebahasaan teks prosedur kuliner.',
        'bacaan': {
            'grup': 'resep_es_teh_lemon',
            'teks': 'Read the recipe below for questions number 26 to 30!\n\nHOW TO MAKE REFRESHING ICED LEMON TEA\n\nIngredients:\n• 2 tea bags of black tea\n• 2 cups of boiling water\n• 2 tablespoons of honey or organic sugar\n• 1 fresh lemon (sliced thinly)\n• 6 ice cubes\n• Fresh mint leaves (optional for garnish)\n\nUtensils: A glass pitcher, a spoon, a knife, and serving glasses.\n\nSteps:\n1. First, brew the 2 tea bags in 2 cups of boiling water inside the pitcher for about 4 minutes until dark amber.\n2. Next, remove the tea bags and add 2 tablespoons of honey. Stir well until the honey completely dissolves.\n3. After that, squeeze half of the fresh lemon juice into the tea and stir gently.\n4. Then, drop the thin lemon slices and ice cubes into the pitcher.\n5. Finally, pour the iced lemon tea into serving glasses and garnish with mint leaves. Serve immediately!',
            'gambar': []
        },
        'gambar': [],
        'teks_soal': 'What is the goal of the procedure text above?',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'To explain how to plant tea bushes in the garden.'},
            {'label': 'B', 'teks': 'To tell the steps of making refreshing iced lemon tea.'},
            {'label': 'C', 'teks': 'To describe the chemical composition of lemons.'},
            {'label': 'D', 'teks': 'To review a modern beverage restaurant.'}
        ],
        'kunci_jawaban': 'B',
        'pembahasan': 'Tujuan (goal) dari teks prosedur tersebut tertera jelas pada judul: "How to Make Refreshing Iced Lemon Tea" (B).'
    },
    {
        'nomor': 27,
        'semester': 'Semester 1',
        'chapter': 'Chapter 2: Culinary and Me',
        'unit': 'Unit 3: A Secret Recipe',
        'tipe': 'pg_sederhana',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Grammar Focus: Imperative Sentences',
        'capaian_pembelajaran': 'Mengidentifikasi kalimat perintah (imperatives) dan kata kerja tindakan (action verbs) dalam teks prosedur.',
        'bacaan': {
            'grup': 'resep_es_teh_lemon',
            'teks': 'Refer to the recipe text.'
        },
        'gambar': [],
        'teks_soal': 'Which sentence from the recipe is an IMPERATIVE SENTENCE?',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'Indonesia is famous for its tea.'},
            {'label': 'B', 'teks': 'Squeeze half of the fresh lemon juice into the tea.'},
            {'label': 'C', 'teks': 'Iced tea is very popular among teenagers.'},
            {'label': 'D', 'teks': 'Galang likes sweet drinks very much.'}
        ],
        'kunci_jawaban': 'B',
        'pembahasan': 'Kalimat imperatif (perintah instruksi) diawali oleh kata kerja dasar (Bare Infinitive): "Squeeze half of the fresh lemon juice..." (B).'
    },
    {
        'nomor': 28,
        'semester': 'Semester 1',
        'chapter': 'Chapter 2: Culinary and Me',
        'unit': 'Unit 3: A Secret Recipe',
        'tipe': 'pg_kompleks',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Recipe Utensils & Sequence',
        'capaian_pembelajaran': 'Mengklasifikasi peralatan dapur dan kata penghubung urutan langkah (sequence connectors).',
        'bacaan': {
            'grup': 'resep_es_teh_lemon',
            'teks': 'Refer to the recipe text.'
        },
        'gambar': [],
        'teks_soal': '[Pilihan Ganda Kompleks — Pilih Dua Jawaban Benar!]\nWhich two utensils are specifically required to make and serve this recipe? (Choose TWO correct answers)',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'A glass pitcher and a stirring spoon.'},
            {'label': 'B', 'teks': 'A sharp kitchen knife to slice the fresh lemon.'},
            {'label': 'C', 'teks': 'An electric microwave oven.'},
            {'label': 'D', 'teks': 'A heavy metal frying pan.'}
        ],
        'kunci_jawaban': 'A, B',
        'pembahasan': 'Dalam daftar peralatan tertulis: glass pitcher, spoon, knife, dan serving glasses. Pilihan A dan B benar.'
    },
    {
        'nomor': 29,
        'semester': 'Semester 1',
        'chapter': 'Chapter 2: Culinary and Me',
        'unit': 'Unit 3: A Secret Recipe',
        'tipe': 'benar_salah',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Sequential Steps Verification',
        'capaian_pembelajaran': 'Memeriksa urutan logis langkah-langkah pembuatan resep minuman.',
        'bacaan': {
            'grup': 'resep_es_teh_lemon',
            'teks': 'Refer to the recipe text.'
        },
        'gambar': [],
        'teks_soal': '[Tabel Benar / Salah (True or False)] Give a tick in the True or False column based on the recipe steps!',
        'pernyataan': [
            {'teks': 'The tea bags should be brewed in boiling water for about 4 minutes.', 'jawaban': 'B'},
            {'teks': 'Honey is added while the tea bags are still inside the pitcher before boiling.', 'jawaban': 'S'},
            {'teks': 'Ice cubes and fresh lemon slices are added after the honey dissolves.', 'jawaban': 'B'}
        ],
        'kunci_jawaban': 'B,S,B',
        'pembahasan': '(a) Benar: Teh diseduh sekitar 4 menit. (b) Salah: Kantong teh diangkat terlebih dahulu (remove the tea bags) baru madu ditambahkan. (c) Benar: Es batu dan irisan lemon dimasukkan setelah madu larut.'
    },
    {
        'nomor': 30,
        'semester': 'Semester 1',
        'chapter': 'Chapter 2: Culinary and Me',
        'unit': 'Unit 3: A Secret Recipe',
        'tipe': 'pg_sederhana',
        'tingkatKelas': '7',
        'jenjang': 'SMP',
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'materi': 'Chronological Sequence Comprehension',
        'capaian_pembelajaran': 'Menentukan tindakan yang wajib dilakukan sebelum tahapan berikutnya pada teks prosedur.',
        'bacaan': {
            'grup': 'resep_es_teh_lemon',
            'teks': 'Refer to the recipe text.'
        },
        'gambar': [],
        'teks_soal': 'What must we do BEFORE adding the ice cubes into the pitcher?',
        'opsi_jawaban': [
            {'label': 'A', 'teks': 'Drink the entire tea immediately.'},
            {'label': 'B', 'teks': 'Stir the honey until it completely dissolves and squeeze lemon juice into the tea.'},
            {'label': 'C', 'teks': 'Wash the mint leaves with hot boiling oil.'},
            {'label': 'D', 'teks': 'Throw away the pitcher into the trash can.'}
        ],
        'kunci_jawaban': 'B',
        'pembahasan': 'Sebelum memasukkan es batu (Langkah 4), kita harus melarutkan madu dan memeras air lemon (Langkah 2 dan 3). Pilihan B tepat.'
    }
]

print(f"Loaded Part 1: {len(SOAL_PART1)} questions (Soal 1-30).")
