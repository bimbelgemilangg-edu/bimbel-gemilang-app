# scripts/build_to1_tka_bindo_sd_2026_import_html.py
# Generator Berkas Master HTML Impor Bimbel Gemilang
# Try Out I TKA SD 2025/2026 - Bahasa Indonesia (30 Soal Lengkap)
import os
import json

SOAL_BINDO = [
    {
        "nomor": 1,
        "tipe": "pg_sederhana",
        "kesulitan": "mudah",
        "materi": "Unsur Intrinsik Cerita (Tema)",
        "capaian": "Mengidentifikasi tema cerita narasi berdasarkan tindakan tokoh",
        "bacaan": {
            "grup": "wacana_andi",
            "judul": "Andi Menolong Nenek Menyeberang",
            "teks": "Andi sangat senang bermain di taman bersama teman-temannya. Pada suatu sore, ia melihat seorang nenek yang kesulitan menyeberang jalan. Andi segera menghampiri dan menawarkan bantuan, ia menggandeng tangan nenek itu dan menuntunnya menyeberang dengan hati-hati. Setelah sampai di seberang, nenek itu tersenyum dan berkata, &quot;Terima kasih, Nak. Kamu anak yang baik.&quot; Andi merasa senang karena telah berbuat kebaikan."
        },
        "teks_soal": "Tema dalam cerita tersebut adalah ...",
        "opsi": [
            ("A", "persahabatan di taman bermain"),
            ("B", "kebaikan hati dalam membantu sesama"),
            ("C", "petualangan sore hari"),
            ("D", "kegembiraan bermain bersama teman")
        ],
        "kunci": "B",
        "pembahasan": "Cerita tersebut menonjolkan perbuatan terpuji Andi yang berinisiatif dan ikhlas membantu seorang nenek menyeberang jalan. Oleh karena itu, tema yang paling tepat adalah kebaikan hati dalam membantu sesama."
    },
    {
        "nomor": 2,
        "tipe": "pg_sederhana",
        "kesulitan": "mudah",
        "materi": "Informasi Tersurat Teks Lingkungan",
        "capaian": "Menemukan informasi tersurat mengenai dampak masalah lingkungan",
        "bacaan": {
            "grup": "wacana_maritim",
            "judul": "Indonesia sebagai Negara Maritim dan Ancaman Pencemaran Laut",
            "teks": "Indonesia adalah negara maritim yang sebagian besar wilayahnya terdiri atas lautan. Laut Indonesia menyimpan banyak kekayaan, seperti ikan, rumput laut, dan terumbu karang. Nelayan mencari nafkah dengan menangkap ikan secara tradisional. Namun, akhir-akhir ini, pencemaran laut mulai meningkat akibat limbah dan sampah plastik. Jika hal ini dibiarkan, laut akan rusak dan hasil tangkapan akan menurun. Oleh karena itu, menjaga laut sama pentingnya dengan menjaga hutan dan daratan.<br/><br/>Sayangnya, masih banyak orang yang menutup mata terhadap masalah ini. Padahal, jika laut rusak, masyarakat pesisir akan kehilangan mata pencaharian. Kita tidak boleh hanya berpangku tangan. Semua pihak harus ikut menjaga laut agar tetap lestari."
        },
        "teks_soal": "Berdasarkan teks, dampak yang akan terjadi jika pencemaran laut tidak segera diatasi adalah ...",
        "opsi": [
            ("A", "Laut akan menjadi lebih dalam."),
            ("B", "Kekayaan laut semakin melimpah."),
            ("C", "Hasil tangkapan nelayan menurun."),
            ("D", "Limbah plastik akan hilang dengan sendirinya.")
        ],
        "kunci": "C",
        "pembahasan": "Pada paragraf pertama dinyatakan secara eksplisit: &quot;Jika hal ini dibiarkan, laut akan rusak dan hasil tangkapan akan menurun.&quot;"
    },
    {
        "nomor": 3,
        "tipe": "pg_sederhana",
        "kesulitan": "sedang",
        "materi": "Ide Pokok Paragraf",
        "capaian": "Menentukan ide pokok paragraf dalam teks eksplanasi lingkungan",
        "bacaan": {
            "grup": "wacana_maritim",
            "judul": "Indonesia sebagai Negara Maritim dan Ancaman Pencemaran Laut",
            "teks": ""
        },
        "teks_soal": "Ide pokok paragraf pertama adalah...",
        "opsi": [
            ("A", "Sebagian besar wilayah Indonesia terdiri atas lautan."),
            ("B", "Laut Indonesia penuh dengan limbah plastik"),
            ("C", "Kekayaan laut Indonesia harus dijaga dari pencemaran."),
            ("D", "Terumbu karang adalah sumber daya laut yang indah.")
        ],
        "kunci": "C",
        "pembahasan": "Paragraf pertama memaparkan besarnya potensi kekayaan laut Indonesia serta bahaya ancaman pencemaran limbah, yang disimpulkan dengan gagasan utama bahwa menjaga kelestarian laut dari kerusakan sama pentingnya dengan menjaga daratan."
    },
    {
        "nomor": 4,
        "tipe": "pg_sederhana",
        "kesulitan": "mudah",
        "materi": "Makna Ungkapan (Idiom)",
        "capaian": "Mengartikan makna kiasan ungkapan dalam teks narasi/deskripsi",
        "bacaan": {
            "grup": "wacana_maritim",
            "judul": "Indonesia sebagai Negara Maritim dan Ancaman Pencemaran Laut",
            "teks": ""
        },
        "teks_soal": "Makna dari ungkapan <em>berpangku tangan</em> yang terdapat dalam paragraf kedua teks tersebut adalah....",
        "opsi": [
            ("A", "berhati-hati"),
            ("B", "menyembunyikan maksud"),
            ("C", "tidak bertanggung jawab"),
            ("D", "Tidak berbuat apa-apa")
        ],
        "kunci": "D",
        "pembahasan": "Ungkapan 'berpangku tangan' adalah kiasan yang bermakna tidak melakukan tindakan apa-apa, berdiam diri, atau bersikap pasif terhadap keadaan di sekitarnya."
    },
    {
        "nomor": 5,
        "tipe": "benar_salah",
        "kesulitan": "sedang",
        "materi": "Struktur Teks Prosedur",
        "capaian": "Menganalisis ketepatan bagian dan struktur teks prosedur",
        "bacaan": {
            "grup": "wacana_telur_dadar",
            "judul": "Cara Membuat Telur Dadar Sederhana",
            "teks": "<strong>Cara Membuat Telur Dadar Sederhana</strong><br/>Telur dadar sangat cocok dipadukan dengan nasi hangat dan sambal. Rasanya sederhana, tetapi tetap menggugah selera. Berikut adalah cara membuat telur dadar sederhana.<br/><br/><strong>Bahan-bahan:</strong><br/>• 1 butir telur<br/>• Sejumput garam<br/>• Sedikit merica bubuk<br/>• Minyak goreng secukupnya<br/><br/><strong>Langkah-langkah:</strong><br/>• Pecahkan telur ke dalam mangkuk.<br/>• Tambahkan garam dan merica, lalu kocok hingga rata.<br/>• Panaskan sedikit minyak di atas wajan.<br/>• Tuang telur dan masak hingga matang kedua sisinya.<br/>• Angkat dan sajikan selagi hangat.<br/><br/>Telur dadar sederhana kini siap dinikmati sebagai pelengkap hidangan. Untuk variasi rasa, Anda bisa menambahkan irisan daun bawang atau keju parut sesuai dengan selera. Selamat mencoba."
        },
        "teks_soal": "Berdasarkan informasi tersebut, tentukan Benar atau Salah untuk setiap pernyataan berikut!",
        "pernyataan": [
            ("Paragraf pertama merupakan bagian tujuan", "Benar"),
            ("Terdapat enam bahan yang harus disiapkan untuk mencoba resep tersebut", "Salah"),
            ("Penutup berisi ajakan untuk mencoba resep", "Benar"),
            ("Langkah-langkah dijelaskan sebelum bagian penutup", "Benar")
        ],
        "kunci": "Benar, Salah, Benar, Benar",
        "pembahasan": "1. Paragraf 1 berisi pengantar dan tujuan (Benar).<br/>2. Bahan yang disiapkan hanya ada 4 macam (telur, garam, merica, minyak), bukan 6 (Salah).<br/>3. Bagian penutup diakhiri kalimat ajakan 'Selamat mencoba' (Benar).<br/>4. Bagian langkah-langkah diletakkan sebelum paragraf penutup (Benar)."
    },
    {
        "nomor": 6,
        "tipe": "pg_sederhana",
        "kesulitan": "mudah",
        "materi": "Kalimat Fakta dan Opini",
        "capaian": "Membedakan kalimat fakta dan opini dalam teks prosedur",
        "bacaan": {
            "grup": "wacana_telur_dadar",
            "judul": "Cara Membuat Telur Dadar Sederhana",
            "teks": ""
        },
        "teks_soal": "Pernyataan berikut yang termasuk kalimat opini dalam teks adalah ...",
        "opsi": [
            ("A", "Telur dadar bisa menjadi menu sarapan yang praktis dan lezat."),
            ("B", "Pecahkan telur ke dalam mangkuk"),
            ("C", "Tuang telur dan masak hingga matang kedua sisinya."),
            ("D", "Tambahkan garam dan merica, lalu kocok hingga rata.")
        ],
        "kunci": "A",
        "pembahasan": "Pernyataan 'praktis dan lezat' merupakan pendapat/penilaian subjektif dari penulis sehingga tergolong kalimat opini. Opsi B, C, dan D merupakan instruksi tindakan faktual."
    },
    {
        "nomor": 7,
        "tipe": "pg_sederhana",
        "kesulitan": "sedang",
        "materi": "Melengkapi Paragraf Deskripsi Rumpang",
        "capaian": "Melengkapi paragraf rumpang dengan kalimat deskripsi yang koheren",
        "bacaan": {
            "grup": "wacana_taman_heulang",
            "judul": "Suasana Pagi di Taman Heulang",
            "teks": "Suasana pagi hari di Taman Heulang sangat sejuk. Pohon-pohon besar di sekeliling taman menghalangi sinar matahari dan membuatnya teduh. Kicau burung yang bersahutan dan semilir angin membuat orang betah duduk berlama-lama. Di tengah taman, terdapat sebuah lapangan luas dan kolam ikan. [...]. Walaupun kecil, jenis permainan yang disediakan cukup lengkap."
        },
        "teks_soal": "Kalimat deskripsi yang tepat untuk melengkapi bagian yang rumpang dalam teks tersebut adalah...",
        "opsi": [
            ("A", "Sementara itu, area bermain anak terletak di satu sisi taman."),
            ("B", "Banyak anak-anak sedang bermain bola ria di gazebo taman."),
            ("C", "Di sudut taman terdapat bangku kayu yang nyaman untuk bersantai."),
            ("D", "Warna bunga di sekitar kolam menambah keindahan keseluruhan taman.")
        ],
        "kunci": "A",
        "pembahasan": "Kalimat kelanjutan setelah bagian rumpang berbunyi: 'Walaupun kecil, jenis permainan yang disediakan cukup lengkap.' Kalimat yang paling padu untuk mendahuluinya adalah penjelasan mengenai keberadaan 'area bermain anak' di satu sisi taman."
    },
    {
        "nomor": 8,
        "tipe": "pg_sederhana",
        "kesulitan": "mudah",
        "materi": "Alur Emosi dan Perasaan Tokoh",
        "capaian": "Menganalisis perubahan perasaan tokoh narasi akibat peristiwa tertentu",
        "bacaan": {
            "grup": "wacana_budiman",
            "judul": "Budiman dan Api Unggun Pramuka",
            "teks": "Budiman terkejut melihat kobaran api sehingga jantungnya berdebar. Awalnya, Budiman berpikir bahwa itu adalah kebakaran hutan yang terjadi di dekat rumahnya. Namun, ternyata, kobaran api itu adalah api unggun yang dibuat anak-anak pramuka di lapangan. Budiman merasa lega setelah tahu itu hanya api unggun. Ia mendekati lapangan tempat anak-anak pramuka berkumpul. Dengan senyum, ia menyapa mereka dan ikut duduk di sekitar api."
        },
        "teks_soal": "Perubahan perasaan Budiman setelah mengetahui sumber kobaran api adalah",
        "opsi": [
            ("A", "dari takut menjadi marah"),
            ("B", "dari senang menjadi sedih"),
            ("C", "dari bingung menjadi takut"),
            ("D", "dari terkejut menjadi lega")
        ],
        "kunci": "D",
        "pembahasan": "Awalnya Budiman terkejut dan berdebar karena mengira terjadi kebakaran hutan, namun setelah mengetahui bahwa itu hanya kegiatan api unggun pramuka, perasaannya berubah menjadi lega."
    },
    {
        "nomor": 9,
        "tipe": "pg_sederhana",
        "kesulitan": "sedang",
        "materi": "Ringkasan Cerita Narasi",
        "capaian": "Menyusun ringkasan cerita narasi berdasarkan peristiwa utama",
        "bacaan": {
            "grup": "wacana_budiman",
            "judul": "Budiman dan Api Unggun Pramuka",
            "teks": ""
        },
        "teks_soal": "Berikut ini yang termasuk ringkasan cerita tersebut adalah ...",
        "opsi": [
            ("A", "Budiman terkejut melihat kebakaran di hutan."),
            ("B", "Budiman terkejut melihat kobaran api."),
            ("C", "Anak-anak pramuka membuat api unggun di lapangan."),
            ("D", "Kobaran api unggun yang dibuat anak-anak pramuka di lapangan mengagetkan Budiman.")
        ],
        "kunci": "D",
        "pembahasan": "Ringkasan yang utuh merangkum peristiwa inti (anak-anak pramuka membuat api unggun) beserta dampaknya terhadap tokoh cerita (mengagetkan Budiman)."
    },
    {
        "nomor": 10,
        "tipe": "pg_sederhana",
        "kesulitan": "mudah",
        "materi": "Menilai Kesesuaian Informasi",
        "capaian": "Menemukan pernyataan yang bertentangan dengan isi teks eksposisi",
        "bacaan": {
            "grup": "wacana_sampah_plastik",
            "judul": "Dampak Sampah Plastik terhadap Lingkungan dan Kesehatan",
            "teks": "Sampah plastik merupakan bahan yang tidak dapat diurai dengan mudah. Perlu waktu bertahun-tahun untuk dapat membuat sampah plastik terurai secara alami. Akibatnya, banyak sampah plastik yang akhirnya mencemari lingkungan kita, termasuk lautan dan sungai. Cemaran sampah plastik di sungai dan lautan pun akan berdampak pada ekosistem yang hidup di dalamnya.<br/><br/>Selain itu, penggunaan plastik juga memengaruhi kesehatan manusia. Plastik mengandung bahan kimia berbahaya yang dapat merusak organ dalam tubuh kita, termasuk hati, ginjal, dan paru-paru. Oleh karena itu, sebagai generasi muda, kita harus bertindak sekarang untuk mengurangi penggunaan plastik.<br/><br/>Upaya apa saja yang dapat kita lakukan untuk mengurangi sampah plastik? Pertama, kita bisa membawa kantong belanja yang terbuat dari kain. Kantong tersebut dapat digunakan berulang kali ketika berbelanja di pasar atau supermarket. Kedua, kita bisa mengurangi penggunaan botol plastik dengan cara membawa tempat minum atau botol minum sendiri yang dapat digunakan berulang kali. Ketiga, kita bisa menghindari penggunaan sedotan plastik dan menggantinya dengan sedotan yang terbuat dari bahan lain seperti bambu.<br/><br/><em>Sumber: dlh.bulelengkab.go.id</em>"
        },
        "teks_soal": "Pernyataan yang tidak sesuai dengan informasi dalam teks tersebut adalah ...",
        "opsi": [
            ("A", "Penggantian sedotan plastik bisa dilakukan dengan sedotan bambu."),
            ("B", "Plastik dapat memengaruhi kesehatan organ dalam tubuh manusia."),
            ("C", "Penguraian sampah plastik bisa terjadi hanya dalam hitungan bulan."),
            ("D", "Salah satu upaya untuk mengurangi sampah plastik adalah dengan membawa kantong kain saat belanja.")
        ],
        "kunci": "C",
        "pembahasan": "Dalam teks dinyatakan secara jelas: 'Perlu waktu bertahun-tahun untuk dapat membuat sampah plastik terurai secara alami', sehingga pernyataan pada opsi C (hanya dalam hitungan bulan) tidak sesuai."
    },
    {
        "nomor": 11,
        "tipe": "pg_sederhana",
        "kesulitan": "sedang",
        "materi": "Penyajian Informasi Teks ke Bagan",
        "capaian": "Menyusun skema logis alur teks eksplanasi lingkungan ke dalam bagan",
        "bacaan": {
            "grup": "wacana_sampah_plastik",
            "judul": "Dampak Sampah Plastik terhadap Lingkungan dan Kesehatan",
            "teks": ""
        },
        "teks_soal": "Urutan logis penyajian informasi dalam teks tersebut agar dapat disajikan dalam bentuk bagan adalah...",
        "opsi": [
            ("A", "Plastik sulit terurai mencemari laut &amp; sungai membahayakan organ tubuh → membawa botol minum sendiri menggunakan sedotan bambu."),
            ("B", "Plastik mencemari lautan → plastik merusak organ dalam menyarankan kantong kain → sedotan bambu botol minum sendiri."),
            ("C", "Plastik sulit terurai mencemari lingkungan merusak ekosistem &amp; organ tubuh → solusi: kantong kain, botol minum sendiri, sedotan bambu."),
            ("D", "Plastik mengandung bahan berbahaya mencemari lingkungan mencemari air minum mengganti botol plastik saja.")
        ],
        "kunci": "C",
        "pembahasan": "Bagan logis mengikuti struktur teks: Karakteristik plastik sulit terurai & pencemaran lingkungan (paragraf 1) → dampak ke organ tubuh (paragraf 2) → solusi pengurangan plastik (paragraf 3)."
    },
    {
        "nomor": 12,
        "tipe": "pg_sederhana",
        "kesulitan": "mudah",
        "materi": "Makna Rujukan Istilah",
        "capaian": "Menentukan makna rujukan istilah teknis kesehatan dalam kalimat",
        "bacaan": {
            "grup": "wacana_sampah_plastik",
            "judul": "Dampak Sampah Plastik terhadap Lingkungan dan Kesehatan",
            "teks": ""
        },
        "teks_soal": "Istilah &quot;<em>bahan kimia berbahaya</em>&quot; dalam teks merujuk pada objek .....",
        "opsi": [
            ("A", "zat berbahaya yang terkandung dalam plastik"),
            ("B", "sampah plastik yang menumpuk di laut"),
            ("C", "organ tubuh manusia yang rentan rusak"),
            ("D", "sedotan plastik yang digunakan sekali pakai")
        ],
        "kunci": "A",
        "pembahasan": "Kalimat teks berbunyi: 'Plastik mengandung bahan kimia berbahaya...', sehingga istilah tersebut merujuk langsung pada kandungan zat-zat kimia beracun di dalam plastik."
    },
    {
        "nomor": 13,
        "tipe": "pg_sederhana",
        "kesulitan": "sedang",
        "materi": "Konflik dalam Teks Drama/Dialog",
        "capaian": "Mengidentifikasi akar konflik yang dialami tokoh dalam teks percakapan",
        "bacaan": {
            "grup": "wacana_berani_jujur",
            "judul": "Berani Jujur",
            "teks": "<strong>Berani Jujur</strong><br/><br/><strong>Candra :</strong> Andaikata keadaan rumahku tidak seperti ini, tentu aku tidak akan mendapat masalah.<br/><strong>Rusdi :</strong> Ada apa, Can? Katakanlah, mungkin aku dapat membantumu! Ayolah, bicara saja!<br/><strong>Candra :</strong> Begini, Rus! Aku belum membayar buku karena orang tuaku belum mempunyai uang untuk melunasi. Padahal, aku sudah berjanji hari ini akan melunasi.<br/><strong>Rusdi :</strong> Begini... kita harus berani! Nanti, kita berdua menghadap kepala sekolah setelah pelajaran selesai, kemudian kita mengatakan sejujurnya tentang keadaanmu. Bagaimana?<br/><strong>Candra :</strong> Ya, itu ide baik sekali. Terima kasih, Rus."
        },
        "teks_soal": "Konflik utama yang dialami oleh Candra dalam dialog tersebut adalah",
        "opsi": [
            ("A", "ketakutan menghadapi kepala sekolah"),
            ("B", "janji kepada penjual buku"),
            ("C", "ketidakmampuan orang tuanya untuk membayar buku tepat waktu"),
            ("D", "saling menyalahkan antara Candra dan Rusdi")
        ],
        "kunci": "C",
        "pembahasan": "Penyebab utama timbulnya masalah bagi Candra adalah orang tuanya belum memiliki biaya untuk melunasi pembayaran buku sesuai janji hari tersebut."
    },
    {
        "nomor": 14,
        "tipe": "pg_sederhana",
        "kesulitan": "mudah",
        "materi": "Watak Tokoh Pendukung",
        "capaian": "Menganalisis respons emosional dan sikap tokoh terhadap teman",
        "bacaan": {
            "grup": "wacana_berani_jujur",
            "judul": "Berani Jujur",
            "teks": ""
        },
        "teks_soal": "Apa respons emosional Rusdi terhadap masalah yang dihadapi Candra?",
        "opsi": [
            ("A", "Simpati dan ingin membantu"),
            ("B", "Tidak peduli dan mengabaikan"),
            ("C", "Kesal karena Candra tidak jujur"),
            ("D", "Bingung dan tidak memberikan solusi")
        ],
        "kunci": "A",
        "pembahasan": "Rusdi menunjukkan kepedulian yang tinggi ('mungkin aku dapat membantumu!') dan memberikan ide jalan keluar bijak untuk menemui kepala sekolah secara jujur."
    },
    {
        "nomor": 15,
        "tipe": "pg_kompleks",
        "kesulitan": "sedang",
        "materi": "Nilai Moral dan Sikap Positif",
        "capaian": "Menentukan relevansi tindakan tokoh dengan nilai positif (pilihan lebih dari satu)",
        "bacaan": {
            "grup": "wacana_edo_kucing",
            "judul": "Edo dan Sepupunya Menolong Kucing",
            "teks": "Pagi hari yang cerah dimanfaatkan Edo dan sepupunya untuk bersepeda di sekitar taman kota. Mereka mengayuh sepeda dengan gembira sambil menikmati udara segar dan pepohonan rindang. Di salah satu sudut taman, mereka berhenti karena melihat seekor kucing terjebak di semak berduri. Dengan hati-hati, Edo menyingkirkan duri dan menyelamatkan kucing itu. Sepupunya lalu memberi kucing itu air minum dari botol yang mereka bawa. Setelah itu, mereka duduk di bangku taman sambil berbagi cerita. Edo berkata, &quot;Menolong makhluk hidup itu penting walau hanya seekor kucing.&quot;"
        },
        "teks_soal": "Peristiwa dalam teks menunjukkan tindakan Edo dan sepupunya yang mencerminkan nilai-nilai positif dalam kehidupan sehari-hari. Manakah dari pernyataan berikut yang benar-benar relevan dengan tindakan mereka?<br/><br/><em>Pilihlah jawaban yang benar! Jawaban benar lebih dari satu.</em>",
        "opsi": [
            ("A", "Menyelamatkan kucing menunjukkan sikap peduli terhadap makhluk hidup"),
            ("B", "Berbagi cerita di bangku taman menunjukkan sikap individualis."),
            ("C", "Memberi air kepada kucing mencerminkan empati terhadap hewan.")
        ],
        "kunci": "A, C",
        "pembahasan": "Tindakan Edo menyelamatkan kucing dari duri adalah bentuk peduli terhadap makhluk hidup (A), dan tindakan sepupunya memberi air minum adalah bukti empati terhadap hewan (C). Berbagi cerita adalah interaksi sosial/kebersamaan, bukan individualis."
    },
    {
        "nomor": 16,
        "tipe": "benar_salah",
        "kesulitan": "sedang",
        "materi": "Kalimat Majemuk Setara dan Bertingkat",
        "capaian": "Mengklasifikasikan kalimat majemuk setara dan majemuk bertingkat",
        "bacaan": {
            "grup": "wacana_edo_kucing",
            "judul": "Edo dan Sepupunya Menolong Kucing",
            "teks": ""
        },
        "teks_soal": "Berdasarkan isi teks, tentukan mana yang merupakan Kalimat majemuk setara atau Kalimat majemuk bertingkat untuk setiap pernyataan berikut!",
        "pernyataan": [
            ("Edo dan sepupunya bersepeda di sekitar taman kota.", "Kalimat Majemuk Setara"),
            ("Mereka berhenti karena melihat seekor kucing terjebak di semak berduri.", "Kalimat Majemuk Bertingkat"),
            ("Edo menyingkirkan duri dan menyelamatkan kucing itu.", "Kalimat Majemuk Setara"),
            ("Mereka duduk di bangku taman sambil berbagi cerita", "Kalimat Majemuk Bertingkat")
        ],
        "kunci": "Kalimat Majemuk Setara, Kalimat Majemuk Bertingkat, Kalimat Majemuk Setara, Kalimat Majemuk Bertingkat",
        "pembahasan": "• Kalimat 1 dan 3 menggunakan konjungsi koordinatif 'dan' sehingga tergolong Kalimat Majemuk Setara.<br/>• Kalimat 2 menggunakan konjungsi subordinatif sebab 'karena', dan Kalimat 4 menggunakan konjungsi subordinatif waktu bersamaan 'sambil', sehingga keduanya tergolong Kalimat Majemuk Bertingkat."
    },
    {
        "nomor": 17,
        "tipe": "pg_sederhana",
        "kesulitan": "sedang",
        "materi": "Ciri Teks Argumentasi",
        "capaian": "Menganalisis karakteristik teks argumentasi",
        "bacaan": {
            "grup": "wacana_pencemaran_lingkungan",
            "judul": "Pencemaran Lingkungan di Kota Besar",
            "teks": "Pencemaran lingkungan hampir terjadi di setiap wilayah Indonesia, terutama di kota-kota besar. Pencemaran lingkungan tersebut disebabkan oleh polusi udara dari kendaraan bermotor yang jumlahnya semakin lama semakin bertambah banyak, pembuangan limbah industri dari pabrik-pabrik yang mengandung polutan, dan ulah masyarakat sendiri yang sering membuang sampah sembarangan.<br/><br/>Pencemaran lingkungan tersebut dapat mengakibatkan kerugian yang cukup besar. Contohnya adalah udara menjadi kotor dan tidak sehat, menyebarnya berbagai virus dan bakteri atau terjangkitnya wabah penyakit, serta bencana banjir karena saluran-saluran air tersumbat oleh sampah."
        },
        "teks_soal": "Teks tersebut termasuk jenis teks argumentasi karena.....",
        "opsi": [
            ("A", "berisi peristiwa yang diuraikan secara kronologis"),
            ("B", "memuat ajakan kepada pembaca untuk melakukan sesuatu"),
            ("C", "menggambarkan objek dan peristiwa secara terperinci"),
            ("D", "menjelaskan penyebab dan akibat pencemaran dengan tujuan meyakinkan pembaca")
        ],
        "kunci": "D",
        "pembahasan": "Teks argumentasi memaparkan hubungan sebab (polusi, limbah, sampah) dan akibat (udara kotor, penyakit, banjir) dengan alasan rasional untuk meyakinkan pembaca."
    },
    {
        "nomor": 18,
        "tipe": "pg_sederhana",
        "kesulitan": "mudah",
        "materi": "Informasi Tersurat Paragraf",
        "capaian": "Menilai kebenaran pernyataan berdasarkan informasi teks lingkungan",
        "bacaan": {
            "grup": "wacana_pencemaran_lingkungan",
            "judul": "Pencemaran Lingkungan di Kota Besar",
            "teks": ""
        },
        "teks_soal": "Pernyataan di bawah ini yang paling sesuai dengan informasi yang disampaikan dalam teks adalah .....",
        "opsi": [
            ("A", "Pencemaran lingkungan di kota besar hanya disebabkan oleh limbah industri."),
            ("B", "Penyumbatan saluran air oleh sampah dapat memicu banjir."),
            ("C", "Penggunaan kendaraan bermotor tidak berkaitan dengan udara yang kotor."),
            ("D", "Polusi udara yang makin parah terjadi karena masyarakat lebih memilih menggunakan kendaraan umum")
        ],
        "kunci": "B",
        "pembahasan": "Pada paragraf kedua secara tersurat disebutkan: 'serta bencana banjir karena saluran-saluran air tersumbat oleh sampah'."
    },
    {
        "nomor": 19,
        "tipe": "pg_sederhana",
        "kesulitan": "mudah",
        "materi": "Kosakata Khusus / Istilah Teknis",
        "capaian": "Mengidentifikasi kosakata khusus bidang lingkungan hidup",
        "bacaan": {
            "grup": "wacana_pencemaran_lingkungan",
            "judul": "Pencemaran Lingkungan di Kota Besar",
            "teks": ""
        },
        "teks_soal": "Kosakata khusus yang terdapat dalam teks tersebut adalah ....",
        "opsi": [
            ("A", "industri"),
            ("B", "polutan"),
            ("C", "pabrik"),
            ("D", "penyakit")
        ],
        "kunci": "B",
        "pembahasan": "Kata 'polutan' adalah istilah khusus dalam ilmu lingkungan yang merujuk pada bahan atau zat pencemar yang merusak lingkungan hidup."
    },
    {
        "nomor": 20,
        "tipe": "pg_kompleks",
        "kesulitan": "sedang",
        "materi": "Membaca Infografis Data",
        "capaian": "Menganalisis perbandingan kuantitatif pada infografis tenaga kesehatan",
        "gambar": "/soal/to1-tka-bindo-sd-2026/soal_20_tenaga_kesehatan_batam.jpg",
        "teks_soal": "Perhatikan infografis data tenaga kesehatan Kota Batam di atas!<br/><br/>Berdasarkan informasi tersebut, manakah pernyataan yang benar?<br/><br/><em>Pilihlah jawaban yang benar! Jawaban benar lebih dari satu.</em>",
        "opsi": [
            ("A", "Jumlah perawat di Kota Batam lebih dari dua ribu orang."),
            ("B", "Jumlah dokter spesialis lebih banyak dibandingkan dengan jumlah dokter umum."),
            ("C", "Jumlah bidan di Kota Batam lebih dari seribu orang.")
        ],
        "kunci": "A, C",
        "pembahasan": "Berdasarkan infografis:<br/>• Perawat = 2.579 orang (&gt; 2.000) → Pernyataan 1 BENAR.<br/>• Dokter Spesialis = 279 orang, sedangkan Dokter Umum = 665 orang (279 &lt; 665) → Pernyataan 2 SALAH.<br/>• Bidan = 1.040 orang (&gt; 1.000) → Pernyataan 3 BENAR."
    },
    {
        "nomor": 21,
        "tipe": "pg_sederhana",
        "kesulitan": "mudah",
        "materi": "Informasi Teks Wawancara",
        "capaian": "Menemukan informasi penting dari hasil wawancara ahli gizi",
        "bacaan": {
            "grup": "wacana_sarapan_sehat",
            "judul": "Wawancara bersama Bu Tika, Ahli Gizi: Pentingnya Sarapan Sehat",
            "teks": "<strong>Wawancara bersama Bu Tika, Ahli Gizi</strong><br/><br/>Wawancara ini bertujuan untuk memberikan informasi tentang pentingnya sarapan sehat bagi anak-anak usia sekolah.<br/><strong>Pewawancara :</strong> Selamat pagi, Bu Tika. Apa manfaat sarapan sehat bagi anak-anak?<br/><strong>Bu Tika :</strong> Selamat pagi. Sarapan sehat sangat penting karena dapat meningkatkan konsentrasi dan energi anak saat belajar di sekolah.<br/><strong>Pewawancara :</strong> Makanan seperti apa yang sebaiknya dikonsumsi saat sarapan?<br/><strong>Bu Tika :</strong> Anak-anak sebaiknya makan makanan yang bergizi seimbang, seperti nasi, telur, sayur, dan buah.<br/><strong>Pewawancara :</strong> Bagaimana jika anak tidak terbiasa sarapan?<br/><strong>Bu Tika :</strong> Orang tua bisa membiasakan anak secara bertahap, misalnya dengan memberi porsi kecil terlebih dahulu agar lambung tidak kaget."
        },
        "teks_soal": "Manfaat sarapan sehat bagi anak-anak usia sekolah berdasarkan teks tersebut adalah ....",
        "opsi": [
            ("A", "Meningkatkan konsentrasi saat belajar."),
            ("B", "Membantu anak lebih aktif bermain di luar kelas."),
            ("C", "Menjaga kesehatan lambung anak agar tidak kaget saat menerima makanan dalam jumlah besar."),
            ("D", "Mengurangi risiko penyakit jantungan.")
        ],
        "kunci": "A",
        "pembahasan": "Jawaban Bu Tika pada kutipan pertama menegaskan: 'Sarapan sehat sangat penting karena dapat meningkatkan konsentrasi dan energi anak saat belajar di sekolah.'"
    },
    {
        "nomor": 22,
        "tipe": "pg_sederhana",
        "kesulitan": "sedang",
        "materi": "Kosakata dan Citraan Puisi",
        "capaian": "Mengidentifikasi objek alam yang digambarkan secara langsung dalam bait puisi",
        "bacaan": {
            "grup": "wacana_puisi_hijau_alamku",
            "judul": "Puisi Hijau Alamku (Oleh Farhanah. A)",
            "teks": "<strong>Hijau Alamku</strong><br/><em>(Oleh Farhanah. A)</em><br/><br/>Hijau alamku<br/>Rerumputan menggelar bak permadani<br/>Ilalang menjuntai menembus awan<br/>Dedaunan berbisik di semilir angin<br/>Hadirmu membawa manfaat<br/>Meskipun tugasmu kini semakin berat<br/>Tetaplah tegar bagai akar di dasar bumi<br/>Menjadi sumber kehidupan yang abadi"
        },
        "teks_soal": "Berdasarkan kosakata yang digunakan dalam puisi &quot;Hijau Alamku&quot;, objek alam manakah yang digambarkan secara langsung dalam puisi?",
        "opsi": [
            ("A", "Permadani"),
            ("B", "Awan"),
            ("C", "Ilalang"),
            ("D", "Akar")
        ],
        "kunci": "C",
        "pembahasan": "'Ilalang' (bersama rerumputan dan dedaunan) adalah objek alam tumbuhan hidup yang dideskripsikan secara nyata dalam puisi. Kata permadani adalah kiasan pembanding, sedangkan akar digunakan sebagai simile keteguhan."
    },
    {
        "nomor": 23,
        "tipe": "pg_kompleks",
        "kesulitan": "sedang",
        "materi": "Maksud dan Amanat Puisi",
        "capaian": "Menganalisis pesan dan makna dalam puisi alam (pilihan lebih dari satu)",
        "bacaan": {
            "grup": "wacana_puisi_hijau_alamku",
            "judul": "Puisi Hijau Alamku (Oleh Farhanah. A)",
            "teks": ""
        },
        "teks_soal": "Apa maksud dari puisi tersebut?<br/><br/><em>Pilihlah jawaban yang benar! Jawaban benar lebih dari satu.</em>",
        "opsi": [
            ("A", "Menggambarkan keindahan alam melalui imaji, seperti rerumputan dan dedaunan."),
            ("B", "Menekankan bahwa alam tidak memiliki peran penting dalam kehidupan."),
            ("C", "Menyampaikan pesan tentang keteguhan alam dalam menghadapi tantangan.")
        ],
        "kunci": "A, C",
        "pembahasan": "Puisi memaparkan imaji visual keindahan alam (A) sekaligus menyampaikan pesan keteguhan agar alam tetap tegar menjadi sumber kehidupan abadi meski tantangannya kian berat (C)."
    },
    {
        "nomor": 24,
        "tipe": "benar_salah",
        "kesulitan": "sulit",
        "materi": "Majas Puisi (Gaya Bahasa)",
        "capaian": "Mengklasifikasikan larik puisi ke dalam majas Hiperbola, Simile, atau Personifikasi",
        "bacaan": {
            "grup": "wacana_puisi_hijau_alamku",
            "judul": "Puisi Hijau Alamku (Oleh Farhanah. A)",
            "teks": ""
        },
        "teks_soal": "Tentukan apakah larik-larik dalam puisi tersebut mengandung majas Hiperbola, Simile, atau Personifikasi!",
        "pernyataan": [
            ("Rerumputan menggelar bak permadani", "Simile"),
            ("Ilalang menjuntai menembus awan", "Hiperbola"),
            ("Dedaunan berbisik di semilir angin", "Personifikasi"),
            ("Tetaplah tegar bagai air di dasar bumi", "Simile")
        ],
        "kunci": "Simile, Hiperbola, Personifikasi, Simile",
        "pembahasan": "1. 'bak permadani' membandingkan langsung dengan kata pembanding → Simile.<br/>2. 'menembus awan' melebih-lebihkan kenyataan → Hiperbola.<br/>3. 'berbisik' mengumpamakan dedaunan bertingkah seperti manusia → Personifikasi.<br/>4. 'bagai air/akar di dasar bumi' menggunakan kata pembanding bagai → Simile."
    },
    {
        "nomor": 25,
        "tipe": "pg_sederhana",
        "kesulitan": "sedang",
        "materi": "Penyebab Fenomena Alam Teks Eksplanasi",
        "capaian": "Menemukan alasan ilmiah mengapa langit berwarna biru berdasarkan teks",
        "bacaan": {
            "grup": "wacana_langit_biru",
            "judul": "Mengapa Langit Berwarna Biru?",
            "teks": "<strong>Mengapa Langit Berwarna Biru?</strong><br/><br/>Warna biru pada langit merupakan fenomena yang menarik dan kompleks yang melibatkan interaksi antara cahaya matahari dan atmosfer bumi. Mengutip Space Place NASA, langit bisa berwarna biru karena cahaya matahari mencapai atmosfer bumi dan disebarkan ke segala arah oleh semua gas dan partikel di udara.<br/><br/>Meski cahaya matahari tampak putih, sebenarnya terdiri dari semua warna pelangi yaitu merah, jingga, kuning, hijau, biru, nila, dan ungu. Cahaya biru lebih banyak tersebar daripada warna lain karena bergerak dalam gelombang yang lebih pendek dan lebih kecil. Inilah sebabnya mengapa langit berwarna biru hampir sepanjang waktu.<br/><br/><em>Sumber: tempo.co</em>"
        },
        "teks_soal": "Berdasarkan teks tersebut, yang menyebabkan langit berwarna biru adalah ...",
        "opsi": [
            ("A", "Interaksi antara atmosfer bumi dan bulan."),
            ("B", "Warna merah yang dominan dalam cahaya matahari."),
            ("C", "Cahaya matahari yang mencapai atmosfer bumi dan diserap oleh gas dan partikel di udara."),
            ("D", "Cahaya biru yang bergerak dalam gelombang yang lebih pendek dan lebih kecil sehingga lebih banyak tersebar.")
        ],
        "kunci": "D",
        "pembahasan": "Paragraf kedua menjelaskan bahwa cahaya biru bergerak dalam gelombang yang lebih pendek dan lebih kecil sehingga lebih banyak dihamburkan/disebarkan ke segala arah dibanding spektrum warna lainnya."
    },
    {
        "nomor": 26,
        "tipe": "benar_salah",
        "kesulitan": "sedang",
        "materi": "Penggambaran Tokoh dan Penokohan",
        "capaian": "Menilai kesesuaian watak tokoh cerita berdasarkan dialog dan tindakan",
        "bacaan": {
            "grup": "wacana_belajar_sepeda",
            "judul": "Agil Belajar Naik Sepeda Sendiri",
            "teks": "&quot;Bu, Galih pamit main dulu ya!&quot; ujar Galih sambil mencium tangan ibu.<br/>&quot;Lho, Kak katanya hari Minggu ini mau mengajariku naik sepeda,&quot; sahut Agil melihat kakaknya yang hendak pergi. &quot;Aku bosan nih nonton televisi di rumah saja.&quot;<br/>&quot;Pergilah keluar bermain bersama teman-temanmu. Jangan di rumah terus,&quot; jawab Kak Galih.<br/>&quot;Yahhh... Teman-temanku kan sedang pergi main sepeda semua, Kak. Hanya aku yang belum bisa mengendarai sepeda,&quot; gerutu Agil.<br/>&quot;Lalu, salah siapa kamu belum bisa mengendarai sepeda?&quot; canda Kak Galih. &quot;Jangan hari ini, ya. Aku mau bermain basket dulu di lapangan. Besok saja ya, Gil!&quot; kata Kak Galih sambil berlari meninggalkan Agil.<br/><br/>Agil hanya menarik napas kecewa. Ia lalu kembali duduk menonton kartun kesukaannya. Selang beberapa menit, Agil sudah mulai gelisah dan merasa bosan. Agil membayangkan teman-temannya yang sedang asyik bermain sepeda bersama.<br/><br/>&quot;Coba aku sudah bisa naik sepeda dari dulu ya, pasti aku bisa ikut bermain bersama teman-teman,&quot; sesal Agil karena selama ini tidak mau berusaha keras belajar naik sepeda. Agil memutuskan untuk belajar naik sepeda sendiri. &quot;Pokoknya, aku harus bisa naik sepeda hari ini,&quot; tekad Agil dalam hati. Ia lalu mengambil sepeda dan pelindung diri yang sudah dibelikan ayah di garasi. Ia lalu memakai helm sepeda dan pelindung diri lainnya sebelum belajar mengendarai sepeda."
        },
        "teks_soal": "Berdasarkan informasi tersebut, tentukan Benar atau Salah pada penggambaran tokoh dan watak sesuai dengan isi teks.",
        "pernyataan": [
            ("Agil: Pemarah dan tidak memiliki semangat juang", "Salah"),
            ("Kak Galih: Ramah dan suka bercanda.", "Benar"),
            ("Kak Galih: Bijak dan memberikan saran yang baik.", "Salah"),
            ("Agil: Penuh tekad dan kemauan untuk belajar.", "Benar")
        ],
        "kunci": "Salah, Benar, Salah, Benar",
        "pembahasan": "• Agil bukan pemarah, melainkan memiliki tekad kuat belajar mandiri (1: Salah, 4: Benar).<br/>• Kak Galih digambarkan suka bercanda dan santai (2: Benar), tetapi tindakannya meninggalkan Agil demi main basket bukan cerminan saran bijak (3: Salah)."
    },
    {
        "nomor": 27,
        "tipe": "pg_sederhana",
        "kesulitan": "mudah",
        "materi": "Keteladanan dan Pembelajaran Pengalaman Tokoh",
        "capaian": "Menyimpulkan pelajaran moral dari pengalaman tokoh cerita",
        "bacaan": {
            "grup": "wacana_belajar_sepeda",
            "judul": "Agil Belajar Naik Sepeda Sendiri",
            "teks": ""
        },
        "teks_soal": "Berdasarkan cerita tersebut, apa yang dapat dipelajari dari pengalaman Agil dalam belajar naik sepeda?",
        "opsi": [
            ("A", "Rasa bosan dapat diatasi dengan melakukan kegiatan yang menyenangkan tanpa perlu usaha lebih."),
            ("B", "Belajar dari kesalahan dan mengambil inisiatif untuk memperbaiki diri."),
            ("C", "Menunggu orang lain untuk membantu kita mencapai tujuan."),
            ("D", "Menghindari tantangan dan memilih kegiatan yang lebih mudah")
        ],
        "kunci": "B",
        "pembahasan": "Agil menyadari penyesalannya di masa lalu yang enggan berlatih, lalu berani mengambil inisiatif mandiri untuk belajar sepeda sendiri dengan tekad kuat."
    },
    {
        "nomor": 28,
        "tipe": "pg_sederhana",
        "kesulitan": "sedang",
        "materi": "Ringkasan Teks Eksposisi",
        "capaian": "Menentukan rangkuman isi teks artikel kesehatan dan tumbuh kembang anak",
        "bacaan": {
            "grup": "wacana_memiara_hewan",
            "judul": "Manfaat Memiara Hewan di Rumah bagi Anak",
            "teks": "<strong>Manfaat Memiara Hewan di Rumah</strong><br/><br/>Memiara hewan di rumah sangat bermanfaat. Hewan bisa membantu tumbuh kembang anak. Anak belajar bertanggung jawab sejak kecil. Anak belajar memberi makan hewan. Anak juga belajar menjaga kebersihan kandang.<br/><br/>Kegiatan merawat hewan membentuk kasih sayang. Anak jadi lebih peduli pada sesama. Anak menyadari bahwa hewan juga butuh perhatian. Sama seperti manusia, hewan perlu makan. Hewan juga butuh tempat yang nyaman.<br/><br/>Hewan piaraan bisa jadi teman bermain. Anak tidak merasa kesepian di rumah. Anak tunggal akan merasa lebih bahagia. Ia memiliki teman yang menyenangkan.<br/><br/>Hewan juga membantu anak percaya diri. Anak bangga bisa merawat hewannya. Anak bisa senang bercerita tentang piaraannya. Kebiasaan ini membuat anak lebih mudah bergaul.<br/><br/>Bermain dengan hewan membuat hati tenang. Anak bisa lebih relaks dan bahagia. Perasaan bahagia dapat mengurangi rasa stres. Bahkan, anak bisa jadi lebih fokus belajar.<br/><br/>Memiara hewan juga menyehatkan tubuh. Anak bisa lebih aktif bergerak bersama hewan. Selain itu, memiara hewan bisa memperkuat daya tahan tubuh.<br/><br/>Memiara hewan juga bisa mempererat hubungan keluarga. Keluarga bisa bermain bersama hewan. Kegiatan ini menumbuhkan kebersamaan. Memiara hewan memang perlu usaha. Namun, manfaatnya sangat besar untuk anak. Yuk, rawat hewan dengan kasih sayang!<br/><br/><em>Sumber: Damar Upahita/Hello Sehat (2024)</em>"
        },
        "teks_soal": "Manakah ringkasan yang paling tepat berdasarkan teks tersebut?",
        "opsi": [
            ("A", "Anak jadi lebih mandiri dan percaya diri. Memiara hewan membuat anak sibuk. Ia jadi tahu tugasnya setiap hari."),
            ("B", "Hewan piaraan membuat anak aktif bermain. Anak belajar tanggung jawab dan kasih sayang. Keluarga juga lebih dekat satu sama lain."),
            ("C", "Memiara hewan membuat anak peduli lingkungan. Anak jadi lebih sehat dan jarang sakit. Keluarga pun ikut belajar mencintai alam."),
            ("D", "Memiara hewan bisa mengganggu kenyamanan rumah. Anak harus selalu membersihkan kandang. Hewan juga butuh perhatian setiap waktu.")
        ],
        "kunci": "B",
        "pembahasan": "Opsi B memuat pokok-pokok penting bacaan: anak aktif beraktivitas, pembentukan rasa tanggung jawab serta kasih sayang, dan menumbuhkan kebersamaan hubungan keluarga."
    },
    {
        "nomor": 29,
        "tipe": "pg_sederhana",
        "kesulitan": "mudah",
        "materi": "Konflik Cerita Fabel",
        "capaian": "Mengidentifikasi sebab timbulnya pertikaian dalam cerita fabel",
        "bacaan": {
            "grup": "wacana_fabel_ogi_oyi",
            "judul": "Fabel: Ogi Sahabat Oyi",
            "teks": "<strong>Ogi Sahabat Oyi</strong><br/><br/>&quot;Huh! Oyi sombong!&quot; gumam Ogi kesal.<br/>Kini Ogi benar-benar kesal pada Oyi. Dua hari yang lalu, Ogi mengajak Oyi bermain tetapi Oyi tidak mau. Kemarin malam, Ogi mengajak Oyi latihan menyanyi, tetapi Oyi juga tidak mau. Sekarang, Ogi mengajak Oyi mencari nyamuk, lagi-lagi Oyi tidak mau.<br/>&quot;Mungkin Oyi sudah bosan bermain denganku!&quot; pikir Ogi dongkol. &quot;Biar saja! Aku tak mau mengajak Oyi lagi!&quot;<br/>Hari-hari berikutnya, Ogi bermain sendirian. Ayah Ogi heran melihatnya.<br/>&quot;Oyi sekarang sombong, Yah!&quot; jawab Ogi ketika ayahnya bertanya. &quot;Ia tidak mau bermain dengan Ogi lagi.&quot;<br/>&quot;Ogi tahu, kenapa Oyi tak mau diajak bermain?&quot; tanya Ayah lagi.<br/>&quot;Sudahlah, Yah! Pokoknya Oyi itu sombong!&quot; ujar Ogi kesal.<br/>&quot;Ogi, kau akan menyesal memusuhi sahabat tanpa tahu sebabnya. Seperti yang pernah Ayah alami...&quot; ucap ayah Ogi sedih.<br/>Ayah Ogi lalu bercerita.<br/>&quot;Waktu Ayah masih kecil, Ayah pernah memusuhi sahabat akrab Ayah karena ia tak mau diajak bermain. Belakangan, Ayah baru tahu. Kaki depan sahabat Ayah itu sakit hingga menjadi lumpuh. Rupanya, ia malu menceritakan penyakitnya itu kepada Ayah. Setelah mengetahui hal itu, Ayah menyesal telah memusuhi sahabat yang sedang sakit itu.&quot;<br/>Mendengar cerita itu, wajah Ogi menjadi pucat pasi.<br/><br/><em>Sumber: Sarah Nafisah/Bobo (2025)</em>"
        },
        "teks_soal": "Apa konflik utama dalam fabel tersebut?",
        "opsi": [
            ("A", "Ayah tokoh Ogi melarang tokoh Ogi berteman dengan tokoh Oyi."),
            ("B", "Tokoh Ogi kesal karena tidak diizinkan bermain oleh ayahnya."),
            ("C", "Tokoh Ogi merasa tokoh Oyi sombong karena menolak ajakan bermain."),
            ("D", "Tokoh Oyi sering bermain dengan teman lain tanpa mengajak tokoh Ogi.")
        ],
        "kunci": "C",
        "pembahasan": "Konflik bermula saat Ogi berprasangka buruk dan kesal menganggap sahabatnya (Oyi) sombong karena menolak berulang kali ajakan bermainnya."
    },
    {
        "nomor": 30,
        "tipe": "pg_sederhana",
        "kesulitan": "sedang",
        "materi": "Informasi Teks Sejarah / Peristiwa Kebangsaan",
        "capaian": "Menganalisis pelaksanaan Kongres Pemuda I berdasarkan fakta teks",
        "bacaan": {
            "grup": "wacana_kongres_pemuda",
            "judul": "Kongres Pemuda I dan Persatuan Bangsa",
            "teks": "<strong>Kongres Pemuda I dan Persatuan Bangsa</strong><br/><br/>Kongres Pemuda I terjadi pada 1926. Kongres diadakan pada 30 April - 2 Mei di Jakarta. Banyak organisasi pemuda ikut serta. Mereka datang dari berbagai daerah di Indonesia. Tujuan utama kongres adalah persatuan. Para pemuda ingin Indonesia bersatu.<br/><br/>Sebelum kongres, organisasi sudah banyak. Contohnya Jong Java dan Jong Sumatranen Bond. Ada juga Jong Celebes dan Jong Ambon. Mereka bergerak sesuai daerah masing-masing. Namun, muncul kesadaran untuk bersatu. Satiman dari Tri Koro Dharmo memulai. Ia membayangkan organisasi pemuda bersatu. Perwakilan organisasi lalu berkumpul. Mereka membentuk panitia Kongres Pemuda 1. Panitia kongres diketuai oleh Mohammad Tabrani.<br/><br/>Tujuan kongres ada beberapa capaian. Pertama, menyatukan organisasi pemuda Indonesia. Kedua, memperkuat semangat kebangsaan. Ketiga, membentuk dasar kemerdekaan Indonesia.<br/><br/>Kongres Pemuda I menghasilkan keputusan penting. Ada beberapa keputusan hasil Kongres Pemuda I. Pertama, kemerdekaan Indonesia menjadi cita-cita para pemuda. Kedua, perserikatan pemuda harus bersatu padu. Ketiga, seluruh pemuda menginginkan Indonesia merdeka. Keempat, organisasi pemuda mewadahi semangat persatuan. Kongres Pemuda I menjadi langkah awal. Peristiwa ini menginspirasi generasi berikutnya. Persatuan bangsa menjadi harapan semua pemuda.<br/><br/><em>Sumber: Muhtar/UICI (2024)</em>"
        },
        "teks_soal": "Bagaimana pelaksanaan Kongres Pemuda I sesuai isi teks?",
        "opsi": [
            ("A", "Bertujuan memperkuat identitas daerah, diikuti pemuda dari satu wilayah, dan belum menghasilkan keputusan."),
            ("B", "Diselenggarakan oleh tokoh pergerakan, membahas cita-cita bersama, dan melibatkan berbagai organisasi."),
            ("C", "Digagas pemerintah kolonial, melibatkan pemuda dari kalangan elite, dan fokus pada pendidikan."),
            ("D", "Diadakan secara spontan, dihadiri oleh tokoh luar negeri, dan belum membahas isu kebangsaan.")
        ],
        "kunci": "B",
        "pembahasan": "Sesuai isi teks, Kongres Pemuda I diselenggarakan oleh tokoh pergerakan pemuda (seperti Satiman dan Mohammad Tabrani), dihadiri berbagai organisasi daerah nusantara, dan membahas persatuan serta cita-cita kemerdekaan bangsa Indonesia."
    }
]

