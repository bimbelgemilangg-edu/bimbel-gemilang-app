import json
U='https://hqoasblnrsijbflupoir.supabase.co/storage/v1/object/public/materi-bimbel/materi-v2/gambar-sumber/'
S=[]
def add(j,**kw): S.append(dict(jenis=j,**kw))
add('judul',teks='A. Interaksi Sosial: Tarian Sosial yang Tak Pernah Berhenti')
add('paragraf',teks='Masyarakat hidup karena anggotanya terus "bertarian" bersama: saling menyapa, menawar di pasar, berdebat, bekerja sama. Tarian itu bernama interaksi sosial — menurut Soerjono Soekanto: hubungan sosial yang berkaitan dengan hubungan antarindividu, antarkelompok, yang saling memengaruhi. Tanpa interaksi, masyarakat hanya kumpulan orang asing.')
add('callout',tipe='info',judul='Posisi topik ini dalam TKA',teks='Soal interaksi sosial gemar menyajikan kasus sehari-hari (belanja online, guru-murid berdiskusi, kerja bakti) lalu menanyakan SYARAT, FAKTOR, atau BENTUK interaksi yang bekerja. Kuasai tiga kunci: syarat (kontak+komunikasi), faktor (sugesti s.d. identifikasi), bentuk (asosiatif vs disosiatif).')
add('paragraf',teks='Sebuah interaksi sah terjadi bila dua syarat terpenuhi: KONTAK (bertemu langsung/primer atau lewat media/sekunder) dan KOMUNIKASI (pesan tersampaikan dan ditanggapi). Belanja online tanpa tatap muka tetap interaksi: kontak sekunder tetap kontak.')
add('tabelinfo',judul='Syarat & faktor interaksi',kolom=['Konsep','Arti','Contoh kasus'],rows=[
 {'k':'Kontak sosial','v':'Pertemuan/pertautan pihak, langsung (primer) atau lewat media (sekunder).','w':'Chat penjual-pembeli = kontak sekunder.'},
 {'k':'Komunikasi sosial','v':'Pesan disampaikan & ditanggapi.','w':'Balasan chat menawar harga.'},
 {'k':'Sugesti','v':'Pemberian pandangan/pengaruh yang diterima tanpa pikir panjang.','w':'Terbeli barang karena iklan & diskon.'},
 {'k':'Imitasi','v':'Meniru sikap/tindakan orang lain.','w':'Meniru gaya bicara kreator konten.'},
 {'k':'Identifikasi','v':'Menjadi sama persis dengan orang lain yang dikagumi.','w':'Ingin menjadi seperti idolanya secara mendalam.'},
 {'k':'Empati & simpati','v':'Empati = memahami + turut merasa; simpati = memahami saja.','w':'Membantu korban bencana karena ikut merasa.'}])
add('paragraf',teks='Bentuk interaksi terbagi dua keluarga besar: ASOSIATIF (menyatukan: kerja sama/kooperasi, akomodasi, asimilasi, akulturasi) dan DISOSIATIF (memecah: persaingan/kompetisi, kontravensi, konflik). Ingat tangga ketegangan: persaingan (belum saling menjatuhkan) -> kontravensi (gosip, desas-desus, provokasi tersembunyi) -> konflik (terbuka).')
add('tabelinfo',judul='Keluarga asosiatif vs disosiatif',kolom=['Bentuk','Ciri','Contoh'],rows=[
 {'k':'Kerja sama (kooperasi)','v':'Beberapa pihak bergerak bersama mencapai tujuan.','w':'Kerja bakti membersihkan desa.'},
 {'k':'Akomodasi','v':'Upaya meredakan/menyelesaikan konflik.','w':'Mediasi, ajudikasi, konsiliasi.'},
 {'k':'Asimilasi & akulturasi','v':'Percampuran budaya; asimilasi melebur jadi baru, akulturasi tanpa menghilangkan budaya asli.','w':'Menara Kudus (akulturasi Islam-Hindu).'},
 {'k':'Kontravensi','v':'Penolakan tersembunyi: gosip, desas-desus, provokasi.','w':'Menyebarkan gosip tentang tetangga.'},
 {'k':'Konflik','v':'Pertentangan terbuka untuk menundukkan lawan.','w':'Sengketa lahan antar desa.'}])
