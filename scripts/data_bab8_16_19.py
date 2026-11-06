# scripts/data_bab8_16_19.py
# Soal-soal kurikulum Fase D / AKM untuk Bab 8 (Noun & Comparison), Bab 16 (Descriptive Text), Bab 19 (Procedure Text)

DATA_BAB8 = [
    {
        "nomor": 31,
        "tipe": "pg_sederhana",
        "kelas": "7",
        "mapel": "Bahasa Inggris",
        "jenjang": "SMP",
        "fase": "D",
        "paket": "Paket Bab 8 - Noun & Comparison",
        "kesulitan": "sedang",
        "kunci": "B",
        "bacaan": {
            "grup": "tabel_backpacks_comparison",
            "teks": """<p>Study the comparison table of three student backpacks below and answer questions number 31 to 35!</p>
<table class="matrix-box" border="1" style="border-collapse: collapse; width: 100%; text-align: left;">
  <thead>
    <tr style="background-color: #f1f5f9;">
      <th style="padding: 6px;">Specification</th>
      <th style="padding: 6px;">AERO BAG</th>
      <th style="padding: 6px;">TERRA PACK</th>
      <th style="padding: 6px;">NOVA TOTE</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding: 6px; font-weight: bold;">Price</td>
      <td style="padding: 6px;">Rp185.000</td>
      <td style="padding: 6px;">Rp240.000</td>
      <td style="padding: 6px;">Rp150.000</td>
    </tr>
    <tr>
      <td style="padding: 6px; font-weight: bold;">Weight</td>
      <td style="padding: 6px;">450 grams</td>
      <td style="padding: 6px;">700 grams</td>
      <td style="padding: 6px;">450 grams</td>
    </tr>
    <tr>
      <td style="padding: 6px; font-weight: bold;">Capacity (Books)</td>
      <td style="padding: 6px;">8 thick books</td>
      <td style="padding: 6px;">12 thick books</td>
      <td style="padding: 6px;">5 thick books</td>
    </tr>
    <tr>
      <td style="padding: 6px; font-weight: bold;">Waterproof Rating</td>
      <td style="padding: 6px;">Water-resistant</td>
      <td style="padding: 6px;">100% Waterproof</td>
      <td style="padding: 6px;">Not waterproof</td>
    </tr>
  </tbody>
</table>"""
        },
        "soal": "[Membandingkan Tabel — Degrees of Comparison]\nBased on the table above, which comparison sentence is CORRECT?",
        "opsi": [
            {"label": "A", "teks": "Nova Tote is more expensive than Aero Bag."},
            {"label": "B", "teks": "Terra Pack is the most expensive and has the largest capacity among the three bags."},
            {"label": "C", "teks": "Aero Bag is heavier than Terra Pack."},
            {"label": "D", "teks": "Terra Pack is as cheap as Nova Tote."}
        ],
        "pembahasan": "Berdasarkan tabel spesifikasi: Terra Pack adalah tas paling mahal (Rp240.000) dan memiliki kapasitas buku terbanyak (12 buku) di antara ketiga tas."
    },
    {
        "nomor": 32,
        "tipe": "pg_sederhana",
        "kelas": "7",
        "mapel": "Bahasa Inggris",
        "jenjang": "SMP",
        "fase": "D",
        "paket": "Paket Bab 8 - Noun & Comparison",
        "kesulitan": "mudah",
        "kunci": "C",
        "bacaan": {
            "grup": "tabel_backpacks_comparison",
            "teks": "<p>Refer to the comparison table of three student backpacks above.</p>"
        },
        "soal": "Look at the weight row: Aero Bag (450g) and Nova Tote (450g). We can conclude that Aero Bag is ... Nova Tote.",
        "opsi": [
            {"label": "A", "teks": "heavier than"},
            {"label": "B", "teks": "the heaviest of"},
            {"label": "C", "teks": "as light as"},
            {"label": "D", "teks": "more lighter than"}
        ],
        "pembahasan": "Karena berat Aero Bag dan Nova Tote sama-sama 450 gram, bentuk perbandingan setara (positive degree) yang tepat adalah 'as light as'."
    },
    {
        "nomor": 33,
        "tipe": "pg_kompleks",
        "kelas": "7",
        "mapel": "Bahasa Inggris",
        "jenjang": "SMP",
        "fase": "D",
        "paket": "Paket Bab 8 - Noun & Comparison",
        "kesulitan": "sedang",
        "kunci": "A,B",
        "bacaan": {
            "grup": "tabel_backpacks_comparison",
            "teks": "<p>Refer to the comparison table of three student backpacks above.</p>"
        },
        "soal": "[Pilihan Ganda Kompleks — Pilih Lebih dari Satu!]\nWhich statements are TRUE according to the specification table? (Choose TWO correct answers)",
        "opsi": [
            {"label": "A", "teks": "Nova Tote is the cheapest bag, but it holds the fewest books (5 books)."},
            {"label": "B", "teks": "Aero Bag can hold more books than Nova Tote, and it is cheaper than Terra Pack."},
            {"label": "C", "teks": "Terra Pack is lighter than Aero Bag."},
            {"label": "D", "teks": "Nova Tote is better than Terra Pack for hiking in heavy rain."}
        ],
        "pembahasan": "Pernyataan A benar (Nova Tote termurah Rp150.000 dengan muatan paling sedikit 5 buku). Pernyataan B benar (Aero Bag muat 8 buku > Nova Tote 5 buku, dan Rp185.000 lebih murah dari Terra Pack Rp240.000)."
    },
    {
        "nomor": 34,
        "tipe": "pg_kompleks",
        "kelas": "7",
        "mapel": "Bahasa Inggris",
        "jenjang": "SMP",
        "fase": "D",
        "paket": "Paket Bab 8 - Noun & Comparison",
        "kesulitan": "sedang",
        "kunci": "A,B",
        "soal": "[Pilihan Ganda Kompleks — Plural Nouns]\nWhich sentences use plural nouns and quantifiers correctly? (Choose TWO correct answers)",
        "opsi": [
            {"label": "A", "teks": "Many children bring their own lunchboxes to school."},
            {"label": "B", "teks": "We saw five deer and several sheep at the conservation park."},
            {"label": "C", "teks": "My mother bought two sharp knifes and three loafs of bread."},
            {"label": "D", "teks": "The teacher gave us many useful informations about the exam."}
        ],
        "pembahasan": "A benar ('children' dan 'lunchboxes' jamak beraturan/tidak beraturan yang benar). B benar ('deer' dan 'sheep' bentuk jamak tanpa akhiran -s). Pilihan C salah ('knives' dan 'loaves'). Pilihan D salah ('information' uncountable noun, tidak boleh 'informations')."
    },
    {
        "nomor": 35,
        "tipe": "benar_salah",
        "kelas": "7",
        "mapel": "Bahasa Inggris",
        "jenjang": "SMP",
        "fase": "D",
        "paket": "Paket Bab 8 - Noun & Comparison",
        "kesulitan": "sedang",
        "kunci": "B,S,B",
        "bacaan": {
            "grup": "tabel_backpacks_comparison",
            "teks": "<p>Refer to the comparison table of three student backpacks above.</p>"
        },
        "soal": "[Tabel Benar / Salah (True or False)] Read the statements comparing the three bags and give a tick in the True or False column!",
        "pernyataan": [
            {"teks": "Terra Pack costs Rp55.000 more than Aero Bag.", "jawaban": "Benar"},
            {"teks": "Aero Bag can hold more thick books (8 books) than Terra Pack (12 books).", "jawaban": "Salah"},
            {"teks": "If a student needs to carry 10 thick books and rides a bicycle in the rain, Terra Pack is the most suitable choice.", "jawaban": "Benar"}
        ],
        "pembahasan": "(a) Benar: Rp240.000 - Rp185.000 = Rp55.000. (b) Salah: Terra Pack muat 12 buku, lebih banyak dari Aero Bag (8 buku). (c) Benar: Terra Pack muat 12 buku (memenuhi kebutuhan 10 buku) dan 100% waterproof cocok untuk hujan."
    }
]