def render_html():
    articles = []
    for q in SOAL_BINDO:
        num = q["nomor"]
        tipe = q["tipe"]
        kes = q["kesulitan"]
        materi = q["materi"]
        cp = q["capaian"]
        bacaan = q.get("bacaan")
        gambar = q.get("gambar")
        teks_soal = q["teks_soal"]
        kunci = q["kunci"]
        pembahasan = q["pembahasan"]

        art = [
            f'  <article data-gemilang-question data-nomor="{num}" data-paket="1" data-tipe="{tipe}" data-mapel="Bahasa Indonesia" data-kelas="6" data-kesulitan="{kes}">',
            f'    <div data-field="materi">{materi}</div>',
            f'    <div data-field="capaian_pembelajaran">{cp}</div>'
        ]

        if bacaan:
            grup = bacaan.get("grup", "")
            judul = bacaan.get("judul", "")
            teks_b = bacaan.get("teks", "")
            art.append(f'    <div data-field="bacaan" data-grup="{grup}" data-judul="{judul}">')
            if judul and teks_b:
                art.append(f'      <h3>{judul}</h3>')
            if teks_b:
                art.append(f'      <p>{teks_b}</p>')
            art.append('    </div>')

        if gambar:
            art.append('    <div data-field="gambar">')
            art.append(f'      <img src="{gambar}" data-url="{gambar}" alt="Infografis Soal {num}" style="max-width:100%; max-height:360px; display:block; margin:10px auto; border-radius:8px; border:1px solid #cbd5e1;" />')
            art.append('    </div>')

        art.append('    <div data-field="teks_soal">')
        art.append(f'      <p>{teks_soal}</p>')
        art.append('    </div>')

        if tipe in ["pg_sederhana", "pg_kompleks"]:
            art.append('    <ol data-field="opsi_jawaban">')
            for lbl, t in q.get("opsi", []):
                art.append(f'      <li data-label="{lbl}">{t}</li>')
            art.append('    </ol>')

        elif tipe in ["benar_salah", "pg_kategori"]:
            art.append('    <ul data-field="pernyataan">')
            for t, jwb in q.get("pernyataan", []):
                art.append(f'      <li data-jawaban="{jwb}">{t}</li>')
            art.append('    </ul>')

        art.append(f'    <meta data-field="kunci_jawaban" data-value="{kunci}" />')
        art.append('    <meta data-field="kunci_terverifikasi" data-value="true" />')
        art.append('    <div data-field="pembahasan">')
        art.append(f'      <p>{pembahasan}</p>')
        art.append('    </div>')
        art.append('  </article>')

        articles.append("\n".join(art))

    html = f"""<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Try Out I TKA Bahasa Indonesia SD/MI 2025/2026 - Master Impor Gemilang</title>
  <style>
    body {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      background-color: #f8fafc;
      margin: 0;
      padding: 24px;
    }}
    .container {{
      max-width: 900px;
      margin: 0 auto;
      background: #ffffff;
      padding: 32px 36px;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }}
    header {{
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }}
    h1 {{
      font-size: 22px;
      color: #0f172a;
      margin: 0 0 6px 0;
    }}
    .subtitle {{
      font-size: 14px;
      color: #64748b;
      font-weight: 500;
    }}
    article {{
      border-bottom: 1px solid #e2e8f0;
      padding: 24px 0;
    }}
    [data-field="materi"] {{
      font-size: 12px;
      font-weight: 700;
      color: #2563eb;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }}
    [data-field="capaian_pembelajaran"] {{
      font-size: 12px;
      color: #64748b;
      margin-bottom: 12px;
    }}
    [data-field="bacaan"] {{
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px 18px;
      margin-bottom: 16px;
    }}
    [data-field="bacaan"] h3 {{
      margin: 0 0 8px 0;
      font-size: 15px;
      color: #0f172a;
    }}
    [data-field="teks_soal"] {{
      font-size: 15px;
      font-weight: 500;
      margin-bottom: 14px;
    }}
    ol[data-field="opsi_jawaban"] {{
      margin: 0 0 16px 20px;
      padding: 0;
    }}
    ol[data-field="opsi_jawaban"] li {{
      margin-bottom: 8px;
    }}
    ul[data-field="pernyataan"] {{
      list-style-type: none;
      padding: 0;
      margin: 0 0 16px 0;
    }}
    ul[data-field="pernyataan"] li {{
      padding: 8px 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      margin-bottom: 6px;
    }}
    [data-field="pembahasan"] {{
      background: #f0fdf4;
      border-left: 4px solid #22c55e;
      padding: 12px 16px;
      font-size: 13.5px;
      color: #166534;
      border-radius: 0 8px 8px 0;
    }}
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>TRY OUT I TES KEMAMPUAN AKADEMIK (TKA) SD/MI</h1>
      <div class="subtitle">Mata Pelajaran: BAHASA INDONESIA | Kelas VI | KKG Rejotangan Tulungagung 2025/2026</div>
    </header>
{chr(10).join(articles)}
  </div>
</body>
</html>
"""
    return html

if __name__ == "__main__":
    content = render_html()
    paths = [
        "/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app/public/bank-soal/to1_tka_bahasa_indonesia_sd_2026_lengkap.html",
        "/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app/data/impor/to1_tka_bahasa_indonesia_sd_2026_lengkap.html"
    ]
    for p in paths:
        os.makedirs(os.path.dirname(p), exist_ok=True)
        with open(p, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Generated ({len(content)} bytes): {p}")