add('contoh',teks='Contoh terpecah langkah — membaca kasus. Soal: "Kakak membeli alat makan karena melihat iklan dan diskon tinggi." Faktor interaksi mana yang bekerja? Langkah 1: ada pemberian pandangan oleh iklan -> bukan tiruan langsung (imitasi). Langkah 2: penerimaan pandangan tanpa analisis = SUGESTI. Langkah 3: singkirkan empati/simpati (tak ada perasaan pihak lain) & identifikasi (tak ingin menjadi iklan). Jawaban: sugesti (kunci bank A).')
add('judul',teks='B. Tindakan Sosial Max Weber: Empat Motif di Balik Perbuatan')
add('paragraf',teks='Tidak semua gerakan tubuh adalah tindakan sosial. Menurut Max Weber, tindakan disebut sosial bila dilakukan dengan MEMAKNAI kehadiran orang lain. Empat motifnya: rasional instrumental (memperhitungkan cara-tujuan-manfaat), rasional berorientasi nilai (bertindak demi nilai yang diyakini), tradisional (adat/kebiasaan), dan afeksi (dorongan emosi spontan).')
add('tabelinfo',judul='Empat tindakan sosial Weber',kolom=['Tindakan','Pemicu','Contoh'],rows=[
 {'k':'Rasional instrumental','v':'Memperhitungkan kesesuaian cara, tujuan, dan manfaat.','w':'Kakak belajar sungguh-sungguh untuk lulus di PTN favorit.'},
 {'k':'Rasional berorientasi nilai','v':'Demi nilai yang diyakini, hasil sekunder.','w':'Adik membeli sepatu baru karena murah DAN berkualitas (nilai hemat+mutu).'},
 {'k':'Tradisional','v':'Adat/kebiasaan yang berulang.','w':'Membungkuk saat menyapa orang tua.'},
 {'k':'Afeksi','v':'Emosi/perasaan spontan.','w':'Marah atau kasih sayang tanpa rencana.'}])
add('contoh',teks='Contoh terpecah langkah — mengelompokkan tindakan. Soal: "Semua masyarakat tentu bertindak berbeda-beda; manakah yang termasuk tindakan sosial Weber?" (bank #12, jawaban lebih dari satu). Langkah 1: cek tiap baris terhadap empat motif: memperhitungkan manfaat (instrumental) = B; dorongan emosional (afeksi) = B; cara memengaruhi orang lain = BUKAN kategori tindakan Weber (itu definisi komunikasi/sugesti) = S; kesesuaian cara-tujuan (instrumental) = B. Kunci bank: B, B, B, S.')
add('judul',teks='C. Nilai Sosial: Standar yang Langgeng')
add('paragraf',teks='Nilai (value) adalah hal yang dianggap berharga untuk mengukur kualitas keputusan dan tindakan — menurut Clyde Kluckhohn: standar yang langgeng dari waktu ke waktu. Ciri nilai: menjadi pedoman bertingkah laku, bisa menimbang/menghargai, langsung dirasakan masyarakat. Prof. Notonagoro membagi tiga: nilai material (jasmani), nilai vital (bermanfaat untuk aktivitas), nilai rohani (kerohanian: kebenaran, keindahan, moral, religi).')
add('tabelinfo',judul='Tiga nilai Notonagoro',kolom=['Nilai','Untuk','Contoh'],rows=[
 {'k':'Material','v':'Kebutuhan jasmani.','w':'Makan, minum, pakaian.'},
 {'k':'Vital','v':'Menunjang aktivitas/pekerjaan.','w':'Kendaraan, alat kerja.'},
 {'k':'Rohani','v':'Kebutuhan jiwa/batin.','w':'Ibadah, kejujuran, keindahan seni.'}])
add('contoh',teks='Contoh terpecah langkah — memilih jenis nilai. Soal: "Manusia membutuhkan nilai sosial dan norma agar hidup terarah; manakah jenis nilai menurut Notonagoro?" (bank #13, jawaban lebih dari satu). Langkah 1: nilai kerohanian = rohani (B). Langkah 2: nilai material = jasmani (B). Langkah 3: "nilai dominan" & "nilai mendarah daging" bukan istilah Notonagoro (S). Kunci bank: A, C, D (kerohanian, material, vital).')
add('judul',teks='D. Norma Sosial: Nilai yang Memakai Gigi')
add('paragraf',teks='Nilai masih abstrak; NORMA adalah wujud nyatanya yang memakai "gigi" pengendali: menurut Soerjono Soekanto, bentuk nyata dari nilai sosial yang bermanfaat sebagai alat pengendali sosial. Ciri norma: ada SANKSI bagi pelanggar, mengatur masyarakat, mengikat. Jenisnya: norma agama, kesusilaan (hati nurani), kesopanan (pergaulan), adat istiadat, dan hukum.')
add('paragraf',teks='Daya ikat norma bertingkat seperti tangga: dari yang paling ringan (cara/usage) sampai yang paling keras (hukum/law). Bagan tangga berikut adalah penunjang tim Gemilang — hafalkan urutan dan satu contoh tiap anak tangganya.')
add('gambar',url=U+'sos2-tangga-norma.png',keterangan='Bagan tangga lima anak menaik dari kiri ke kanan berlabel: 1 cara (usage) contoh menerima kasih sayang; 2 kebiasaan (folkways) contoh memberi salam kepada orang tua; 3 tata kelakuan (mores) contoh setia dalam pernikahan; 4 adat istiadat (customs) contoh upacara adat pernikahan; 5 hukum (law) contoh UUD 1945 tentang pelanggaran lalu lintas; anak tangga makin tinggi menggambarkan daya ikat dan sanksi makin kuat.')
add('poin',judul='🔍 Membaca gambar — tangga daya ikat',items=[
 'Cara (usage): perbuatan pribadi yang bisa diterima maupun ditegur ringan — mis. cara mengucapkan terima kasih.',
 'Kebiasaan (folkways): perbuatan berulang-ulang — mis. memberi salam kepada orang tua.',
 'Tata kelakuan (mores): kebiasaan bernilai moral tinggi — mis. setia dalam pernikahan.',
 'Adat istiadat (customs): aturan kuat mengikat tradisi masyarakat — mis. upacara adat pernikahan.',
 'Hukum (law): tertulis & resmi, sanksi tegas — mis. UUD/undang-undang lalu lintas.'])
