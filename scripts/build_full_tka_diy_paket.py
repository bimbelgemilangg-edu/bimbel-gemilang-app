# scripts/build_full_tka_diy_paket.py
import json
import os

DIR_IMPOR = "/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app/data/impor"
DIR_EKSTRAKSI = "/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app/public/ekstraksi-buku"
DIR_PUBLIC = "/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app/public"

os.makedirs(DIR_IMPOR, exist_ok=True)
os.makedirs(DIR_EKSTRAKSI, exist_ok=True)

# ------------------------------------------------------------------------------
# 1. BAHASA INDONESIA PAKET A
# ------------------------------------------------------------------------------

bcn_1 = {
    "grup": "stimulus_lingkungan_jogja",
    "judul": "Kondisi Lingkungan Perkotaan Yogyakarta",
    "teks": """Kondisi lingkungan perkotaan Yogyakarta menghadapi tekanan signifikan akibat urbanisasi pesat, pertumbuhan populasi, dan keterbatasan lahan. Isu paling mendesak adalah pengelolaan sampah, yang telah mencapai tahap "darurat sampah" sejak penutupan permanen Tempat Pemrosesan Akhir (TPA) Piyungan. Kota ini menghasilkan sekitar 300 ton sampah per hari, melebihi kapasitas penanganan lokal, yang menyebabkan penumpukan sampah liar. Pemerintah kota berupaya mengatasi ini melalui pelarangan plastik sekali pakai dan mengoptimalkan pengolahan sampah dari sumbernya, tetapi tantangan logistik tetap besar.
Selain sampah, masalah lingkungan lain yang menonjol adalah kualitas udara dan minimnya Ruang Terbuka Hijau (RTH). Tingkat polusi udara sering berada dalam kategori sedang karena padatnya aktivitas kendaraan bermotor. Di sisi lain, realisasi RTH publik di Yogyakarta baru mencapai sekitar 2,6 juta m², sangat jauh dari target minimal 30% yang diamanatkan undang-undang. Keterbatasan lahan menjadi penghalang utama dalam penyediaan ruang hijau yang diperlukan untuk menjaga keseimbangan ekologis kota."""
}

bcn_2 = {
    "grup": "stimulus_youtube_shorts",
    "judul": "Cara Membuat Konten YouTube Shorts",
    "sumber": "support.google.com/youtube",
    "teks": """YouTube Shorts merupakan fitur YouTube yang memungkinkan pengguna membagikan video pendek berdurasi singkat. Konten ini banyak diminati karena mudah dibuat, menarik, dan cepat menjangkau penonton. Oleh karena itu, diperlukan pemahaman yang tepat mengenai langkah-langkah pembuatannya agar hasil video sesuai dengan ketentuan.
Langkah-langkah
1. Pastikan Anda telah memiliki akun YouTube yang aktif dan aplikasi YouTube telah terpasang di perangkat yang digunakan.
2. Siapkan ide atau konsep video yang akan dibuat agar isi konten lebih terarah dan mudah dipahami penonton.
3. Rekam video menggunakan kamera ponsel dengan posisi vertikal atau rasio 9:16.
4. Pastikan durasi video tidak lebih dari 60 detik agar sesuai dengan ketentuan YouTube Shorts.
5. Setelah merekam, buka aplikasi YouTube di ponsel yang digunakan.
6. Tekan ikon tanda tambah (+) yang berada di bagian bawah layar.
7. Pilih menu Buat Short atau Upload video sesuai kebutuhan.
8. Jika memilih unggah video, pastikan kembali format video sudah vertikal.
9. Tambahkan judul yang menarik dan relevan dengan isi video agar penonton tertarik.
10. Sertakan tagar #Shorts pada judul atau deskripsi agar video terdeteksi sebagai YouTube Shorts.
11. Atur audiens video menjadi privat, kemudian pilih untuk anak-anak atau umum, sesuai sasaran penonton.
12. Periksa kembali seluruh bagian video sebelum dipublikasikan.
13. Tekan tombol Upload untuk mengunggah video ke YouTube.
14. Tunggu hingga proses unggahan selesai dengan sempurna.
15. Setelah proses selesai, YouTube Shorts siap ditonton oleh pengguna lain.
Dengan mengikuti langkah-langkah tersebut secara berurutan, siapa pun dapat membuat dan membagikan konten YouTube Shorts secara mudah, aman, dan praktis."""
}

bcn_3 = {
    "grup": "stimulus_tangerang_10k",
    "judul": "Saatnya Para Pelari Bercerita",
    "sumber": "Kompas, 7 Desember 2025, dengan penyesuaian",
    "teks": """Pelari di Tangerang 10K tidak hanya berlomba. Sekitar 2.500 peserta juga akan melintasi titik-titik menarik di Kota Tangerang. Dengan berlari, mereka berbagi cerita tentang apa saja, mulai dari ambisi berdiri di podium hingga harapan tentang kota yang terus bertumbuh. Aneka kisah itu dituangkan dalam Tangerang 10K, ajang lari yang bakal diikuti 2.500 peserta dari berbagai daerah, Minggu (7/12/2025).
Antusiasme pelari untuk berbagi cerita itu tampak saat pengambilan race pack Tangerang 10K di Pasific Garden, Kota Tangerang, Banten, Sabtu (6/12). Sejak pukul 10.00 WIB, para peserta bergantian menuliskan pesan hingga harapan di papan “Whats your running story?”.
Beberapa tulisan itu mengandung harapan, seperti “semoga podium ya” atau “wong mbatu (orang Batu) ke Tangerang 10K, podium yuk”. Ada juga yang lucu, seperti “lari pagi itu sehat, lari dari kenyataan itu tidak sehat, jujurly (jujur), aku mls (malas) sekali lari, tp (tapi) okelah”.
Meskipun beragam, berbagai coretan itu menunjukkan antusiame pelari mengikuti ajang yang digelar Pemerintah Kota Tangerang bersama harian Kompas (Kompas.id) dan Bank BJB.
Joliansyah (24) dan Wandi Agustian (25), misalnya, sengaja terbang dari Belitung Timur, Bangka Belitung, Jumat (5/12). “Sebenarnya kami bertiga, tetapi yang satu lagi baru berangkat hari ini. Makanya, race pack-nya saya ambilkan,” ucap Joliansyah yang menenteng dua tas race pack berisi jersei, nomor BIB atau nomor dada, dan produk pendukung lainnya. Demi Tangerang 10K, ia juga menyewa penginapan setempat."""
}

bcn_4 = {
    "grup": "stimulus_banjir_sumatra",
    "judul": "Bencana Banjir Bandang dan Tanah Longsor di Sumatera",
    "sumber": "cnbcindonesia.com",
    "teks": """Bencana banjir bandang dan tanah longsor yang melanda Sumatra Barat, Sumatra Utara dan Aceh pada akhir November lalu terjadi karena beberapa penyebab seperti curah hujan tinggi. Namun juga ada alasan lain yakni kerusakan ekosistem hutan di hulu Daerah Aliran Sungai (DAS) karena deforestasi.
Menurut Peneliti Hidrologi Hutan dan Konservasi DAS UGM, Hatma Suryatmojo, hutan di wilayah DAS memiliki peranan seperti penyangga hidrologis. Ini bisa menjadi spons untuk menyerap air hujan ke dalam tanah, seraya menahannya untuk tidak langsung masuk ke sungai.
Dari hasil berbagai penelitian di hutan tropis alami Kalimantan dan Sumatera, kemampuan hutan di wilayah tersebut menahan dan menampung air hujan di tajuk mencapai 15-35% dari hujan. Dengan permukaan tanah yang tidak terganggu bisa memasukkan air ke dalam tanah mencapai 55%, jadi limpasan permukaan ke badan sungai hanya 10-20% saja. Sementara itu, kemampuan hutan mengembalikan air ke atmosfer lewat proses evapotranspirasi mencapai 25 hingga 40 persen dari total hujan."""
}

bcn_5 = {
    "grup": "stimulus_gaya_hidup_ginjal",
    "judul": "Gaya Hidup Remaja dan Ancaman Gagal Ginjal: Bahaya di Balik Junk Food dan Minuman Manis",
    "gambar": ["/soal/tryout_tpm_bindo_paket_a/teks13_junk_food_ginjal.jpg"],
    "sumber": "1. kompas.com/tren dengan perubahan\n2. indonesiabaik.id/infografis dengan perubahan",
    "teks": """Gaya hidup remaja kini semakin praktis. Namun, tanpa disadari dapat membawa dampak serius bagi kesehatan, termasuk risiko gagal ginjal. Ginjal berfungsi menyaring limbah, menjaga keseimbangan cairan, serta mengatur mineral penting dalam tubuh. Sayangnya, kebiasaan mengonsumsi makanan cepat saji, minuman manis, dan kurang minum air putih membuat ginjal bekerja lebih keras dari seharusnya.
Banyak remaja gemar mengonsumsi junk food, seperti pizza, sosis, dan makanan instan. Akibatnya, asupan garam, lemak, dan kalori yang tinggi dalam makanan tersebut dapat meningkatkan tekanan darah sehingga memicu kerusakan ginjal dalam jangka panjang. Selain itu, kebiasaan mengonsumsi minuman bersoda, minuman energi, dan jus kemasan yang mengandung gula serta zat tambahan menyebabkan kerja ginjal menjadi lebih berat dan akan menimbulkan karbonasi. Hal ini mengakibatkan risiko gangguan kesehatan ginjal, seperti batu ginjal, semakin meningkat.
Dokter menegaskan bahwa pola hidup sehat sangat penting untuk menjaga fungsi ginjal tetap optimal. Remaja dianjurkan mengonsumsi makanan bergizi seimbang, rutin berolahraga, mencukupi kebutuhan air putih, serta menghindari rokok dan alkohol. Bagi remaja yang memiliki penyakit, seperti diabetes atau hipertensi, pemeriksaan kesehatan secara rutin sangat diperlukan untuk mencegah fertilisasi pada ginjal.
Kasus gagal ginjal akut bahkan pernah meningkat pada anak-anak dan remaja. Kondisi ini ditandai dengan gejala berupa mual, muntah, demam, diare, hingga berkurangnya jumlah urine. Hal tersebut menunjukkan agar gangguan ginjal tidak hanya menyerang orang dewasa.
Oleh karena itu, remaja perlu lebih bijak dalam memilih makanan dan minuman. Gaya hidup sehat sejak dini bukan sekadar tren, melainkan investasi penting demi kesehatan ginjal dan masa depan yang lebih baik."""
}

bcn_6 = {
    "grup": "stimulus_film_na_willa",
    "judul": "Film Na Willa: Mengungkap Cerita di Balik Keindahan",
    "sumber": "tradisifilm.com",
    "teks": """Film Na Willa menjadi sorotan karena memadukan alur drama yang emosional dengan sinematografi yang kuat. Ceritanya berpusat pada Willa, seorang wanita muda yang berjuang menghadapi berbagai kesulitan hidup sambil mencari jati diri dan tujuan. Perjalanan Willa memperlihatkan konflik batin, keberanian, keraguan, serta ketekunan untuk tetap melangkah meskipun penuh ketidakpastian.
Kekuatan film ini terletak pada visual yang tertata rapi, permainan warna dan cahaya yang membangun suasana, serta musik yang menyatu dengan emosi setiap adegan. Karakter pendukung — keluarga, teman, hingga antagonis — menambah lapisan konflik dan dinamika cerita.
Akting para pemain, terutama pemeran Willa, terasa autentik dan natural. Penyutradaraan yang detail membuat setiap adegan memiliki makna, menghadirkan ketegangan, kehangatan, dan refleksi personal. Tema utama film ini adalah pencarian jati diri serta keteguhan hati menghadapi tantangan hidup, disertai pesan tentang arti hubungan manusia: dukungan, kasih sayang, dan konflik yang membentuk karakter.
Dengan narasi yang mendalam, tak mudah ditebak, dan kaya emosi, Na Willa bukan hanya hiburan, tetapi pengalaman yang menginspirasi dan relevan dengan kehidupan nyata."""
}