DATA_BAB16 = [
    {
        "nomor": 36,
        "tipe": "pg_sederhana",
        "kelas": "7",
        "mapel": "Bahasa Inggris",
        "jenjang": "SMP",
        "fase": "D",
        "paket": "Paket Bab 16 - Descriptive Text",
        "kesulitan": "sedang",
        "kunci": "B",
        "bacaan": {
            "grup": "descriptive_borobudur_prambanan",
            "teks": """<p>Read and compare the two Descriptive Texts about Indonesian Cultural Heritage Sites below and answer questions number 36 to 40!</p>
<p><strong>TEXT 1 (BOROBUDUR TEMPLE):</strong> Borobudur is the world’s largest Buddhist temple, located in Magelang, Central Java. Built in the 9th century during the Syailendra Dynasty, the monument consists of nine stacked platforms—six square and three circular—topped by a magnificent central dome. It is decorated with 2,672 relief panels and 504 Buddha statues, built from dark gray volcanic andesite stone without using any cement.</p>
<p><strong>TEXT 2 (PRAMBANAN TEMPLE):</strong> Prambanan is the largest Hindu temple complex in Indonesia, located on the border between Central Java and Yogyakarta. Also built in the 9th century, Prambanan is famous for its tall, pointed architecture. Its three main shrines are dedicated to Trimurti (Brahma, Vishnu, and Shiva), with the central Shiva temple rising 47 meters high. Its stone reliefs tell the epic story of Ramayana.</p>"""
        },
        "soal": "[Membandingkan Dua Teks Deskriptif]\nHow do Borobudur and Prambanan differ in their architectural shape and religious background?",
        "opsi": [
            {"label": "A", "teks": "Borobudur is a tall pointed Hindu temple, while Prambanan is a stepped Buddhist pyramid."},
            {"label": "B", "teks": "Borobudur is a Buddhist monument with nine stacked platforms and a central dome, whereas Prambanan is a Hindu temple complex featuring tall, pointed shrines up to 47 meters high."},
            {"label": "C", "teks": "Borobudur was built in the 20th century using cement, while Prambanan was built of wood."},
            {"label": "D", "teks": "Both temples tell the story of Malin Kundang on their relief panels."}
        ],
        "pembahasan": "Borobudur adalah monumen Buddha berundak 9 lantai dengan kubah sentral, sedangkan Prambanan adalah candi Hindu berarsitektur ramping meruncing setinggi 47 meter."
    },
    {
        "nomor": 37,
        "tipe": "pg_sederhana",
        "kelas": "7",
        "mapel": "Bahasa Inggris",
        "jenjang": "SMP",
        "fase": "D",
        "paket": "Paket Bab 16 - Descriptive Text",
        "kesulitan": "mudah",
        "kunci": "A",
        "bacaan": {
            "grup": "descriptive_borobudur_prambanan",
            "teks": "<p>Refer to the two Descriptive Texts about Borobudur and Prambanan above.</p>"
        },
        "soal": "What similarity do both Borobudur and Prambanan share based on the two texts?",
        "opsi": [
            {"label": "A", "teks": "Both were built in the 9th century in Java and feature carved stone relief panels."},
            {"label": "B", "teks": "Both are located in East Kalimantan."},
            {"label": "C", "teks": "Both have 504 Buddha statues on circular platforms."},
            {"label": "D", "teks": "Both are dedicated to Trimurti (Brahma, Vishnu, and Shiva)."}
        ],
        "pembahasan": "Kedua candi sama-sama dibangun pada abad ke-9 di Jawa dan memiliki panel relief batu berukir (carved stone relief panels)."
    },
    {
        "nomor": 38,
        "tipe": "pg_kompleks",
        "kelas": "7",
        "mapel": "Bahasa Inggris",
        "jenjang": "SMP",
        "fase": "D",
        "paket": "Paket Bab 16 - Descriptive Text",
        "kesulitan": "sedang",
        "kunci": "A,B",
        "bacaan": {
            "grup": "descriptive_borobudur_prambanan",
            "teks": "<p>Refer to the two Descriptive Texts about Borobudur and Prambanan above.</p>"
        },
        "soal": "[Pilihan Ganda Kompleks — Pilih Lebih dari Satu!]\nWhich statements are TRUE according to the two descriptive texts? (Choose TWO correct answers)",
        "opsi": [
            {"label": "A", "teks": "Borobudur’s blocks of volcanic stone were interlocked without using any cement."},
            {"label": "B", "teks": "The stone reliefs on Prambanan Temple illustrate the Hindu epic story of Ramayana."},
            {"label": "C", "teks": "The central Shiva temple at Prambanan is only 5 meters tall."},
            {"label": "D", "teks": "Both texts are written in the Simple Past Tense only and have no Identification section."}
        ],
        "pembahasan": "Pernyataan A benar (batu andesit Borobudur disusun saling mengunci tanpa semen). Pernyataan B benar (relief Prambanan mengisahkan epos Ramayana)."
    },
    {
        "nomor": 39,
        "tipe": "pg_kompleks",
        "kelas": "7",
        "mapel": "Bahasa Inggris",
        "jenjang": "SMP",
        "fase": "D",
        "paket": "Paket Bab 16 - Descriptive Text",
        "kesulitan": "sedang",
        "kunci": "A,B",
        "bacaan": {
            "grup": "descriptive_borobudur_prambanan",
            "teks": "<p>Refer to the two Descriptive Texts about Borobudur and Prambanan above.</p>"
        },
        "soal": "[Pilihan Ganda Kompleks — Unsur Kebahasaan Descriptive Text]\nWhich phrases from the texts are descriptive noun phrases (Adjective + Noun) describing physical appearance? (Choose TWO correct answers)",
        "opsi": [
            {"label": "A", "teks": "magnificent central dome"},
            {"label": "B", "teks": "tall, pointed architecture"},
            {"label": "C", "teks": "located on the border"},
            {"label": "D", "teks": "tell the epic story"}
        ],
        "pembahasan": "'magnificent central dome' dan 'tall, pointed architecture' merupakan frasa kata benda deskriptif (Adjective + Noun) yang melukiskan rupa fisik candi."
    },
    {
        "nomor": 40,
        "tipe": "benar_salah",
        "kelas": "7",
        "mapel": "Bahasa Inggris",
        "jenjang": "SMP",
        "fase": "D",
        "paket": "Paket Bab 16 - Descriptive Text",
        "kesulitan": "sedang",
        "kunci": "B,B,S",
        "bacaan": {
            "grup": "descriptive_borobudur_prambanan",
            "teks": "<p>Refer to the two Descriptive Texts about Borobudur and Prambanan above.</p>"
        },
        "soal": "[Tabel Benar / Salah (True or False)] Read the statements comparing Borobudur and Prambanan, then give a tick in the True or False column!",
        "pernyataan": [
            {"teks": "Borobudur has six square platforms and three circular platforms topped by a central dome.", "jawaban": "Benar"},
            {"teks": "Prambanan is located on the border between Central Java and Yogyakarta.", "jawaban": "Benar"},
            {"teks": "Borobudur is a Hindu temple complex, while Prambanan is a Buddhist temple.", "jawaban": "Salah"}
        ],
        "pembahasan": "(a) Benar: Borobudur terdiri atas 6 teras bujur sangkar dan 3 teras melingkar. (b) Benar: Prambanan terletak di perbatasan Jawa Tengah dan DIY. (c) Salah: Terbalik (Borobudur adalah candi Buddha, Prambanan candi Hindu)."
    }
]