add('tabelinfo',judul='Jenis norma & wilayah kerjanya',kolom=['Norma','Sumber','Contoh pelanggaran & sanksi'],rows=[
 {'k':'Agama','v':'Wahyu Tuhan; mutlak.','w':'Tidak beribadah -> dosa.'},
 {'k':'Kesusilaan','v':'Hati nurani manusia.','w':'Berbohong -> perasaan bersalah.'},
 {'k':'Kesopanan','v':'Pergaulan sehari-hari.','w':'Memotong pembicaraan -> ditegur.'},
 {'k':'Adat istiadat','v':'Tradisi masyarakat.','w':'Melanggar upacara -> sanksi adat.'},
 {'k':'Hukum','v':'Lembaga resmi, tertulis.','w':'Melanggar lalu lintas -> denda/penjara.'}])
add('contoh',teks='Contoh terpecah langkah — menempatkan kasus pada tingkat norma. Soal: "Mengucapkan terima kasih kepada orang lain karena telah membantunya termasuk tingkatan norma sosial ...." Langkah 1: perbuatan pribadi sekali waktu, bukan tradisi = cara (usage). Langkah 2: bukan kebiasaan berulang (folkways) apalagi hukum. Jawaban: cara/usage (kunci bank E).')
add('callout',tipe='gemilang',judul='Rumus Cepat Gemilang',teks='Interaksi = kontak + komunikasi; faktor = Su-Im-Mo-Em-Si-Id (Sugesti, Imitasi, Motivasi, Empati, Simpati, Identifikasi); bentuk = A-A-A-A vs K-K-K (asosiatif: kerja sama, Akomodasi, Asimilasi, Akulturasi; disosiatif: Kompetisi, Kontravensi, Konflik); norma = tangga U-K-T-A-H (Usage, folkKways, moTres... hafalkan: Usage-Folkways-Mores-Customs-Law).')
add('callout',tipe='guru',judul='Catatan pengajaran',teks='Mode live: minta siswa memberi satu contoh dari kehidupannya untuk tiap anak tangga norma (cara s.d. hukum) — lempar sebagai kuis cepat. Kesalahan klasik siswa: menukar kontravensi dengan konflik; tekankan kata kunci "tersembunyi vs terbuka".')
d={'materi':{'judul':'Sosiologi SMA — Persiapan TKA 2026','mapel':'Sosiologi','kelas':'','jenjang':'sma','program':'semua','premium':False,'warna':'#0EA5E9','emoji':'🧭','deskripsi':'Materi Sosiologi VERSI DALAM persiapan TKA 2026 berbasis bank Sukses TKA 26 Sosiologi (@my99dreams): bab 2 = interaksi sosial (syarat, faktor, bentuk), tindakan sosial Max Weber, nilai sosial (Kluckhohn & Notonagoro), norma sosial (jenis & tangga daya ikat). Terbuka semua kelas/program.','urutan':7,'status':'draft',
 'daftarPustaka':[
  'Bank Soal Sukses TKA 26 Sosiologi (@my99dreams) — 02 "Interaksi Sosial, Nilai Sosial, dan Norma Sosial" hlm. 155-158: BASIS materi & 25 latihan bab 2; kunci & pembahasan DETAIL diverifikasi dari 08 "Kunci dan Pembahasan" hlm. 94-95.',
  'Bagan tangga daya ikat norma = penunjang orisinal tim kurikulum Gemilang (berlabel penunjang), isi mengikuti urutan usage-folkways-mores-customs-law dari bank.',
  'Potret tokoh & visual lain mengikuti bab 1 (domain publik via Wikimedia Commons).']},
 'bab':[{'judul':'Bab 2 — Interaksi Sosial, Nilai Sosial, dan Norma Sosial','ringkasan':'Masyarakat hidup karena interaksi: kontak + komunikasi yang dipengaruhi sugesti s.d. identifikasi dan berbentuk asosiatif atau disosiatif. Interaksi diatur nilai (standar langgeng: material, vital, rohani) yang mewujud menjadi norma bertangga daya ikat (cara s.d. hukum). Bab ini memberi kunci membaca kasus: syarat, faktor, bentuk, jenis nilai, tingkat norma.','estimasiMenit':75,'urutan':2,'tipe':'teks','sections':S,'ujiPemahaman':[]}]}
json.dump(d,open('docs/drafts/draft-sosiologi-k12-v1-bab2.json','w'),ensure_ascii=False,indent=2)
print('sections bab2:',len(S))