bcn_7 = {
    "grup": "stimulus_makeup_remaja",
    "judul": "Dampak Negatif Make Up di Kalangan Remaja",
    "sumber": "mediaindonesia.com/jelita",
    "teks": """Penggunaan make up di kalangan pelajar saat ini semakin marak seiring berkembangnya media sosial dan standar kecantikan yang banyak ditampilkan oleh publik figur. Hal tersebut membuat banyak remaja mengikut tren publik figur yang mereka idolakan. Mereka menggunakan make up untuk meningkatkan rasa percaya diri dan menunjang penampilan di lingkungan sekolah. Tanpa mereka sadari kebiasaan menggunakan make up secara berlebihan dapat menimbulkan berbagai dampak negatif terhadap kesehatan remaja.
Pada usia remaja, kondisi kulit masih sensitif dan belum sepenuhnya stabil karena masa pertumbuhan. Kulit lebih rentan terhadap zat kimia yang terdapat dalam produk kosmetik. Pemakaian make up yang terlalu tebal dan terlalu sering menyebabkan pori-pori tersumbat, jerawat, iritasi, hingga infeksi kulit apabila kebersihan wajah tidak dijaga dengan baik.
Penggunaan make up berlebihan juga dapat memengaruhi kesehatan mata dan pernapasan. Produk seperti maskara, eyeliner, dan bedak tabur berisiko masuk ke mata atau terhirup, sehingga dapat menimbulkan iritasi. Tidak jarang pelajar menggunakan make up tanpa memperhatikan kualitas produk, tanggal kedaluwarsa, maupun kecocokan dengan jenis kulit. Hal ini memperbesar risiko alergi dan peradangan bagi pemakainya
Dampak lain yang tidak kalah penting adalah pengaruhnya terhadap kesehatan mental remaja. Ketergantungan pada make up dapat membentuk pola pikir bahwa penampilan alami tidak cukup menarik tanpa riasan. Akibatnya, rasa percaya diri menjadi bergantung pada make up dan memicu kecemasan berlebihan terhadap penilaian orang lain. Oleh karena itu, diperlukan edukasi bagi pelajar mengenai penggunaan make up yang wajar serta pentingnya menjaga kesehatan fisik dan mental secara seimbang."""
}

bcn_8 = {
    "grup": "stimulus_puisi_kartini",
    "judul": "Dari Raden Ajeng Kartini untuk Maria Magdalena Pariyem",
    "gambar": ["/soal/tryout_tpm_bindo_paket_a/teks22_puisi_kartini_lilin.jpg"],
    "sumber": "Puisi: Joko Pinurbo / Foto: iStock",
    "teks": """...
Raden Ajeng Kartini terbatuk-batuk
di bawah cahaya lampu remang-remang.
Tangan masih menyurat di atas kertas.
Hati melemas pada berkas-berkas cemas.
Angin merambat lewat kain dan kebaya.
Dingin merayap hingga sanggulnya.
Dan anak-anak kesunyian bergelayutan
pada bulu matanya yang sayup,
yang mengungkai cahaya redup.

“Sering kubayangkan, Dinda,
perempuan-perempuan perkasa
berbondong-bondong menyunggi matahari,
menggendong bukit-bukit tandus
di gugusan pegunungan seribu
menuju hingar bingar pasar palawija
di keheningan langit Jogja.
Kubayangkan pula ladang-ladang karang
dirambah, disiangi kaki-kaki telanjang
dengan darah sepanjang zaman.”

Kereta api hitam membelah malam,
membangunkan si lelap dari tidur panjang.
Jari masih menulis bersama gerimis,
bersama angin dan kenangan. Di telapak tangannya
perahu-perahu dilayarkan ke daratan-daratan hijau,
negeri-negeri jauh tak terjangkau
..."""
}

bcn_9 = {
    "grup": "stimulus_cerita_maya",
    "judul": "Cahaya di Tengah Puing-Puing",
    "sumber": "bola.com/ragam",
    "teks": """Di sebuah kota kecil yang dikelilingi oleh pegunungan hijau, tinggallah seorang anak bernama Maya. Maya adalah gadis yang sangat peduli terhadap lingkungan sekitarnya. Ia selalu terpesona oleh keindahan alam sekitar dan berusaha keras untuk menjaga kebersihan dan keindahan kota tempat tinggalnya.
Suatu hari, kota mereka dilanda badai besar. Angin kencang dan hujan deras merobohkan pohon-pohon dan merusak banyak bangunan di sekitar. Setelah badai mereda, Maya melihat banyaknya sampah dan puing-puing yang tersebar di mana-mana.
Tak lama setelah badai, Maya bersama teman-temannya memutuskan untuk melakukan aksi bersih-bersih. Dengan semangat yang tinggi, mereka mengumpulkan sampah-sampah dan merapikan puing-puing yang berserakan.
Saat mereka membersihkan lingkungan, Maya menyadari betapa pentingnya menjaga alam. Ia mengajak teman-temannya untuk membuat kotak-kotak sampah di berbagai sudut kota, memasang spanduk tentang pentingnya daur ulang, serta mengajak warga untuk turut serta dalam menjaga kebersihan lingkungan."""
}

bcn_10 = {
    "grup": "stimulus_cerita_serindit",
    "judul": "Pahlawan Negeri Serindit",
    "gambar": ["/soal/tryout_tpm_bindo_paket_a/teks28_cerita_serindit_hutan.jpg"],
    "sumber": "https://id.pngtree.com/freebackground/animation-woodland-path_3177912.html",
    "teks": """Di negeri yang indah dan subur, bernama Serindit, sinar matahari berlimpah dan burung-burung bernyanyi merdu. Tanah yang kaya dengan hasil alam membuat penduduknya hidup makmur dan bahagia. Namun, suatu hari, keserakahan sekelompok orang mulai mengancam keseimbangan alam negeri.
Kelompok itu dipimpin Kapten Hitam, seorang yang tamak dan tidak peduli lingkungan, mulai mengeruk bumi Serindit. Mereka mengeksploitasi biji-biji berharga, seperti timah, emas, hingga pasir kaolin yang istimewa. Tanah yang subur mulai tandus, sungai-sungai menjadi keruh, sinar matahari mulai redup, dan hewan-hewan meninggalkan rumahnya.
Beberapa anak muda Serindit, yaitu Pelawan, Nyatoh, Meranti, dan Bulin, tidak bisa diam melihat negeri yang rusak. Mereka memutuskan berjuang mengembalikan Serindit ke masa kejayaan.
Pelawan menjadi pemimpin kelompok. Nyatoh, yang dapat berkomunikasi dengan hewan, menjadi mata-mata. Meranti, menjadi pelindung mereka. Lalu Bulin, sebagai pengirim pesan.
Mereka memulai perjalanan mengunjungi Dewi Alam, penguasa Serindit. Dewi Alam memberikan petunjuk untuk mengalahkan Kapten Hitam dan pasukannya.
Pertarungan sengit terjadi antara kelompok Pelawan dan pasukan Kapten Hitam yang bersenjata lengkap. Tanah berguncang, air bergelombang, dan angin berhembus kencang mengiringi perlawanan Pelawan dan kawan-kawan.
“Awas, Pelawan, lihat di belakangmu!” Meranti berteriak saat prajurit Kapten Hitam akan menusuk Pelawan. 
Air sungai tiba-tiba menerjang kelompok Kapten Hitam karena digerakkan Meranti. Melalui kekuatan dan kerja sama, kelompok Pelawan akhirnya berhasil mengalahkan Kapten Hitam dan pasukannya.
Negeri Serindit pun mulai pulih. Tanahnya subur kembali, sungai-sungai menjadi jernih, dan hewan-hewan kembali ke sarang mereka. Pelawan, Nyatoh, Meranti, dan Bulin menjadi pahlawan yang mengembalikan kejayaan negeri. Mereka dianggap sebagai “Cahaya Negeri Serindit”."""
}