DATA_BAB19 = [
    {
        "nomor": 51,
        "tipe": "pg_sederhana",
        "kelas": "7",
        "mapel": "Bahasa Inggris",
        "jenjang": "SMP",
        "fase": "D",
        "paket": "Paket Bab 19 - Procedure Text",
        "kesulitan": "mudah",
        "kunci": "B",
        "bacaan": {
            "grup": "procedure_self_watering_pot",
            "teks": """<p>Study the 4-step visual procedure guide below and answer questions number 51 to 55!</p>
<p><strong>How to Make a Self-Watering Plant Pot from a Used Plastic Bottle</strong></p>
<p><strong>Materials:</strong> A 1.5-liter used plastic bottle, a cutter/scissors, a nail, a thick cotton string (20 cm), water, soil, and a small plant seedling.</p>
<p><strong>Steps:</strong><br/>
1. <strong>Step 1:</strong> Cut the plastic bottle in half using a cutter and scissors so you have a bottom part and a top part.<br/>
2. <strong>Step 2:</strong> Make a small hole in the bottle cap using a nail, then thread the cotton string through the hole.<br/>
3. <strong>Step 3:</strong> Fill the bottom half of the bottle with water, then place the top half upside down (inverted) into the bottom half so the cotton string touches the water.<br/>
4. <strong>Step 4:</strong> Put fertile soil into the inverted top half using a small trowel and plant your seedling. The cotton string will absorb water up into the soil automatically!</p>"""
        },
        "soal": "What is the communicative purpose of the multimodal procedure text above?",
        "opsi": [
            {"label": "A", "teks": "To describe the price of a new plastic bottle in the supermarket."},
            {"label": "B", "teks": "To show the step-by-step instructions on how to make a self-watering pot from a used plastic bottle."},
            {"label": "C", "teks": "To retell a past holiday experience in a botanical garden."},
            {"label": "D", "teks": "To persuade people to throw away all their house plants."}
        ],
        "pembahasan": "Tujuan komunikatif teks prosedur adalah menunjukkan panduan langkah demi langkah cara membuat pot tanaman swasiram dari botol plastik bekas."
    },
    {
        "nomor": 52,
        "tipe": "pg_sederhana",
        "kelas": "7",
        "mapel": "Bahasa Inggris",
        "jenjang": "SMP",
        "fase": "D",
        "paket": "Paket Bab 19 - Procedure Text",
        "kesulitan": "mudah",
        "kunci": "B",
        "bacaan": {
            "grup": "procedure_self_watering_pot",
            "teks": "<p>Refer to the procedure guide How to Make a Self-Watering Plant Pot above.</p>"
        },
        "soal": "Based on the text, what is the function of the cotton string in Step 2 and Step 3?",
        "opsi": [
            {"label": "A", "teks": "To tie the plastic bottle to a tree branch."},
            {"label": "B", "teks": "To absorb and draw water from the bottom container up into the soil."},
            {"label": "C", "teks": "To cut the plastic bottle into two equal halves."},
            {"label": "D", "teks": "To measure the height of the plant leaves."}
        ],
        "pembahasan": "Tali katun berfungsi menyerap air dari wadah bawah ke atas menuju tanah tempat bibit tanaman tumbuh secara kapiler otomatis."
    },
    {
        "nomor": 53,
        "tipe": "pg_kompleks",
        "kelas": "7",
        "mapel": "Bahasa Inggris",
        "jenjang": "SMP",
        "fase": "D",
        "paket": "Paket Bab 19 - Procedure Text",
        "kesulitan": "sedang",
        "kunci": "A,B",
        "bacaan": {
            "grup": "procedure_self_watering_pot",
            "teks": "<p>Refer to the procedure guide How to Make a Self-Watering Plant Pot above.</p>"
        },
        "soal": "[Pilihan Ganda Kompleks — Pilih Lebih dari Satu!]\nWhich tools are needed in Step 1 and Step 2 according to the guide? (Choose TWO correct answers)",
        "opsi": [
            {"label": "A", "teks": "A cutter and a pair of scissors to cut the bottle"},
            {"label": "B", "teks": "A nail to poke a hole in the bottle cap"},
            {"label": "C", "teks": "A frying pan and a gas stove"},
            {"label": "D", "teks": "A kitchen blender and mixer"}
        ],
        "pembahasan": "Alat yang dibutuhkan pada Langkah 1 adalah cutter dan gunting untuk memotong botol, dan Langkah 2 adalah paku untuk melubangi tutup botol."
    },
    {
        "nomor": 54,
        "tipe": "benar_salah",
        "kelas": "7",
        "mapel": "Bahasa Inggris",
        "jenjang": "SMP",
        "fase": "D",
        "paket": "Paket Bab 19 - Procedure Text",
        "kesulitan": "sedang",
        "kunci": "B,S,B",
        "bacaan": {
            "grup": "procedure_self_watering_pot",
            "teks": "<p>Refer to the procedure guide How to Make a Self-Watering Plant Pot above.</p>"
        },
        "soal": "[Tabel Benar / Salah (True or False)] Read the statements based on the 4-step visual procedure above and give a tick in the True or False column!",
        "pernyataan": [
            {"teks": "In Step 3, the top half of the bottle is placed upside down (inverted) inside the bottom half.", "jawaban": "Benar"},
            {"teks": "You must fill the bottom container with soil and the top container with water.", "jawaban": "Salah"},
            {"teks": "The cotton string works automatically to draw water from the bottom container up into the soil.", "jawaban": "Benar"}
        ],
        "pembahasan": "(a) Benar: Pada Langkah 3, bagian atas botol diletakkan terbalik (inverted) ke bagian bawah. (b) Salah: Terbalik (wadah bawah diisi air, wadah atas diisi tanah). (c) Benar: Tali katun menyerap air secara otomatis."
    },
    {
        "nomor": 55,
        "tipe": "pg_sederhana",
        "kelas": "7",
        "mapel": "Bahasa Inggris",
        "jenjang": "SMP",
        "fase": "D",
        "paket": "Paket Bab 19 - Procedure Text",
        "kesulitan": "mudah",
        "kunci": "B",
        "bacaan": {
            "grup": "procedure_self_watering_pot",
            "teks": "<p>Refer to the procedure guide How to Make a Self-Watering Plant Pot above.</p>"
        },
        "soal": "What will happen if the cotton string is too short and does NOT touch the water in the bottom container?",
        "opsi": [
            {"label": "A", "teks": "The water will still flow up into the soil by itself."},
            {"label": "B", "teks": "The soil will dry out because the string cannot absorb water from the bottom part."},
            {"label": "C", "teks": "The plastic bottle will turn into glass."},
            {"label": "D", "teks": "The seedling will grow ten times faster."}
        ],
        "pembahasan": "Jika tali katun tidak menyentuh air, maka air tidak dapat terserap ke atas sehingga tanah akan mengering (the soil will dry out)."
    }
]