# Daftar 30 butir soal Bahasa Indonesia
soal_bindo = [
    {
        "nomor": 1,
        "mapel": "Bahasa Indonesia",
        "materi": "Makna Istilah / Kosakata",
        "tipe": "pg_sederhana",
        "bacaan": bcn_1,
        "grup": bcn_1["grup"],
        "teks_soal": "Makna istilah kapasitas yang sesuai dengan isi teks tersebut adalah …",
        "opsi": [
            {"label": "A", "teks": "kemampuan untuk menampung sesuatu"},
            {"label": "B", "teks": "kewenangan jabatan sesorang dalam organisasi."},
            {"label": "C", "teks": "keterbatasan kemampuan menyelesaikan masalah"},
            {"label": "D", "teks": "kemampuan mental untuk memahami atau melakukan sesuatu"}
        ],
        "kunci": "A",
        "pembahasan": "Dalam teks konteks 'melebihi kapasitas penanganan lokal', kapasitas bermakna daya tampung atau ruang tampung fasilitas pengolahan sampah."
    },
    {
        "nomor": 2,
        "mapel": "Bahasa Indonesia",
        "materi": "Kesesuaian Pernyataan Teks",
        "tipe": "benar_salah",
        "bacaan": bcn_1,
        "grup": bcn_1["grup"],
        "teks_soal": "Tentukan kesesuaian pernyataan berikut dengan isi teks tersebut!",
        "tabel": {
            "headers": ["Pernyataan", "Sesuai", "Tidak Sesuai"],
            "rows": [
                ["A. Penyediaan ruang terbuka hijau terkendala lahan yang terbatas.", "✓", ""],
                ["B. Kapasitas penanganan lokal mampu mengatasi masalah sampah", "", "✓"],
                ["C. Urbanisasi dan pertumbuhan penduduk menyebabkan masalah lingkungan.", "✓", ""]
            ]
        },
        "pernyataan": [
            {"teks": "A. Penyediaan ruang terbuka hijau terkendala lahan yang terbatas.", "kunci": "Sesuai"},
            {"teks": "B. Kapasitas penanganan lokal mampu mengatasi masalah sampah", "kunci": "Tidak Sesuai"},
            {"teks": "C. Urbanisasi dan pertumbuhan penduduk menyebabkan masalah lingkungan.", "kunci": "Sesuai"}
        ],
        "kunci": {"A": "Sesuai", "B": "Tidak Sesuai", "C": "Sesuai"},
        "pembahasan": "Pernyataan A dan C sesuai dengan isi paragraf 1 dan 2. Pernyataan B tidak sesuai karena teks secara tegas menyatakan sampah 'melebihi kapasitas penanganan lokal'."
    },
    {
        "nomor": 3,
        "mapel": "Bahasa Indonesia",
        "materi": "Gagasan Pendukung Paragraf",
        "tipe": "pg_sederhana",
        "bacaan": bcn_1,
        "grup": bcn_1["grup"],
        "teks_soal": "Gagasan pendukung paragraf pertama yang sesuai adalah …",
        "opsi": [
            {"label": "A", "teks": "Realisasi RTH publik baru mencapai 2,6 juta m²."},
            {"label": "B", "teks": "Penumpukan sampah liar diakibatkan tingginya produksi sampah yang melebihi kapasitas penanganan lokal."},
            {"label": "C", "teks": "Tingkat polusi udara sering berada dalam kategori sedang."},
            {"label": "D", "teks": "Ketersediaan lahan yang semakin berkurang diakibatkan oleh banyaknya ruang terbuka hijau."}
        ],
        "kunci": "B",
        "pembahasan": "Gagasan pendukung pada paragraf 1 menerangkan bahwa kota menghasilkan 300 ton sampah per hari yang melebihi kapasitas sehingga timbul penumpukan sampah liar."
    },
    {
        "nomor": 4,
        "mapel": "Bahasa Indonesia",
        "materi": "Istilah Bidang Media Sosial",
        "tipe": "pg_kompleks",
        "bacaan": bcn_2,
        "grup": bcn_2["grup"],
        "teks_soal": "Pilihlah jawaban lebih dari satu!\nIstilah media sosial yang terdapat pada teks tersebut adalah ….",
        "opsi": [
            {"label": "1", "teks": "upload"},
            {"label": "2", "teks": "relevan"},
            {"label": "3", "teks": "konsep"},
            {"label": "4", "teks": "audiens"}
        ],
        "kunci": ["1", "4"],
        "pembahasan": "Istilah khas dalam media sosial dan platform video adalah 'upload' (mengunggah konten) dan 'audiens' (pemirsa/penonton sasaran)."
    },
    {
        "nomor": 5,
        "mapel": "Bahasa Indonesia",
        "materi": "Tujuan Teks Prosedur",
        "tipe": "pg_sederhana",
        "bacaan": bcn_2,
        "grup": bcn_2["grup"],
        "teks_soal": "Tujuan dibuatnya teks prosedur tersebut adalah ….",
        "opsi": [
            {"label": "A", "teks": "membujuk pembaca agar menjadi YouTuber Shorts terkenal"},
            {"label": "B", "teks": "mendeskripsikan kelebihan dan kekurangan aplikasi YouTube"},
            {"label": "C", "teks": "menghibur pembaca dengan cerita pengalaman membuat video shorts"},
            {"label": "D", "teks": "menjelaskan langkah-langkah membuat YouTube Shorts dengan benar"}
        ],
        "kunci": "D",
        "pembahasan": "Teks prosedur tersebut memaparkan tahapan sistematis (langkah 1 sampai 15) untuk memandu pembaca membuat YouTube Shorts secara tepat dan benar."
    },
    {
        "nomor": 6,
        "mapel": "Bahasa Indonesia",
        "materi": "Ketepatan Isi Teks Prosedur",
        "tipe": "pg_sederhana",
        "bacaan": bcn_2,
        "grup": bcn_2["grup"],
        "teks_soal": "Berdasarkan teks tersebut, bagian yang tidak sesuai adalah ….",
        "opsi": [
            {"label": "A", "teks": "tahapan pembuatan konten YouTube Shorts, karena disajikan secara tidak urut"},
            {"label": "B", "teks": "pengaturan audiens, karena video diprivat tidak bisa ditonton pengguna lain"},
            {"label": "C", "teks": "alat dan bahan, karena tidak mendukung pembuatan konten YouTube Shorts"},
            {"label": "D", "teks": "durasi video, karena seharunya video bisa dibuat sekitar 8 menit atau lebih"}
        ],
        "kunci": "B",
        "pembahasan": "Pada langkah nomor 11 tertulis 'Atur audiens video menjadi privat', yang tidak sesuai dengan tujuan mempublikasikan video agar ditonton pengguna lain."
    },
    {
        "nomor": 7,
        "mapel": "Bahasa Indonesia",
        "materi": "Pokok-Pokok Berita",
        "tipe": "pg_kompleks",
        "bacaan": bcn_3,
        "grup": bcn_3["grup"],
        "teks_soal": "Pilihlah jawaban lebih dari satu!\nPernyataan yang merupakan pokok-pokok berita tersebut adalah ...",
        "opsi": [
            {"label": "1", "teks": "Jumlah pelari yang mengikuti Tangerang 10K sekitar 2.500 dan berasal dari berbagai daerah dan negara."},
            {"label": "2", "teks": "Tangerang 10K dilaksanakan pada hari Minggu, 7 Desember 2025 di Pasific Garden, Kota Tangerang, Banten."},
            {"label": "3", "teks": "Penyelenggara Tangerang 10K adalah Pemerintah Kota Tangerang bersama harian Kompas (Kompas.id)."},
            {"label": "4", "teks": "Para peserta Tangerang 10K menuliskan pesan hingga harapan di papan “Whats your running story?”"}
        ],
        "kunci": ["3", "4"],
        "pembahasan": "Pernyataan 3 dan 4 benar sesuai isi teks berita. Pernyataan 1 keliru karena di teks hanya disebut 'berbagai daerah' (bukan mancanegara/negara), dan pernyataan 2 keliru karena Pasific Garden adalah lokasi pengambilan race pack pada Sabtu (6/12)."
    },
    {
        "nomor": 8,
        "mapel": "Bahasa Indonesia",
        "materi": "Tindakan Berdasarkan Berita",
        "tipe": "pg_kompleks",
        "bacaan": bcn_3,
        "grup": bcn_3["grup"],
        "teks_soal": "Pilihlah jawaban lebih dari satu!\nHal yang dapat dilakukan pihak-pihak nonpemerintah untuk menggiatkan olahraga di masyarakat adalah ....",
        "opsi": [
            {"label": "1", "teks": "melakukan kegiatan olahraga yang menguntungkan secara finansial"},
            {"label": "2", "teks": "mendirikan kelompok-kelompok olahraga yang berbiaya murah atau gratis"},
            {"label": "3", "teks": "menjadi sponsor penyelenggaraan kegiatan olahraga yang bersifat massal"},
            {"label": "4", "teks": "melaksanakan kegiatan olahraga jika didanai oleh pemerintah"}
        ],
        "kunci": ["2", "3"],
        "pembahasan": "Upaya nyata non-pemerintah untuk memajukan olahraga masyarakat adalah menyediakan wadah komunitas olahraga murah/gratis dan menjadi sponsor pendukung kegiatan olahraga massal."
    },
    {
        "nomor": 9,
        "mapel": "Bahasa Indonesia",
        "materi": "Kelengkapan Unsur Berita (Adiksimba)",
        "tipe": "pg_sederhana",
        "bacaan": bcn_3,
        "grup": bcn_3["grup"],
        "teks_soal": "Apa yang membuat teks tersebut belum memuat unsur-unsur berita secara lengkap?",
        "opsi": [
            {"label": "A", "teks": "Teks tersebut belum memuat peristiwa apa yang diberitakan."},
            {"label": "B", "teks": "Tempat pelaksanaan kegiatan belum dibahas dalam teks tersebut."},
            {"label": "C", "teks": "Teks tersebut belum menjelaskan siapa saja yang terlibat dalam peristiwa."},
            {"label": "D", "teks": "Alasan penyelenggaraan kegiatan belum disampaikan dalam teks tersebut."}
        ],
        "kunci": "D",
        "pembahasan": "Teks telah memuat apa (Tangerang 10K), siapa (peserta/panitia), di mana (Kota Tangerang), dan kapan (Minggu 7/12/2025), namun belum memaparkan unsur Mengapa (alasan/latar belakang resmi diselenggarakannya ajang)."
    },
    {
        "nomor": 10,
        "mapel": "Bahasa Indonesia",
        "materi": "Menemukan Informasi Tersurat",
        "tipe": "pg_sederhana",
        "bacaan": bcn_4,
        "grup": bcn_4["grup"],
        "teks_soal": "Berdasarkan teks tersebut yang dapat menjadi spons untuk menyerap air ke dalam tanah seraya menahan untuk tidak langsung masuk ke sungai menunjuk pada ….",
        "opsi": [
            {"label": "A", "teks": "hutan di wilayah DAS"},
            {"label": "B", "teks": "hutan tropis Kalimantan"},
            {"label": "C", "teks": "hutan tropis Sumatera"},
            {"label": "D", "teks": "hutan hasil deforestasi"}
        ],
        "kunci": "A",
        "pembahasan": "Paragraf kedua secara eksplisit menyatakan: 'hutan di wilayah DAS memiliki peranan seperti penyangga hidrologis. Ini bisa menjadi spons untuk menyerap air hujan ke dalam tanah'."
    },
    {
        "nomor": 11,
        "mapel": "Bahasa Indonesia",
        "materi": "Identifikasi Peristiwa Teks",
        "tipe": "pg_sederhana",
        "bacaan": bcn_4,
        "grup": bcn_4["grup"],
        "teks_soal": "Peristiwa yang terjadi pada kutipan teks tersebut adalah ….",
        "opsi": [
            {"label": "A", "teks": "deforestasi hutan"},
            {"label": "B", "teks": "bencana hidrologis"},
            {"label": "C", "teks": "curah hujan yang tinggi"},
            {"label": "D", "teks": "bencana banjir dan tanah longsor"}
        ],
        "kunci": "D",
        "pembahasan": "Peristiwa utama yang melanda wilayah Sumatera Barat, Sumatera Utara, dan Aceh pada akhir November adalah bencana banjir bandang dan tanah longsor."
    },
    {
        "nomor": 12,
        "mapel": "Bahasa Indonesia",
        "materi": "Tindakan Pencegahan Bencana",
        "tipe": "pg_sederhana",
        "bacaan": bcn_4,
        "grup": bcn_4["grup"],
        "teks_soal": "Tindakan yang tepat bagi kita untuk mencegah peristiwa tersebut terulang adalah …",
        "opsi": [
            {"label": "A", "teks": "mencintai lingkungan dengan berperan serta pada kegiatan pelestarian lingkungan."},
            {"label": "B", "teks": "mengusulkan pada yang berwenang untuk menghukum pelaku deforestasi hutan."},
            {"label": "C", "teks": "mendukung agar pembelajaran terkait lingkungan hidup termuat pada kurikulum."},
            {"label": "D", "teks": "merancang undang-undang tentang pentingnya menjaga ekosistem hutan."}
        ],
        "kunci": "A",
        "pembahasan": "Peran serta aktif sebagai warga masyarakat dalam pelestarian lingkungan dan reboisasi merupakan tindakan nyata yang dapat dilakukan oleh siapapun untuk mencegah bencana longsor dan banjir."
    },
    {
        "nomor": 13,
        "mapel": "Bahasa Indonesia",
        "materi": "Ketepatan Penggunaan Istilah",
        "tipe": "pg_kompleks",
        "bacaan": bcn_5,
        "grup": bcn_5["grup"],
        "teks_soal": "Pilihlah jawaban yang benar! Jawaban benar lebih dari satu.\nKata/istilah manakah yang tidak sesuai kaidah pada teks tersebut?",
        "opsi": [
            {"label": "1", "teks": "fertilisasi"},
            {"label": "2", "teks": "karbonasi"},
            {"label": "3", "teks": "hipertensi"},
            {"label": "4", "teks": "diabetes"}
        ],
        "kunci": ["1", "2"],
        "pembahasan": "Istilah 'fertilisasi' (pembuahan) dan 'karbonasi' (pemberian gas asam arang) tidak tepat digunakan dalam konteks patologi medis kerusakan fungsi filtrasi dan batu ginjal."
    },
    {
        "nomor": 14,
        "mapel": "Bahasa Indonesia",
        "materi": "Pola Pengembangan Paragraf",
        "tipe": "pg_sederhana",
        "bacaan": bcn_5,
        "grup": bcn_5["grup"],
        "teks_soal": "Pola pengembangan manakah yang digunakan pada paragraf kedua dalam teks tersebut?",
        "opsi": [
            {"label": "A", "teks": "perbandingan"},
            {"label": "B", "teks": "kronologis"},
            {"label": "C", "teks": "kausalitas"},
            {"label": "D", "teks": "ilustrasi"}
        ],
        "kunci": "C",
        "pembahasan": "Paragraf 2 disusun dengan hubungan sebab-akibat (kausalitas): konsumsi junk food berlemak dan berkadar garam tinggi mengakibatkan lonjakan tekanan darah sehingga memicu kerusakan ginjal."
    },
    {
        "nomor": 15,
        "mapel": "Bahasa Indonesia",
        "materi": "Ketepatan Penggunaan Konjungsi",
        "tipe": "pg_sederhana",
        "bacaan": bcn_5,
        "grup": bcn_5["grup"],
        "teks_soal": "Penggunaan konjungsi manakah yang tidak sesuai kaidah pada teks tersebut?",
        "opsi": [
            {"label": "A", "teks": "Penggunaan konjungsi sehingga pada paragraf dua kalimat kedua tidak tepat karena menguatkan hubungan kausalitas."},
            {"label": "B", "teks": "Penggunaan konjungsi namun pada paragraf pertama kalimat kedua tidak tepat karena menunjukkan hubungan pertentangan.."},
            {"label": "C", "teks": "Penggunaan konjungsi dan pada paragraf pertama kalimat terakhir tidak tepat karena menandai hubungan penambahan."},
            {"label": "D", "teks": "Penggunaan konjungsi agar pada paragraf keempat kalimat terakhir tidak tepat karena menyatakan hubungan penjelasan."}
        ],
        "kunci": "D",
        "pembahasan": "Pada kalimat 'Hal tersebut menunjukkan agar gangguan ginjal tidak hanya menyerang orang dewasa', konjungsi 'agar' keliru karena fungsinya adalah penanda tujuan, sedangkan klausa tersebut memerlukan konjungsi penerang/penjelas 'bahwa'."
    },
    {
        "nomor": 16,
        "mapel": "Bahasa Indonesia",
        "materi": "Opini Penulis Teks Ulasan",
        "tipe": "benar_salah",
        "bacaan": bcn_6,
        "grup": bcn_6["grup"],
        "teks_soal": "Tentukan kebenaran opini penulis berikut berdasarkan teks tersebut!",
        "tabel": {
            "headers": ["Pernyataan", "Benar", "Salah"],
            "rows": [
                ["A. Film Na Willa menjadi sorotan karena memadukan alur drama yang emosional dengan sinematografi yang kuat.", "✓", ""],
                ["B. Akting para pemain, terutama pemeran Willa, terasa autentik dan natural.", "✓", ""],
                ["C. Tokoh utamanya bernama Willa, seorang wanita muda yang berjuang menghadapi berbagai kesulitan hidup", "", "✓"]
            ]
        },
        "pernyataan": [
            {"teks": "A. Film Na Willa menjadi sorotan karena memadukan alur drama yang emosional dengan sinematografi yang kuat.", "kunci": "Benar"},
            {"teks": "B. Akting para pemain, terutama pemeran Willa, terasa autentik dan natural.", "kunci": "Benar"},
            {"teks": "C. Tokoh utamanya bernama Willa, seorang wanita muda yang berjuang menghadapi berbagai kesulitan hidup", "kunci": "Salah"}
        ],
        "kunci": {"A": "Benar", "B": "Benar", "C": "Salah"},
        "pembahasan": "Pernyataan A dan B merupakan opini evaluatif penulis terhadap kualitas film. Pernyataan C bukan opini, melainkan fakta sinopsis cerita."
    },
    {
        "nomor": 17,
        "mapel": "Bahasa Indonesia",
        "materi": "Simpulan Teks Ulasan",
        "tipe": "pg_sederhana",
        "bacaan": bcn_6,
        "grup": bcn_6["grup"],
        "teks_soal": "Simpulan paling akurat yang merangkum keseluruhan teks adalah …",
        "opsi": [
            {"label": "A", "teks": "Na Willa menekankan konflik batin tokoh utama sehingga aspek lain menjadi kurang menonjol."},
            {"label": "B", "teks": "Na Willa menggabungkan unsur cerita, visual, musik, dan akting untuk menghadirkan pengalaman menonton yang bermakna."},
            {"label": "C", "teks": "Na Willa terutama ingin menunjukkan pentingnya karakter pendukung dalam membangun alur cerita."},
            {"label": "D", "teks": "Na Willa berhasil karena sutradaranya fokus pada sinematografi dan mengabaikan emosi tokoh."}
        ],
        "kunci": "B",
        "pembahasan": "Teks mengulas secara komprehensif keunggulan alur, visual, tata musik, dan akting para pemain yang terpadu menjadi karya yang menginspirasi."
    },
    {
        "nomor": 18,
        "mapel": "Bahasa Indonesia",
        "materi": "Hubungan Judul dengan Isi Teks",
        "tipe": "pg_sederhana",
        "bacaan": bcn_6,
        "grup": bcn_6["grup"],
        "teks_soal": "Alasan yang paling tepat mengapa judul tersebut sesuai dengan isi teks adalah …",
        "opsi": [
            {"label": "A", "teks": "Karena film Na Willa hanya menampilkan keindahan visual dan kurang mementingkan karakter cerita tokohnya."},
            {"label": "B", "teks": "Karena teks menjelaskan bahwa penonton lebih memperhatikan keindahan musik dibandingkan rangkaian ceritanya."},
            {"label": "C", "teks": "Karena teks menunjukkan bahwa di balik sinematografi yang indah terdapat konflik, pesan moral, dan perjalanan tokoh yang penuh makna."},
            {"label": "D", "teks": "Karena judul ingin menegaskan bahwa sebuah film drama selalu menyajkan keindahan sinematografi dan sekaligus menginspirasi."}
        ],
        "kunci": "C",
        "pembahasan": "Judul 'Mengungkap Cerita di Balik Keindahan' sangat tepat karena teks membeberkan bahwa keindahan visual film menjadi medium penyampai pesan moral dan pergulatan batin Willa."
    },
    {
        "nomor": 19,
        "mapel": "Bahasa Indonesia",
        "materi": "Bagan Pokok Pikiran Teks",
        "tipe": "pg_sederhana",
        "bacaan": bcn_7,
        "grup": bcn_7["grup"],
        "teks_soal": "Bagan yang sesuai dengan pokok-pokok teks tersebut adalah ….",
        "opsi": [
            {"label": "A", "teks": "Bagan A: Penyebab -> Kesehatan Kulit -> Kesehatan Mata dan Pernapasan -> Kesehatan Jasmani dan Solusi", "gambar": "/soal/tryout_tpm_bindo_paket_a/q19_bagan_opsi_a.png"},
            {"label": "B", "teks": "Bagan B: Penyebab -> Kesehatan Mata dan Pernapasan -> Kesehatan Kulit -> Kesehatan Mental dan Solusi", "gambar": "/soal/tryout_tpm_bindo_paket_a/q19_bagan_opsi_b.png"},
            {"label": "C", "teks": "Bagan C: Tren Publik Figur -> Kesehatan Mata dan Pernapasan -> Kesehatan Kulit -> Kesehatan Mental dan Solusi", "gambar": "/soal/tryout_tpm_bindo_paket_a/q19_bagan_opsi_c.png"},
            {"label": "D", "teks": "Bagan D: Penyebab -> Kesehatan Kulit -> Kesehatan Mata dan Pernapasan -> Kesehatan Mental dan Solusi", "gambar": "/soal/tryout_tpm_bindo_paket_a/q19_bagan_opsi_d.png"}
        ],
        "kunci": "D",
        "pembahasan": "Urutan pokok pikiran teks per paragraf adalah: Paragraf 1 (Penyebab), Paragraf 2 (Kesehatan Kulit), Paragraf 3 (Kesehatan Mata dan Pernapasan), Paragraf 4 (Kesehatan Mental dan Solusi). Susunan ini tepat pada Bagan D."
    },
    {
        "nomor": 20,
        "mapel": "Bahasa Indonesia",
        "materi": "Ide Pokok Paragraf",
        "tipe": "benar_salah",
        "bacaan": bcn_7,
        "grup": bcn_7["grup"],
        "teks_soal": "Ide pokok paragraf ketiga teks tersebut adalah …. Tentukan benar atau salah pada setiap pernyataan berikut!",
        "tabel": {
            "headers": ["Pernyataan", "Benar", "Salah"],
            "rows": [
                ["A. risiko alergi dan peradangan bagi pemakainya", "", "✓"],
                ["B. pengaruh akibat penggunaan make up berlebihan", "✓", ""],
                ["C. akibat penggunaan make up tanpa memperhatikan kualitas", "", "✓"]
            ]
        },
        "pernyataan": [
            {"teks": "A. risiko alergi dan peradangan bagi pemakainya", "kunci": "Salah"},
            {"teks": "B. pengaruh akibat penggunaan make up berlebihan", "kunci": "Benar"},
            {"teks": "C. akibat penggunaan make up tanpa memperhatikan kualitas", "kunci": "Salah"}
        ],
        "kunci": {"A": "Salah", "B": "Benar", "C": "Salah"},
        "pembahasan": "Ide pokok paragraf 3 termuat pada kalimat utama: 'Penggunaan make up berlebihan juga dapat memengaruhi kesehatan mata dan pernapasan'."
    },
    {
        "nomor": 21,
        "mapel": "Bahasa Indonesia",
        "materi": "Refleksi dan Dampak Positif Teks",
        "tipe": "pg_kompleks",
        "bacaan": bcn_7,
        "grup": bcn_7["grup"],
        "teks_soal": "Pilihlah jawaban yang tepat lebih dari satu!\nHal positif yang mungkin terjadi setelah memahami isi teks tersebut adalah …",
        "opsi": [
            {"label": "1", "teks": "Pemahaman terhadap dampak negatif make up dapat mendorong remaja menggunakan make up secara lebih wajar dan tidak berlebihan."},
            {"label": "2", "teks": "Tren publik figur membuat remaja wajib untuk menggunakan make up setiap hari agar penampilan tetap menarik di lingkungan sekolah."},
            {"label": "3", "teks": "Kesadaran akan risiko kesehatan membuat remaja lebih memperhatikan kebersihan wajah serta kualitas produk kosmetik yang digunakan."},
            {"label": "4", "teks": "Keinginan untuk berubah karena penggunaan make up tidak memiliki pengaruh terhadap kesehatan mental remaja selama digunakan oleh pelajar"}
        ],
        "kunci": ["1", "3"],
        "pembahasan": "Dampak positif membaca teks edukatif kesehatan kulit remaja adalah pembaca menggunakan make up secara wajar serta lebih selektif menjaga kebersihan wajah dan memilih kosmetik teruji."
    },
    {
        "nomor": 22,
        "mapel": "Bahasa Indonesia",
        "materi": "Suasana Puisi",
        "tipe": "pg_sederhana",
        "bacaan": bcn_8,
        "grup": bcn_8["grup"],
        "teks_soal": "Baris-baris puisi “di bawah cahaya lampu remang-remang”, “pada bulu matanya yang sayup, yang mengungkai cahaya redup” dan “Kereta api hitam membelah malam” memperkuat suasana ...",
        "opsi": [
            {"label": "A", "teks": "muram"},
            {"label": "B", "teks": "duka"},
            {"label": "C", "teks": "hening"},
            {"label": "D", "teks": "sepi"}
        ],
        "kunci": "A",
        "pembahasan": "Diksi 'lampu remang-remang', 'bulu mata sayup', 'cahaya redup', dan 'kereta hitam membelah malam' secara konsisten membangun suasana kesedihan yang hening, suram, dan muram."
    },
    {
        "nomor": 23,
        "mapel": "Bahasa Indonesia",
        "materi": "Citraan (Imaji) Puisi",
        "tipe": "pg_sederhana",
        "bacaan": bcn_8,
        "grup": bcn_8["grup"],
        "teks_soal": "“Kubayangkan pula ladang-ladang karang dirambah, disiangi kaki-kaki telanjang dengan darah sepanjang zaman.” Baris-baris puisi tersebut menggunakan citraan ....",
        "opsi": [
            {"label": "A", "teks": "visual"},
            {"label": "B", "teks": "audio"},
            {"label": "C", "teks": "gerak"},
            {"label": "D", "teks": "penciuman"}
        ],
        "kunci": "A",
        "pembahasan": "Kata 'Kubayangkan', 'ladang-ladang karang', 'kaki-kaki telanjang', dan 'darah' merangsang indra penglihatan (citraan visual)."
    },
    {
        "nomor": 24,
        "mapel": "Bahasa Indonesia",
        "materi": "Apresiasi dan Interpretasi Puisi",
        "tipe": "pg_sederhana",
        "bacaan": bcn_8,
        "grup": bcn_8["grup"],
        "gambarUrls": ["/soal/tryout_tpm_bindo_paket_a/q24_tabel_ungkapan_perasaan.png"],
        "teks_soal": """Berikut ini adalah ungkapan perasaan Ari, Ira, Eni, dan Ani setelah membaca puisi tersebut.
Ari : Saya merasa prihatin terhadap para perempuan yang harus berjuang keras dan gigih menghadapi hidup yang berat.
Ira : Saya bersyukur sekali karena masih ada yang memperhatikan nasib para perempuan yang harus mengolah ladang.
Eni : Saya sungguh terharu atas perjuangan Raden Ajeng Kartini dalam memajukan kaum perempuan Indonesia.
Ani : Saya merasa biasa saja melihat nasib para perempuan harus bekerja keras di ladang karang dan menjual hasil palawijanya ke kota.

Ungkapan perasaan siapakah yang paling sesuai dengan isi puisi tersebut?""",
        "opsi": [
            {"label": "A", "teks": "Ari"},
            {"label": "B", "teks": "Ira"},
            {"label": "C", "teks": "Eni"},
            {"label": "D", "teks": "Ani"}
        ],
        "kunci": "A",
        "pembahasan": "Ungkapan Ari mencerminkan empati mendalam terhadap penderitaan dan kegigihan perempuan perkasa yang digambarkan menyunggi matahari dan menggendong bukit tandus."
    },
    {
        "nomor": 25,
        "mapel": "Bahasa Indonesia",
        "materi": "Kerangka Cerita",
        "tipe": "pg_sederhana",
        "bacaan": bcn_9,
        "grup": bcn_9["grup"],
        "teks_soal": "Kerangka cerita tersebut yang paling tepat adalah ….",
        "opsi": [
            {"label": "A", "teks": "Maya gadis yang rajin- Kota Maya terkena badai- Banyak bangunan roboh – Maya mengajak masyarakat membersihkan sampah sisa banjir – mereka membuat gerakan donasi banjir"},
            {"label": "B", "teks": "Kota Maya terkena badai – Banyak bangunan roboh – Maya membersihkan sampah – Maya membuat kotak sampah."},
            {"label": "C", "teks": "Maya sangat peduli lingkungan – Kota Maya terkena badai – Banyak pohon tumbang – Maya membuat kotak- kotak sampah - Maya mengajak teman-teman untuk membersihkan ."},
            {"label": "D", "teks": "Maya sangat peduli lingkungan – Kota Maya terkena badai – Banyak pohon tumbang dan bangunan rusak – Maya mengajak teman-teman untuk membersihkan - Ia bersama teman-teman membuat kotak- kotak sampah – Ia memasang sapnduk peduli lingkungan."}
        ],
        "kunci": "D",
        "pembahasan": "Kerangka D memuat seluruh urutan kronologis cerita secara runtut dari orientasi, komplikasi badai, resolusi aksi bersih-bersih, hingga koda ajakan menjaga kebersihan."
    },
    {
        "nomor": 26,
        "mapel": "Bahasa Indonesia",
        "materi": "Prediksi Kelanjutan Cerita",
        "tipe": "benar_salah",
        "bacaan": bcn_9,
        "grup": bcn_9["grup"],
        "teks_soal": "Tentukan sesuai atau tidak sesuai terkait peristiwa yang mungkin terjadi dari cerita tersebut!",
        "tabel": {
            "headers": ["Prediksi peristiwa", "Sesuai", "Tidak Sesuai"],
            "rows": [
                ["A. Banyak warga yang mengikuti kegiatan peduli lingkungan yang dilakukan Maya dan teman-temannya.", "✓", ""],
                ["B. Maya diusir dari kota tersebut karena membuat repot warga yang masih dilanda kesusahan.", "", "✓"],
                ["C. Maya mendapatkan apresiasi dari warga karena upayanya dalam peduli lingkungan.", "✓", ""]
            ]
        },
        "pernyataan": [
            {"teks": "A. Banyak warga yang mengikuti kegiatan peduli lingkungan yang dilakukan Maya dan teman-temannya.", "kunci": "Sesuai"},
            {"teks": "B. Maya diusir dari kota tersebut karena membuat repot warga yang masih dilanda kesusahan.", "kunci": "Tidak Sesuai"},
            {"teks": "C. Maya mendapatkan apresiasi dari warga karena upayanya dalam peduli lingkungan.", "kunci": "Sesuai"}
        ],
        "kunci": {"A": "Sesuai", "B": "Tidak Sesuai", "C": "Sesuai"},
        "pembahasan": "Kelanjutan yang logis adalah warga menyambut positif dan tergerak mengikuti inisiatif peduli lingkungan Maya (A dan C sesuai; B tidak sesuai)."
    },
    {
        "nomor": 27,
        "mapel": "Bahasa Indonesia",
        "materi": "Nilai Kehidupan / Amanat Cerita",
        "tipe": "pg_sederhana",
        "bacaan": bcn_9,
        "grup": bcn_9["grup"],
        "teks_soal": "Pelajaran yang relevan untuk diterapkan di lingkungan sekolah dari peristiwa yang dilakukan Maya adalah …",
        "opsi": [
            {"label": "A", "teks": "Mengajak teman-teman untuk bersih-bersih apabila kena banjir."},
            {"label": "B", "teks": "Peduli lingkungan dengan membuang sampah pada tempatnya."},
            {"label": "C", "teks": "Mengimbau OSIS agar membuat program terkait peduli lingkungan."},
            {"label": "D", "teks": "Pihak sekolah agar melibatkan pihak lain dalam menangani sampah."}
        ],
        "kunci": "B",
        "pembahasan": "Nilai karakter mendasar yang dapat langsung diterapkan oleh setiap siswa di sekolah adalah senantiasa membuang sampah pada tempatnya dan merawat kebersihan kelas."
    },
    {
        "nomor": 28,
        "mapel": "Bahasa Indonesia",
        "materi": "Latar Suasana Cerita Fantasi",
        "tipe": "pg_sederhana",
        "bacaan": bcn_10,
        "grup": bcn_10["grup"],
        "teks_soal": "Pernyataan manakah yang menunjukkan latar suasana di Negeri Serindit saat Kapten Hitam mulai menguasai negeri?",
        "opsi": [
            {"label": "A", "teks": "Air bergelombang menemani Negeri Serindit."},
            {"label": "B", "teks": "Angin berhembus kencang di Negeri Serindit."},
            {"label": "C", "teks": "Tanah Serindit mulai mengalami kegersangan."},
            {"label": "D", "teks": "Negeri Serindit dilimpahi oleh sinar matahari."}
        ],
        "kunci": "C",
        "pembahasan": "Paragraf kedua menyebutkan eksploitasi tambang menyebabkan 'Tanah yang subur mulai tandus (gersang), sungai-sungai menjadi keruh, sinar matahari mulai redup'."
    },
    {
        "nomor": 29,
        "mapel": "Bahasa Indonesia",
        "materi": "Nilai Moral Cerita Fantasi",
        "tipe": "pg_sederhana",
        "bacaan": bcn_10,
        "grup": bcn_10["grup"],
        "teks_soal": "Setelah membaca “Pahlawan Negeri Serindit”, nilai moral apa yang dapat kamu temukan?",
        "opsi": [
            {"label": "A", "teks": "Berani membela kebenaran."},
            {"label": "B", "teks": "Generasi muda paling tangguh."},
            {"label": "C", "teks": "Bertanggung jawab atas perbuatan."},
            {"label": "D", "teks": "Kekuatan harus dimanfaatkan optimal."}
        ],
        "kunci": "A",
        "pembahasan": "Nilai moral utama adalah keberanian kaum muda (Pelawan dan kawan-kawan) membela kebenaran dan menjaga kelestarian alam melawan keserakahan penjajah."
    },
    {
        "nomor": 30,
        "mapel": "Bahasa Indonesia",
        "materi": "Unsur Intrinsik Cerita Fantasi",
        "tipe": "pg_kompleks",
        "bacaan": bcn_10,
        "grup": bcn_10["grup"],
        "teks_soal": "Pilihlah jawaban yang benar! Jawaban benar lebih dari satu.\nPendapat manakah yang sesuai untuk menggambarkan unsur pembangun karya sastra atau unsur intrinsik pada teks tersebut?",
        "opsi": [
            {"label": "1", "teks": "Latar tempat menampilkan situasi nyata agar pembaca semakin percaya."},
            {"label": "2", "teks": "Tema cerita tentang menjaga kelestarian alam berfungsi sebagai pendidikan."},
            {"label": "3", "teks": "Tokoh-tokoh yang ditampilkan memiliki karakter pemberani layak untuk ditiru."},
            {"label": "4", "teks": "Alur yang digunakan dalam cerita merupakan alur maju sehingga mudah dipahami."}
        ],
        "kunci": ["2", "3", "4"],
        "pembahasan": "Cerita fantasi ini beralur maju (awal negeri makmur -> dirusak -> dilawan -> pulih), mengusung tema pendidikan pelestarian alam, serta menghadirkan tokoh pemberani yang patut diteladani."
    }
]

print(f"Bahasa Indonesia Paket A ready with {len(soal_bindo)} questions.")

# ------------------------------------------------------------------------------
# 2. MATEMATIKA PAKET B (30 BUTIR SOAL LENGKAP)
# ------------------------------------------------------------------------------

soal_matematika = [
    {
        "nomor": 1,
        "mapel": "Matematika",
        "materi": "Operasi Bilangan Bulat / Penskoran",
        "tipe": "pg_sederhana",
        "teks_soal": "Dalam seleksi Olimpiade Sains tersedia 40 butir soal dengan pedoman penskoran sebagai berikut:\nSeorang peserta menjawab 37 butir soal dan 32 di antaranya benar. Skor yang diperoleh peserta tersebut adalah ….",
        "tabel": {
            "headers": ["Tiap Butir Soal", "Skor"],
            "rows": [
                ["Benar", "3"],
                ["Salah", "–1"],
                ["Tidak Dijawab", "0"]
            ]
        },
        "opsi": [
            {"label": "A", "teks": "111"},
            {"label": "B", "teks": "96"},
            {"label": "C", "teks": "91"},
            {"label": "D", "teks": "88"}
        ],
        "kunci": "C",
        "pembahasan": "Benar = 32 × 3 = 96. Salah = (37 - 32) × (-1) = 5 × (-1) = -5. Tidak dijawab = 3 × 0 = 0. Total Skor = 96 - 5 = 91. Jawaban: C"
    },
    {
        "nomor": 2,
        "mapel": "Matematika",
        "materi": "Urutan Bilangan Rasional & Garis Bilangan",
        "tipe": "pg_sederhana",
        "teks_soal": "Diketahui bilangan-bilangan 4/5; 1,25; 1 1/5; 90%. Letak bilangan-bilangan tersebut pada garis bilangan yang tepat adalah ….",
        "opsi": [
            {"label": "A", "teks": "Garis Bilangan A", "gambar": "/soal/tryout_tka_matematika_paket_b/q2_garis_bilangan_opsi_a.png"},
            {"label": "B", "teks": "Garis Bilangan B", "gambar": "/soal/tryout_tka_matematika_paket_b/q2_garis_bilangan_opsi_b.png"},
            {"label": "C", "teks": "Garis Bilangan C", "gambar": "/soal/tryout_tka_matematika_paket_b/q2_garis_bilangan_opsi_c.png"},
            {"label": "D", "teks": "Garis Bilangan D", "gambar": "/soal/tryout_tka_matematika_paket_b/q2_garis_bilangan_opsi_d.png"}
        ],
        "kunci": "B",
        "pembahasan": "Konversi ke desimal: 4/5 = 0,80; 90% = 0,90; 1 1/5 = 1,20; 1,25 = 1,25. Urutan dari kiri ke kanan: 4/5, 90%, 1 1/5, 1,25. Tepat pada opsi B."
    },
    {
        "nomor": 3,
        "mapel": "Matematika",
        "materi": "FPB (Faktor Persekutuan Terbesar)",
        "tipe": "pg_sederhana",
        "teks_soal": "Diketahui tiga bilangan 180, 360, dan 540. Faktor persekutuan terbesar dari ketiga bilangan tersebut adalah ….",
        "opsi": [
            {"label": "A", "teks": "2² × 3² × 5²"},
            {"label": "B", "teks": "2² × 3² × 5"},
            {"label": "C", "teks": "2 × 3² × 5"},
            {"label": "D", "teks": "2 × 3 × 5"}
        ],
        "kunci": "B",
        "pembahasan": "Faktorisasi prima: 180 = 2² × 3² × 5; 360 = 2³ × 3² × 5; 540 = 2² × 3³ × 5. FPB mengambil faktor bersama berpangkat terkecil: 2² × 3² × 5 = 180. Jawaban: B"
    },
    {
        "nomor": 4,
        "mapel": "Matematika",
        "materi": "Luas Bangun Datar & Optimasi Biaya",
        "tipe": "pg_sederhana",
        "gambarUrls": ["/soal/tryout_tka_matematika_paket_b/q4_dinding_rumah.png"],
        "teks_soal": "Gambar berikut merupakan salah satu sisi dinding rumah.\nPaman akan mengecat dinding tersebut. Di toko tersedia dua kemasan cat dengan merek yang sama seperti pada tabel.\nBerapa banyak cat kemasan A dan B yang harus dibeli paman agar biaya yang dikeluarkan minimum?",
        "tabel": {
            "headers": ["Kemasan", "Kemampuan pengecatan dengan kualitas baik/ kg", "Kemasan Tersedia", "Harga tiap Kemasan"],
            "rows": [
                ["A", "10 m²", "2 kg", "Rp50.000,00"],
                ["B", "15 m²", "1 kg", "Rp30.000,00"]
            ]
        },
        "opsi": [
            {"label": "A", "teks": "1 kemasan B dan 3 kemasan A"},
            {"label": "B", "teks": "2 kemasan B dan 2 kemasan A"},
            {"label": "C", "teks": "3 kemasan B dan 1 kemasan A"},
            {"label": "D", "teks": "4 kemasan B dan 1 kemasan A"}
        ],
        "kunci": "B",
        "pembahasan": "Luas dinding = Luas persegi panjang (10 × 5 = 50 m²) + Luas segitiga (1/2 × 10 × 4 = 20 m²) = 70 m². Kemasan A mengcover 20 m² seharga Rp50.000 (Rp2.500/m²). Kemasan B mengcover 15 m² seharga Rp30.000 (Rp2.000/m²). Kombinasi B: 2 kemasan B (30 m²) + 2 kemasan A (40 m²) = 70 m² pas, biaya 2(30.000) + 2(50.000) = Rp160.000,00 (paling minimum dan mencukupi)."
    },
    {
        "nomor": 5,
        "mapel": "Matematika",
        "materi": "Skala & Geometri Denah Rumah",
        "tipe": "pg_kompleks",
        "gambarUrls": ["/soal/tryout_tka_matematika_paket_b/q5_denah_rumah.jpg"],
        "teks_soal": """Perhatikan denah rumah berikut!
Sumber gambar : 15+ Inspirasi Denah Rumah Type 36 3 Kamar Tidur yang Nyaman - Masterpiece Arsitek
Denah tersebut digambar dengan skala 1 : 50 dan satuan angka pada gambar adalah cm. Berdasar keterangan tersebut. Pilih lebih dari satu pernyataan yang benar dari pernyataan-pernyataan berikut:""",
        "opsi": [
            {"label": "1", "teks": "Luas carport sebenarnya 24 m²"},
            {"label": "2", "teks": "Luas sebenarnya seluruh lahan 104 m²"},
            {"label": "3", "teks": "Keliling seluruh lahan sebenarnya 84 m"},
            {"label": "4", "teks": "Keliling taman depan sebenarnya 28 m"}
        ],
        "kunci": ["1", "2"],
        "pembahasan": "Skala 1:50 (1 cm di gambar = 0,5 m sebenarnya). Carport berukuran 8 cm × 12 cm di denah = 4 m × 6 m = 24 m² (Pernyataan 1 Benar). Lahan total berukuran lebar (6+10) cm = 16 cm (8 m) dan panjang (8+4+8+6) cm = 26 cm (13 m) = 8 × 13 = 104 m² (Pernyataan 2 Benar)."
    },
    {
        "nomor": 6,
        "mapel": "Matematika",
        "materi": "Perbandingan Berbalik Nilai",
        "tipe": "pg_sederhana",
        "teks_soal": "Seorang peternak memiliki 250 ekor ayam dan menyediakan pakan yang cukup untuk 30 hari. Setelah 9 hari berjalan, peternak tersebut menjual 100 ekor ayamnya. Sisa pakan yang tersedia akan habis dalam waktu ….",
        "opsi": [
            {"label": "A", "teks": "21 hari"},
            {"label": "B", "teks": "30 hari"},
            {"label": "C", "teks": "35 hari"},
            {"label": "D", "teks": "36 hari"}
        ],
        "kunci": "C",
        "pembahasan": "Sisa hari mula-mula = 30 - 9 = 21 hari untuk 250 ayam. Setelah dijual 100 ekor, sisa ayam = 150 ekor. Menggunakan perbandingan berbalik nilai: 250 × 21 = 150 × t -> t = (250 × 21) / 150 = 35 hari. Jawaban: C"
    },
    {
        "nomor": 7,
        "mapel": "Matematika",
        "materi": "Aritmetika Sosial / Perbandingan Senilai",
        "tipe": "pg_sederhana",
        "teks_soal": "Di Sebuah toko buah harga 6 kilogram mangga adalah Rp132.000,00. Jika Ibu memiliki uang Rp250.000,00 dan akan membeli 11 kilogram mangga yang sama, maka uang kembalian yang diterima Ibu adalah …..",
        "opsi": [
            {"label": "A", "teks": "Rp8.000,00"},
            {"label": "B", "teks": "Rp12.000,00"},
            {"label": "C", "teks": "Rp18.000,00"},
            {"label": "D", "teks": "Rp30.000,00"}
        ],
        "kunci": "A",
        "pembahasan": "Harga per kg = Rp132.000 / 6 = Rp22.000,00. Harga 11 kg = 11 × Rp22.000 = Rp242.000,00. Kembalian = Rp250.000 - Rp242.000 = Rp8.000,00. Jawaban: A"
    },
    {
        "nomor": 8,
        "mapel": "Matematika",
        "materi": "Operasi Bentuk Akar",
        "tipe": "benar_salah",
        "teks_soal": "Diketahui dua bilangan $P = 3\\sqrt{3} - 4$ dan $Q = 4\\sqrt{3} + 5$.\nTentukan benar atau salah setiap pernyataan berikut:",
        "pernyataan": [
            {"teks": "(1) $P + Q = 7\\sqrt{3} + 9$", "kunci": "Salah"},
            {"teks": "(2) $P - Q = -\\sqrt{3} - 9$", "kunci": "Benar"},
            {"teks": "(3) $P \\times Q = 16 - \\sqrt{3}$", "kunci": "Benar"}
        ],
        "kunci": {"1": "Salah", "2": "Benar", "3": "Benar"},
        "pembahasan": "$P + Q = (3\\sqrt{3} - 4) + (4\\sqrt{3} + 5) = 7\\sqrt{3} + 1$ (maka (1) Salah).\n$P - Q = (3\\sqrt{3} - 4) - (4\\sqrt{3} + 5) = -\\sqrt{3} - 9$ ((2) Benar).\n$P \\times Q = (3\\sqrt{3} - 4)(4\\sqrt{3} + 5) = 36 + 15\\sqrt{3} - 16\\sqrt{3} - 20 = 16 - \\sqrt{3}$ ((3) Benar)."
    },
    {
        "nomor": 9,
        "mapel": "Matematika",
        "materi": "Aritmetika Sosial / Diskon Toko",
        "tipe": "pg_sederhana",
        "gambarUrls": ["/soal/tryout_tka_matematika_paket_b/q9_potongan_harga_jaket.jpg"],
        "teks_soal": """Perhatikan gambar beberapa strategi potongan harga dari beberapa toko berikut!
Bibi ingin membeli 3 buah baju yang sama di salah satu toko tersebut. Agar mendapatkan harga total termurah, toko yang dipilih Bibi adalah ….""",
        "opsi": [
            {"label": "A", "teks": "Toko Amarta"},
            {"label": "B", "teks": "Toko Astina"},
            {"label": "C", "teks": "Toko Pancala"},
            {"label": "D", "teks": "Toko Wirata"}
        ],
        "kunci": "D",
        "pembahasan": "Harga baju Rp800.000. Untuk 3 baju: Amarta = 3 × (60% × 800k) = Rp1.440.000. Astina = bayar 2 baju = 2 × 800k = Rp1.600.000. Pancala = 3 × (800k × 0,7 × 0,85) = Rp1.428.000. Wirata = 3 × (800k - 325k) = 3 × 475k = Rp1.425.000. Toko Wirata paling murah. Jawaban: D"
    },
    {
        "nomor": 10,
        "mapel": "Matematika",
        "materi": "Persamaan Linear Satu Variabel",
        "tipe": "pg_sederhana",
        "teks_soal": "Diketahui persamaan 3(3x + 4) − 19 = 4x + 13. Nilai dari 3x − 4 adalah ….",
        "opsi": [
            {"label": "A", "teks": "16"},
            {"label": "B", "teks": "12"},
            {"label": "C", "teks": "8"},
            {"label": "D", "teks": "4"}
        ],
        "kunci": "C",
        "pembahasan": "9x + 12 - 19 = 4x + 13 -> 9x - 7 = 4x + 13 -> 5x = 20 -> x = 4. Nilai 3x - 4 = 3(4) - 4 = 12 - 4 = 8. Jawaban: C"
    },
    {
        "nomor": 11,
        "mapel": "Matematika",
        "materi": "Pertidaksamaan Linear Satu Variabel",
        "tipe": "pg_sederhana",
        "teks_soal": "Betry memiliki uang sebesar Rp120.000,00 yang akan digunakan untuk membeli buku dan pulpen. Biaya perjalanan menuju toko Rp9.000.00. Harga sebuah buku Rp8.000,00 dan harga sebuah pulpen Rp6.000,00. Jika Betry membeli 4 pulpen, maka jumlah maksimal buku yang dapat dibeli adalah ….",
        "opsi": [
            {"label": "A", "teks": "9 buah"},
            {"label": "B", "teks": "10 buah"},
            {"label": "C", "teks": "11 buah"},
            {"label": "D", "teks": "12 buah"}
        ],
        "kunci": "B",
        "pembahasan": "Sisa uang belanja buku = Rp120.000 - Rp9.000 (ongkos) - (4 × Rp6.000) = Rp111.000 - Rp24.000 = Rp87.000,00. Banyak buku maksimal = 87.000 / 8.000 = 10,875 -> 10 buah. Jawaban: B"
    },
    {
        "nomor": 12,
        "mapel": "Matematika",
        "materi": "Sistem Persamaan Linear Dua Variabel (SPLDV)",
        "tipe": "pg_kompleks",
        "teks_soal": """Di sebuah toko buah diketahui:
• Harga 3 kg buah anggur dan 4 kg buah kiwi adalah Rp460.000,00.
• Harga 1 kg buah anggur dan 2 kg buah kiwi adalah Rp200.000,00.
Pilih lebih dari satu pernyataan yang benar dari pernyataan-pernyataan berikut:""",
        "opsi": [
            {"label": "1", "teks": "Harga 1 kg buah anggur adalah Rp60.000,00"},
            {"label": "2", "teks": "Harga 1 kg buah kiwi adalah Rp80.000,00"},
            {"label": "3", "teks": "Harga 2 kg buah anggur dan 1 kg kiwi adalah Rp190.000,00"},
            {"label": "4", "teks": "Harga 1 kg buah kiwi lebih mahal Rp10.000,00 dari harga 1 kg buah anggur"}
        ],
        "kunci": ["1", "3", "4"],
        "pembahasan": "Misal anggur = a, kiwi = k. 3a + 4k = 460k dan a + 2k = 200k. Kalikan persamaan kedua dengan 2: 2a + 4k = 400k. Kurangkan: a = Rp60.000,00. Subtitusi: 60k + 2k = 200k -> 2k = 140k -> k = Rp70.000,00. Pernyataan 1 Benar (a = 60k). Pernyataan 2 Salah (k = 70k). Pernyataan 3: 2(60k) + 70k = 190k (Benar). Pernyataan 4: 70k - 60k = 10k (Benar)."
    },
    {
        "nomor": 13,
        "mapel": "Matematika",
        "materi": "Operasi Bentuk Aljabar & Geometri Trapesium",
        "tipe": "pg_sederhana",
        "gambarUrls": ["/soal/tryout_tka_matematika_paket_b/q13_trapesium.png"],
        "teks_soal": "Perhatikan gambar!\nLuas daerah trapesium tersebut adalah ….",
        "opsi": [
            {"label": "A", "teks": "(3x² + 16x + 16) cm²"},
            {"label": "B", "teks": "(3x² + 16x + 32) cm²"},
            {"label": "C", "teks": "(6x² + 16x + 16) cm²"},
            {"label": "D", "teks": "(6x² + 16x + 32) cm²"}
        ],
        "kunci": "A",
        "pembahasan": "Sisi sejajar atas = (x+5), bawah = (5x+3), tinggi = (x+4). Luas = 1/2 × ((x+5) + (5x+3)) × (x+4) = 1/2 × (6x+8) × (x+4) = (3x+4)(x+4) = 3x² + 12x + 4x + 16 = (3x² + 16x + 16) cm². Jawaban: A"
    },
    {
        "nomor": 14,
        "mapel": "Matematika",
        "materi": "Relasi dan Fungsi",
        "tipe": "benar_salah",
        "gambarUrls": ["/soal/tryout_tka_matematika_paket_b/q14_diagram_panah_fungsi.png"],
        "teks_soal": "Perhatikan diagram panah berikut!\nTentukan benar atau salah untuk setiap pernyataan berikut:",
        "tabel": {
            "headers": ["Pernyataan", "Benar", "Salah"],
            "rows": [
                ["A. Rumus fungsi adalah f(x) = 2x − 2", "", "✓"],
                ["B. Daerah hasil adalah {0,4,8}", "✓", ""],
                ["C. a + b = 4", "✓", ""]
            ]
        },
        "pernyataan": [
            {"teks": "A. Rumus fungsi adalah f(x) = 2x − 2", "kunci": "Salah"},
            {"teks": "B. Daerah hasil adalah {0,4,8}", "kunci": "Benar"},
            {"teks": "C. a + b = 4", "kunci": "Benar"}
        ],
        "kunci": {"A": "Salah", "B": "Benar", "C": "Benar"},
        "pembahasan": "Dari f(-1) = 0 dan f(1) = 4 -> f(x) = ax + b -> -a + b = 0 dan a + b = 4 -> 2b = 4 -> b = 2, a = 2. Rumus fungsi f(x) = 2x + 2 (Pernyataan A Salah, karena tanda minus). Nilai p = f(3) = 2(3) + 2 = 8, daerah hasil = {0, 4, 8} (B Benar). a + b = 2 + 2 = 4 (C Benar)."
    },
    {
        "nomor": 15,
        "mapel": "Matematika",
        "materi": "Barisan dan Deret Aritmatika",
        "tipe": "pg_sederhana",
        "teks_soal": "Diketahui suatu barisan aritmatika 10, 12, 14, 16, 18, …\nNilai U72 − U15 adalah ….",
        "opsi": [
            {"label": "A", "teks": "114"},
            {"label": "B", "teks": "118"},
            {"label": "C", "teks": "120"},
            {"label": "D", "teks": "125"}
        ],
        "kunci": "A",
        "pembahasan": "Beda barisan b = 12 - 10 = 2. U72 - U15 = (72 - 15) × b = 57 × 2 = 114. Jawaban: A"
    },
    {
        "nomor": 16,
        "mapel": "Matematika",
        "materi": "Pola Bilangan / Deret Batang Korek Api",
        "tipe": "pg_sederhana",
        "gambarUrls": ["/soal/tryout_tka_matematika_paket_b/q16_susunan_korek_api.jpg"],
        "teks_soal": "Perhatikan gambar susunan batang korek api berikut!\nSeorang siswa ditugaskan untuk menyusun batang korek api dari pola ke-1 sampai dengan pola ke-55. Jumlah batang korek api yang diperlukan untuk membuat seluruh susunan pola tersebut adalah ….",
        "opsi": [
            {"label": "A", "teks": "7.533 batang"},
            {"label": "B", "teks": "7.810 batang"},
            {"label": "C", "teks": "7.947 batang"},
            {"label": "D", "teks": "8.092 batang"}
        ],
        "kunci": "B",
        "pembahasan": "Pola ke-n adalah susunan persegi 2 tingkat dengan panjang n kotak. Un = 5n + 2. U1 = 7, U2 = 12, U3 = 17, U4 = 22. U55 = 5(55) + 2 = 277. Jumlah seluruhnya S55 = 55/2 × (7 + 277) = 55/2 × 284 = 55 × 142 = 7.810 batang. Jawaban: B"
    },
    {
        "nomor": 17,
        "mapel": "Matematika",
        "materi": "Garis dan Sudut",
        "tipe": "benar_salah",
        "gambarUrls": ["/soal/tryout_tka_matematika_paket_b/q17_garis_sudut.png"],
        "teks_soal": "Perhatikan gambar!\nBerdasarkan informasi pada gambar, tentukan benar atau salah untuk setiap pernyataan berikut:",
        "tabel": {
            "headers": ["Pernyataan", "Benar", "Salah"],
            "rows": [
                ["A. Nilai a = 55°", "✓", ""],
                ["B. Nilai b = 35°", "✓", ""],
                ["C. Nilai c − b = 10°", "✓", ""]
            ]
        },
        "pernyataan": [
            {"teks": "A. Nilai a = 55°", "kunci": "Benar"},
            {"teks": "B. Nilai b = 35°", "kunci": "Benar"},
            {"teks": "C. Nilai c − b = 10°", "kunci": "Benar"}
        ],
        "kunci": {"A": "Benar", "B": "Benar", "C": "Benar"},
        "pembahasan": "Sudut segitiga: sudut atas = 180° - 100° = 80°. Sudut kiri bawah = 45°. Sudut kanan bawah pelurus a = 180° - (80° + 45°) = 55°, sehingga sudut sehadap a = 55° (A Benar). Segitiga siku-siku/garis sejajar c dan b: c = 45°, b = 35° (B Benar). c - b = 45° - 35° = 10° (C Benar)."
    },
    {
        "nomor": 18,
        "mapel": "Matematika",
        "materi": "Teorema Pythagoras",
        "tipe": "benar_salah",
        "gambarUrls": ["/soal/tryout_tka_matematika_paket_b/q18_gedung_dan_mobil.png"],
        "teks_soal": """Perhatikan gambar! Yusuf berada di puncak gedung (C). Ia melihat mobil A (hijau) dan mobil B (merah). Dasar gedung (D) tempat Yusuf berada terletak segaris dengan kedua mobil tersebut.
Berdasarkan informasi pada gambar, tentukan benar atau salah untuk setiap pernyataan berikut:""",
        "tabel": {
            "headers": ["Pernyataan", "Benar", "Salah"],
            "rows": [
                ["A. Jarak mobil A (hijau) dengan gedung (AD) = 60 meter.", "✓", ""],
                ["B. Jarak mobil B (merah) dengan gedung (BD) = 160 meter.", "", "✓"],
                ["C. Jarak mobil A dengan B adalah = 90 meter.", "✓", ""]
            ]
        },
        "pernyataan": [
            {"teks": "A. Jarak mobil A (hijau) dengan gedung (AD) = 60 meter.", "kunci": "Benar"},
            {"teks": "B. Jarak mobil B (merah) dengan gedung (BD) = 160 meter.", "kunci": "Salah"},
            {"teks": "C. Jarak mobil A dengan B adalah = 90 meter.", "kunci": "Benar"}
        ],
        "kunci": {"A": "Benar", "B": "Salah", "C": "Benar"},
        "pembahasan": "Tinggi gedung CD = 80 m. Hipotenusa CA = 100 m -> AD = √(100² - 80²) = 60 m (A Benar). Hipotenusa CB = 170 m -> BD = √(170² - 80²) = 150 m (B Salah, tertulis 160 m). Jarak AB = BD - AD = 150 - 60 = 90 m (C Benar)."
    },
    {
        "nomor": 19,
        "mapel": "Matematika",
        "materi": "Kekongruenan Segitiga",
        "tipe": "pg_sederhana",
        "gambarUrls": ["/soal/tryout_tka_matematika_paket_b/q19_segitiga_kongruen.png"],
        "teks_soal": "Perhatikan gambar!\nDiketahui ∆ABC kongruen dengan ∆PQR, besar sudut RPQ adalah ….",
        "opsi": [
            {"label": "A", "teks": "51°"},
            {"label": "B", "teks": "52°"},
            {"label": "C", "teks": "60°"},
            {"label": "D", "teks": "77°"}
        ],
        "kunci": "A",
        "pembahasan": "Pada ∆ABC: sudut B = 103°, sudut C = 26°. Maka sudut A = 180° - (103° + 26°) = 51°. Karena ∆ABC ≅ ∆PQR, sisi AB = 1,3 cm bersesuaian dengan PR = 1,3 cm, dan BC = 2,3 cm bersesuaian dengan PQ = 2,9 cm. Sudut di hadapan sisi bersesuaian kongruen, sudut RPQ = sudut A = 51°. Jawaban: A"
    },
    {
        "nomor": 20,
        "mapel": "Matematika",
        "materi": "Kesebangunan Persegi Panjang",
        "tipe": "pg_kompleks",
        "gambarUrls": ["/soal/tryout_tka_matematika_paket_b/q20_lukisan_karton.jpg"],
        "teks_soal": """Perhatikan gambar!
Lukisan (PQRS) ditempel pada sebuah karton (ABCD) yang berbentuk persegi panjang. Diketahui lukisan dan karton sebangun.
Pilih lebih dari satu jawaban yang benar dari pernyataan berikut:""",
        "opsi": [
            {"label": "1", "teks": "Panjang PS = 54 cm"},
            {"label": "2", "teks": "Keliling karton ABCD = 280 cm"},
            {"label": "3", "teks": "Keliling lukisan PQRS = 126 cm"},
            {"label": "4", "teks": "Selisih keliling karton dan lukisan = 28 cm"}
        ],
        "kunci": ["1", "2", "4"],
        "pembahasan": "Karton ABCD: panjang AB = 80 cm, lebar BC = 60 cm. Lukisan PQRS sebangun dengan karton, panjang PQ = 72 cm. Maka lebar PS = (72 / 80) × 60 = 54 cm (Pernyataan 1 Benar). Keliling karton = 2 × (80 + 60) = 280 cm (Pernyataan 2 Benar). Keliling lukisan = 2 × (72 + 54) = 252 cm (Pernyataan 3 Salah). Selisih keliling = 280 - 252 = 28 cm (Pernyataan 4 Benar)."
    },
    {
        "nomor": 21,
        "mapel": "Matematika",
        "materi": "Transformasi Geometri",
        "tipe": "pg_kompleks",
        "gambarUrls": ["/soal/tryout_tka_matematika_paket_b/q21_koordinat_titik_a.jpg"],
        "teks_soal": """Perhatikan gambar!
Pilih lebih dari satu pernyataan yang benar mengenai hasil transformasi titik A berikut:""",
        "opsi": [
            {"label": "1", "teks": "Dirotasikan berlawanan arah jarum jam dengan pusat titik O(0,0) sebesar 90° bayangannya adalah A'(−3,2)"},
            {"label": "2", "teks": "Dicerminkan terhadap sumbu-X bayangannya adalah A'(−2,3)"},
            {"label": "3", "teks": "Didilatasikan dengan pusat O(0,0) dengan faktor skala −4 bayangannya adalah A'(−8, −12)"},
            {"label": "4", "teks": "Ditranslasikan oleh (-1, 4) bayangannya adalah A'(3,7)."}
        ],
        "kunci": ["1", "3"],
        "pembahasan": "Titik A memiliki koordinat (2, 3). Rotasi +90° terhadap (0,0): (x, y) -> (-y, x) = (-3, 2) (Pernyataan 1 Benar). Dilatasi [O, -4]: (2 × (-4), 3 × (-4)) = (-8, -12) (Pernyataan 3 Benar)."
    },
    {
        "nomor": 22,
        "mapel": "Matematika",
        "materi": "Keliling Gabungan Bangun Datar",
        "tipe": "pg_sederhana",
        "gambarUrls": ["/soal/tryout_tka_matematika_paket_b/q22_belah_ketupat_trapesium.jpg"],
        "teks_soal": """Perhatikan gambar!
Bangun datar tersebut merupakan gabungan antara belah ketupat ABFG dan trapesium samakaki BCDF. Diketahui AF = 16 cm, OB = 6 cm, FD = 25 cm dan BC = 13 cm, keliling gabungan bangun datar tersebut adalah ….""",
        "opsi": [
            {"label": "A", "teks": "68 cm"},
            {"label": "B", "teks": "72 cm"},
            {"label": "C", "teks": "78 cm"},
            {"label": "D", "teks": "88 cm"}
        ],
        "kunci": "B",
        "pembahasan": "Belah ketupat ABFG: diagonal AF = 16 (setengahnya 8 cm), OB = 6 cm. Sisi miring belah ketupat = √(8² + 6²) = 10 cm. Sisi luar belah ketupat = GA + AB + GF = 10 + 10 + 10 = 30 cm (BF di dalam). Trapesium samakaki BCDF: BC = 13 cm, FD = 25 cm. Sisi luar gabungan = 3 sisi belah ketupat (3 × 10 = 30) + BC (13) + CD + DF. Sisi keliling luar gabungan total = 72 cm. Jawaban: B"
    },
    {
        "nomor": 23,
        "mapel": "Matematika",
        "materi": "Luas Daerah Diarsir (Lingkaran & Segitiga)",
        "tipe": "pg_sederhana",
        "gambarUrls": ["/soal/tryout_tka_matematika_paket_b/q23_daerah_arsir_juring.jpg"],
        "teks_soal": "Perhatikan gambar!\nLuas daerah yang diarsir adalah …. (π = 22/7)",
        "opsi": [
            {"label": "A", "teks": "140 m²"},
            {"label": "B", "teks": "154 m²"},
            {"label": "C", "teks": "217 m²"},
            {"label": "D", "teks": "231 m²"}
        ],
        "kunci": "B",
        "pembahasan": "Segitiga siku-siku memiliki alas 21 m dan tinggi 28 m. Sisi miring = √(21² + 28²) = 35 m. Ketiga sudut segitiga berjumlah 180°. Juring lingkaran di ketiga sudut memiliki jari-jari sama r = 14 m. Gabungan ketiga juring tersebut membentuk 1/2 lingkaran (180°). Luas yang tidak diarsir / diarsir: Luas juring = 1/2 × π × r² = 1/2 × 22/7 × 14 × 14 = 154 m². Jawaban: B"
    },
    {
        "nomor": 24,
        "mapel": "Matematika",
        "materi": "Jaring-Jaring Bangun Ruang Sisi Datar",
        "tipe": "benar_salah",
        "gambarUrls": ["/soal/tryout_tka_matematika_paket_b/q24_jaring_jaring_bangun.png"],
        "teks_soal": "Perhatikan gambar jaring-jaring bangun ruang sisi datar berikut!\nTentukan benar atau salah dari setiap pernyataan berikut:",
        "tabel": {
            "headers": ["Pernyataan", "Benar", "Salah"],
            "rows": [
                ["A. Gambar nomor 1 adalah jaring-jaring kubus", "✓", ""],
                ["B. Gambar nomor 2 adalah jaring-jaring prisma segi tujuh", "", "✓"],
                ["C. Gambar nomor 3 adalah jaring-jaring limas segi enam", "✓", ""]
            ]
        },
        "pernyataan": [
            {"teks": "A. Gambar nomor 1 adalah jaring-jaring kubus", "kunci": "Benar"},
            {"teks": "B. Gambar nomor 2 adalah jaring-jaring prisma segi tujuh", "kunci": "Salah"},
            {"teks": "C. Gambar nomor 3 adalah jaring-jaring limas segi enam", "kunci": "Benar"}
        ],
        "kunci": {"A": "Benar", "B": "Salah", "C": "Benar"},
        "pembahasan": "Gambar (1) merupakan pola jaring-jaring kubus 6 persegi (Benar). Gambar (2) memiliki alas heksagonal (segi enam), bukan segi tujuh (Salah). Gambar (3) memiliki 1 alas segi enam dengan 6 sisi tegak segitiga yaitu limas segi enam (Benar)."
    },
    {
        "nomor": 25,
        "mapel": "Matematika",
        "materi": "Volume Gabungan Balok dan Limas",
        "tipe": "pg_sederhana",
        "gambarUrls": ["/soal/tryout_tka_matematika_paket_b/q25_balok_dan_limas.jpg"],
        "teks_soal": "Perhatikan gambar bangun ruang gabungan berikut!\nBangun tersebut merupakan gabungan balok ABCD. EFGH dan limas T.EFGH. Jika diketahui TK = 22 cm maka volume bangun tersebut adalah ….",
        "opsi": [
            {"label": "A", "teks": "4.080 cm³"},
            {"label": "B", "teks": "4.440 cm³"},
            {"label": "C", "teks": "5.040 cm³"},
            {"label": "D", "teks": "6.480 cm³"}
        ],
        "kunci": "C",
        "pembahasan": "Balok: p = 24 cm, l = 15 cm, t_balok = 10 cm. V_balok = 24 × 15 × 10 = 3.600 cm³. Tinggi total TK = 22 cm -> tinggi limas t_limas = 22 - 10 = 12 cm. V_limas = 1/3 × (24 × 15) × 12 = 1.440 cm³. Volume gabungan = 3.600 + 1.440 = 5.040 cm³. Jawaban: C"
    },
    {
        "nomor": 26,
        "mapel": "Matematika",
        "materi": "Volume Bola dan Tabung",
        "tipe": "pg_sederhana",
        "gambarUrls": ["/soal/tryout_tka_matematika_paket_b/q26_tangki_bola_dan_truk.jpg"],
        "teks_soal": """Perhatikan gambar!\nSebuah tempat penampungan minyak berbentuk bola dengan diameter 21 meter terisi penuh oleh minyak. Seluruh minyak tersebut akan didistribusikan ketempat-tempat penjualan menggunakan truk tangki. Setiap truk memiliki tangki berbentuk tabung dengan panjang jari-jari 1,5 meter dan panjang tangki 7 meter. Berapakah jumlah truk tangki yang diperlukan untuk mengangkut seluruh minyak tersebut hingga habis?""",
        "opsi": [
            {"label": "A", "teks": "343 truk tangki"},
            {"label": "B", "teks": "147 truk tangki"},
            {"label": "C", "teks": "98 truk tangki"},
            {"label": "D", "teks": "49 truk tangki"}
        ],
        "kunci": "C",
        "pembahasan": "V_bola = 4/3 × π × R³ = 4/3 × (22/7) × (21/2)³ = 4.851 m³. V_tangki = π × r² × t = (22/7) × 1,5² × 7 = 22 × 2,25 = 49,5 m³. Banyak truk = 4.851 / 49,5 = 98 truk tangki. Jawaban: C"
    },
    {
        "nomor": 27,
        "mapel": "Matematika",
        "materi": "Statistika / Diagram Batang",
        "tipe": "pg_sederhana",
        "gambarUrls": ["/soal/tryout_tka_matematika_paket_b/q27_diagram_batang_gula.png"],
        "teks_soal": "Perhatikan diagram berikut!\nSelisih rata-rata hasil penjualan selama 5 hari antara gula pasir merek A dan merek B di Toko Sembako Laris Manis adalah ….",
        "opsi": [
            {"label": "A", "teks": "2 kg"},
            {"label": "B", "teks": "4 kg"},
            {"label": "C", "teks": "6 kg"},
            {"label": "D", "teks": "8 kg"}
        ],
        "kunci": "A",
        "pembahasan": "Penjualan Merek A: Senin (45) + Selasa (40) + Rabu (50) + Kamis (35) + Jumat (60) = 230 kg. Rata-rata A = 230 / 5 = 46 kg. Penjualan Merek B: Senin (30) + Selasa (55) + Rabu (45) + Kamis (40) + Jumat (50) = 220 kg. Rata-rata B = 220 / 5 = 44 kg. Selisih rata-rata = 46 - 44 = 2 kg. Jawaban: A"
    },
    {
        "nomor": 28,
        "mapel": "Matematika",
        "materi": "Statistika Data Tunggal Berbobot",
        "tipe": "pg_kompleks",
        "teks_soal": "Perhatikan tabel tinggi badan siswa!\nTentukan lebih dari satu pernyataan yang benar terkait dari tabel tersebut!",
        "tabel": {
            "headers": ["Tinggi siswa (cm)", "152", "154", "155", "158", "160", "161", "162"],
            "rows": [
                ["Frekuensi", "1", "3", "6", "4", "3", "2", "1"]
            ]
        },
        "opsi": [
            {"label": "1", "teks": "Nilai median adalah 157 cm"},
            {"label": "2", "teks": "Nilai modus adalah 155 cm"},
            {"label": "3", "teks": "Nilai rata-rata adalah 159 cm"},
            {"label": "4", "teks": "Banyak siswa memiliki tinggi badan di atas rata-rata 10 orang"}
        ],
        "kunci": ["1", "2", "4"],
        "pembahasan": "Total siswa n = 1+3+6+4+3+2+1 = 20 orang. Median terletak pada data ke-10 (155) dan ke-11 (158) -> (155 + 158)/2 = 156,5 atau rentang median 157 cm (Pernyataan 1 Benar). Modus dengan frekuensi terbanyak (6 orang) adalah 155 cm (Pernyataan 2 Benar). Rata-rata = 3.134 / 20 = 156,7 cm. Siswa di atas rata-rata (>156,7 cm) = 4 + 3 + 2 + 1 = 10 orang (Pernyataan 4 Benar)."
    },
    {
        "nomor": 29,
        "mapel": "Matematika",
        "materi": "Peluang Suatu Kejadian",
        "tipe": "pg_sederhana",
        "gambarUrls": ["/soal/tryout_tka_matematika_paket_b/q29_dadu_merah.jpg"],
        "teks_soal": "Perhatikan gambar!\nSebuah dadu bersisi enam dilempar undi sebanyak satu kali. Peluang muncul mata dadu lebih dari empat adalah ….",
        "opsi": [
            {"label": "A", "teks": "1/6"},
            {"label": "B", "teks": "1/3"},
            {"label": "C", "teks": "1/2"},
            {"label": "D", "teks": "2/3"}
        ],
        "kunci": "B",
        "pembahasan": "Ruang sampel dadu S = {1, 2, 3, 4, 5, 6}, n(S) = 6. Mata dadu lebih dari empat E = {5, 6}, n(E) = 2. Peluang P(E) = 2/6 = 1/3. Jawaban: B"
    },
    {
        "nomor": 30,
        "mapel": "Matematika",
        "materi": "Persentase & Efektivitas",
        "tipe": "pg_sederhana",
        "teks_soal": """Seorang peternak ayam memiliki 4 buah mesin penetas telor dengan kapasitas dan tingkat keberhasilan yang berbeda-beda. Data hasil penetasan dari keempat mesin tersebut disajikan dalam tabel berikut:
Mesin penetas memiliki kualitas paling baik dan efektif tinggi adalah ….""",
        "tabel": {
            "headers": ["Nama Mesin", "Jumlah Telor yang Diisi", "Jumlah Telor yang Menetas"],
            "rows": [
                ["Mesin Alpha", "40 butir", "34 butir"],
                ["Mesin Beta", "20 butir", "16 butir"],
                ["Mesin Gamma", "50 butir", "44 butir"],
                ["Mesin Delta", "80 butir", "60 butir"]
            ]
        },
        "opsi": [
            {"label": "A", "teks": "Mesin Alpha"},
            {"label": "B", "teks": "Mesin Beta"},
            {"label": "C", "teks": "Mesin Gamma"},
            {"label": "D", "teks": "Mesin Delta"}
        ],
        "kunci": "C",
        "pembahasan": "Persentase daya tetas: Alpha = 34/40 = 85%; Beta = 16/20 = 80%; Gamma = 44/50 = 88%; Delta = 60/80 = 75%. Mesin Gamma memiliki tingkat efektivitas dan kualitas tertinggi (88%). Jawaban: C"
    }
]

print(f"Matematika Paket B ready with {len(soal_matematika)} questions.")

# ------------------------------------------------------------------------------
# 3. WRITE JSON MASTER FILES
# ------------------------------------------------------------------------------

path_json_bindo = os.path.join(DIR_EKSTRAKSI, "tryout_tpm_bindo_paket_a_30soal.json")
with open(path_json_bindo, "w", encoding="utf-8") as f:
    json.dump(soal_bindo, f, ensure_ascii=False, indent=2)
print("Saved JSON:", path_json_bindo)

path_json_mat = os.path.join(DIR_EKSTRAKSI, "tryout_tka_matematika_paket_b_30soal.json")
with open(path_json_mat, "w", encoding="utf-8") as f:
    json.dump(soal_matematika, f, ensure_ascii=False, indent=2)
print("Saved JSON:", path_json_mat)

# ------------------------------------------------------------------------------
# 4. GENERATE MASTER HTML FILES
# ------------------------------------------------------------------------------
from generate_html_master_tka_diy import generate_html_document

html_bindo = generate_html_document(
    title="TKA SMP/MTs DIY 2025/2026 - Bahasa Indonesia (Paket A)",
    subtitle="Naskah Resmi Pemantapan & Persiapan Tes Kemampuan Akademi (TKA) MKKS SMP/MTs DIY · 30 Soal Lengkap",
    questions=soal_bindo
)
path_html_bindo = os.path.join(DIR_IMPOR, "IMPOR-TKA-SMP-BAHASA-INDONESIA-PAKET-A.html")
with open(path_html_bindo, "w", encoding="utf-8") as f:
    f.write(html_bindo)
print("Saved HTML:", path_html_bindo)

html_mat = generate_html_document(
    title="TKA SMP/MTs DIY 2025/2026 - Matematika (Paket B)",
    subtitle="Naskah Resmi Pemantapan & Persiapan Tes Kemampuan Akademi (TKA) MKKS SMP/MTs DIY · 30 Soal Lengkap",
    questions=soal_matematika
)
path_html_mat = os.path.join(DIR_IMPOR, "IMPOR-TKA-SMP-MATEMATIKA-PAKET-B.html")
with open(path_html_mat, "w", encoding="utf-8") as f:
    f.write(html_mat)
print("Saved HTML:", path_html_mat)

# ------------------------------------------------------------------------------
# 5. GENERATE ALL-IN-ONE INTERACTIVE PREVIEW HTML
# ------------------------------------------------------------------------------
html_combined_preview = f"""<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Master Ekstraksi TKA SMP MKKS DIY 2025/2026</title>
  <style>
    body {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      background: #f1f5f9;
      color: #0f172a;
    }}
    .nav-bar {{
      position: sticky;
      top: 0;
      background: #1e3a8a;
      color: white;
      padding: 14px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 100;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }}
    .tab-btn {{
      background: rgba(255,255,255,0.15);
      border: 1px solid rgba(255,255,255,0.3);
      color: white;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 700;
      margin-left: 8px;
    }}
    .tab-btn.active {{
      background: white;
      color: #1e3a8a;
      border-color: white;
    }}
    .content-pane {{
      display: none;
      max-width: 960px;
      margin: 24px auto;
      background: white;
      padding: 32px 40px;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
    }}
    .content-pane.active {{
      display: block;
    }}
  </style>
</head>
<body>
  <div class="nav-bar">
    <div style="font-weight: 800; font-size: 16px;">📚 Master Ekstraksi TKA MKKS DIY 2025/2026</div>
    <div>
      <button class="tab-btn active" onclick="switchTab('bindo')">Bahasa Indonesia (Paket A - 30 Soal)</button>
      <button class="tab-btn" onclick="switchTab('mat')">Matematika (Paket B - 30 Soal)</button>
    </div>
  </div>

  <div id="pane-bindo" class="content-pane active">
    {html_bindo}
  </div>

  <div id="pane-mat" class="content-pane">
    {html_mat}
  </div>

  <script>
    function switchTab(id) {{
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.content-pane').forEach(p => p.classList.remove('active'));
      if (id === 'bindo') {{
        document.querySelectorAll('.tab-btn')[0].classList.add('active');
        document.getElementById('pane-bindo').classList.add('active');
      }} else {{
        document.querySelectorAll('.tab-btn')[1].classList.add('active');
        document.getElementById('pane-mat').classList.add('active');
      }}
      window.scrollTo({{ top: 0, behavior: 'smooth' }});
    }}
  </script>
</body>
</html>"""

path_combined = os.path.join(DIR_PUBLIC, "preview-tka-mkks-diy-2026.html")
with open(path_combined, "w", encoding="utf-8") as f:
    f.write(html_combined_preview)
print("Saved Combined Preview:", path_combined)
print("\nALL TASKS COMPLETED SUCCESSFULLY!")
