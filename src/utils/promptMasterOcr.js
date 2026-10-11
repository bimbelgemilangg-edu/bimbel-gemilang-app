// src/utils/promptMasterOcr.js
// ============================================================
// Aturan tambahan prompt HTML Master untuk dokumen hasil SCAN BUKU/OCR.
//
// 🔥 KENAPA DIPISAH KE UTIL (bukan ditulis langsung di halaman impor):
// prompt adalah kontrak dengan model di luar kendali kita. Kalau ia berubah,
// keluaran Gemini ikut berubah secara halus dan kerusakan barunya baru
// kelihatan setelah admin mengimpor ratusan soal. Karena itu aturannya
// dikunci test (tests/promptMasterOcr.test.mjs) — pola yang sama dengan
// promptPatenGemini.js. Util ini juga tidak menambah serverless function
// (kuota Vercel sudah 12/12), jadi aman dari sisi arsitektur.
//
// Setiap butir di bawah lahir dari kerusakan NYATA pada berkas owner,
// bukan dari asumsi:
//   - opsi E soal 40 kemasukan teks bacaan soal 41-42 (bocor lintas kolom)
//   - pembahasan soal 40 hancur ("<{_", "perem juan ya menich ¢ di")
//   - baris "Jawaba'", "Jawabat", "= Jawaban f" (penutup jawaban putus)
//   - opsi ikut tertulis di dalam teks soal (soal 2, 12, 15, 34, 35)
//   - kepala tabel dua baris (soal 40) kehilangan nama kolomnya
// ============================================================

export const ATURAN_OCR_MASTER = `

## ATURAN KHUSUS DOKUMEN HASIL SCAN / FOTO BUKU (WAJIB DIBACA SAMPAI HABIS)

Dokumen yang dipindai dari buku dua kolom hampir selalu membawa cacat OCR.
Tugasmu BUKAN menutupi cacat itu, melainkan: (a) menyalin apa yang benar-benar
terbaca, (b) menata ulang struktur yang berantakan, (c) MENANDAI yang tidak
terbaca supaya guru tahu apa yang harus diperiksa. Satu aturan emas:
==jangan pernah menyambung kata yang putus dengan tebakan tanpa tanda==.

21. KATA TERPOTONG POTONGAN KOLOM (ciri: kalimat berhenti di tengah kata,
    mis. "berbunc", "menerir", "pant", "menyimpan data besar Cdilengkapi").
    - SALIN APA ADANYA di field yang benar. JANGAN menyambung/melengkapi kata
      itu secara diam-diam, dan JANGAN membuang barisnya.
    - WAJIB tambahkan <div data-field="catatan_admin">Kata terpotong OCR:
      "..." (dugaan: "...") — cek buku asli halaman ...</div>. Dugaan boleh
      ditulis HANYA di dalam catatan_admin, tidak pernah di dalam teks soal,
      opsi, atau pembahasan yang dibaca siswa.
    - Kalau potongan itu membuat SOAL TIDAK BISA DIJAWAB (mis. seluruh premis
      hilang), kosongkan kunci_jawaban, isi kunci_terverifikasi="false", dan
      tulis di catatan_admin apa yang hilang.

22. TEKS SALAH KAMAR (bocor lintas kolom): tulisan milik soal/bagian lain yang
    ikut tercetak di dalam opsi, teks soal, atau pembahasan.
    - KEMBALIKAN ke tempat asalnya (mis. potongan wacana batik yang menempel di
      opsi E soal 40 dikembalikan ke <div data-field="bacaan"> soal 41-42),
      lalu HAPUS dari tempat yang salah.
    - Opsi yang jadi pendek akibatnya TIDAK BOLEH dibiarkan menggantung:
      lengkapi dari naskah opsi yang benar bila terbaca di tempat lain pada
      sumber; bila tidak terbaca, tulis di catatan_admin "opsi E terpotong,
      lanjutan tidak terbaca di sumber".
    - Jangan pernah membuang teks hanya karena posisinya aneh.

23. OPSI HANYA DI DALAM <ol data-field="opsi_jawaban">. Sumber OCR sering
    mencetak daftar opsi DUA KALI: sekali sebagai (A)...(E) di kolom soal dan
    sekali terbawa ke dalam paragraf teks soal. Kalau itu terjadi, teks_soal
    HARUS dibersihkan dari salinan opsi tersebut (sisakan kalimat pertanyaannya
    saja) dan kelima opsi ditulis utuh di <li>.

24. KODE SUMBER SOAL WAJIB JADI BARIS PERTAMA. Kode seperti
    [SNMPTN 2010/TPA/942/17], [SBMPTN 2019/UTBK I/TPS/PU/01],
    [UTBK2024/TPS/PU/GEL.1/4] ditulis apa adanya di:
    - baris pertama <div data-field="teks_soal">, dibungkus <p><strong>...</strong></p>
    - baris pertama <div data-field="pembahasan">
    Sistem memakai kode ini sebagai sidik jari soal (chip 📖) dan untuk
    mendeteksi pembahasan yang tertukar antar nomor. Kalau kode sumbernya
    hilang, soal kehilangan asal-usulnya dan tidak bisa diaudit.

25. PEMBAHASAN HARUS SATU BARIS PER LANGKAH, seperti tata letak buku. Pakai
    <br/> atau <p> per baris; JANGAN merangkumnya jadi satu paragraf panjang.
    Urutan baku buku sumber:
      baris 1  : kode sumber (lihat aturan 24)
      baris 2+ : premis/kutipan soal
      lalu     : baris rumus/kuantor ("Semua A, B", "Sebagian B, C",
                 "Premis 1 : p>q", "Rumus :", "PU:", "PK:", "K:")
      lalu     : "Kesimpulan : ..."
      terakhir : "Jawaban: X"
    Sistem merender baris-baris itu bergaya buku (rumus jadi blok, kesimpulan
    bergaris, jawaban tebal rata kanan). Bila semuanya kamu gabung jadi satu
    paragraf, tampilan siswa tidak akan pernah sama dengan buku.

26. PENUTUP "Jawaban: X" WAJIB ADA di setiap pembahasan dan hurufnya HARUS
    sama dengan kunci_jawaban soal itu. JANGAN menulis penutup yang putus atau
    rusak ("Jawaba", "Jawabat", "Jawaban |", "= Jawaban f", "c Jawaban #") —
    itu cacat OCR sumber, bukan sesuatu yang perlu dilestarikan.

27. PEMBAHASAN SUMBER YANG HANCUR OCR (mis. "<{_ Tips menentukan...",
    "Premis 1: *Semua perem juan ya menich ¢ di", "fanaa", "ifn cet iai Re"):
    JANGAN menyalin fragmen rusak itu apa adanya ke field pembahasan — siswa
    akan membaca sampah. Tulis ulang penjelasannya sebagai guru yang
    menerangkan soal itu langkah demi langkah (tetap memakai kunci jawaban
    sumber, jangan mengganti kunci), lalu tandai:
      <meta data-field="kunci_terverifikasi" data-value="true" />  (kunci tetap dari sumber)
      <div data-field="catatan_admin">Pembahasan sumber rusak OCR; penjelasan
      ditulis ulang dari isi soal. Cek tentor terhadap buku asli sebelum soal
      dipakai try out bernilai.</div>

28. TABEL disalin sebagai <table> di <div data-field="tabel_soal"> dengan
    rowspan/colspan APA ADANYA (kepala tabel dua baris seperti
    "Tahun" rowspan=2 | "Daerah Tempat Tinggal" colspan=2 harus tetap begitu —
    sistem membaca kepala per kolom). Jangan membuang baris/kolom terakhir
    tabel, dan jangan mengubah tabel menjadi kalimat yang kehilangan pasangan
    kolomnya.

29. GAMBAR/GRAFIK yang disebut teks ("Gambar 1 menyajikan data ...") tapi tidak
    terbaca/tidak bisa diisolasi: sertakan screenshot SATU HALAMAN PENUH
    sebagai fallback (lihat aturan 3) dan tulis di catatan_admin bahwa gambar
    itu perlu di-crop manual. JANGAN mengarang angka, label, atau bentuk
    grafiknya.

30. CEK MANDIRI SEBELUM MENGEMBALIKAN DOKUMEN (per nomor, bukan seluruh file sekaligus):
    a. teks_soal punya kalimat pertanyaan/perintah yang UTUH (tidak berhenti di
       tengah kata) — kecuali soalnya memang berbentuk premis silogisme;
    b. jumlah <li> opsi sesuai sumber (5 untuk A-E) dan tidak ada opsi yang
       terpotong;
    c. ada kunci_jawaban dan pembahasan yang ditutup "Jawaban: X";
    d. bacaan bersama disalin IDENTIK di semua soal segrup (data-grup sama);
    e. tabel/gambar/kode sumber tidak ada yang hilang;
    f. TIDAK ADA penanda scan di field mana pun: tidak ada "=== PAGE ... ===",
       tidak ada baris watermark/slogan berkas, tidak ada baris yang hanya
       berisi nomor urut, tidak ada garis pemisah kolom (aturan 31);
    g. TIDAK ADA <li> opsi yang memuat lebih dari teks opsinya sendiri: tidak
       ada wacana, tidak ada kode sumber nomor lain, tidak ada kalimat milik
       nomor berikutnya (aturan 33);
    h. setiap nomor yang menyebut "paragraf/bacaan/teks/puisi tersebut" punya
       <div data-field="bacaan"> yang TIDAK kosong (aturan 20 & 33);
    i. kode sumber di baris pertama pembahasan SAMA PERSIS dengan kode di
       baris pertama teks_soal untuk nomor yang sama (aturan 34) — bila
       berbeda, pembahasan itu milik nomor lain dan wajib dilepas;
    j. setiap baris logika silogisme memakai panah "→" dan tumpukannya
       punya garis inferensi "—————" sebelum baris kesimpulan (aturan 35).
    Soal yang tidak bisa memenuhi poin-poin itu JANGAN diloloskan diam-diam:
    tulis <div data-field="catatan_admin"> yang menjelaskan apa yang kurang,
    supaya guru tahu persis apa yang harus diperiksa.

31. PENANDA SCAN DILARANG MASUK KELUARAN. Berkas hasil scan membawa perancah
    yang BUKAN isi buku, dan semuanya wajib dilewati TANPA disalin ke field
    mana pun (juga ke catatan_admin):
    - penanda halaman/kolom pemindai: "=== PAGE 3 COL 1 ===",
      "=== PAGE 8 COL 2 ===", termasuk nomor urut yang ikut terseret di
      belakangnya ("=== PAGE 7 COL 1 === 31 32. 33.");
    - watermark/slogan berkas sumber, mis. "BELAJAR MINIMAL," /
      "HASIL MAKSIMAL" dan varian salah-bacanya ("BELAJAR WINIMAL",
      "HBSIL MAKSIMAL");
    - nomor urut kolom sebelah yang lepas jadi baris sendiri: "12.", "13.",
      "35,", "24, 25 26.";
    - garis sampah pemisah kolom: "————EEE", "-----", dan sejenisnya.
    Kalau perancah itu MENIMPA atau memutus isi (mis. satu kata hilang karena
    tertimpa penanda), salin isi yang terbaca dan tulis catatan_admin —
    tetapi perancahnya sendiri tetap tidak boleh ikut tersalin.

32. DISIPLIN URUTAN KOLOM (akar dari hampir semua bocor lintas kolom).
    Baca dokumen KOLOM PER KOLOM: habiskan kolom pertama dari atas ke bawah
    SEBELUM menyentuh kolom kedua; jangan pernah menyelang-nyeling.
    - Kalimat yang terpotong di TEPI BAWAH sebuah kolom dilanjutkan di PUNCAK
      kolom berikutnya, bukan di tengah-tengahnya.
    - Baris-baris pertama kolom berikutnya TIDAK BOLEH ditempelkan ke opsi,
      teks soal, atau pembahasan terakhir kolom sebelumnya -- ini persis
      cara wacana batik masuk ke opsi E dan cara nomor urut kolom sebelah
      masuk ke pembahasan.
    - Bila ragu suatu fragmen milik nomor mana, tempelkan fragmen itu ke
      nomor terdekat yang kalimatnya belum lengkap, DAN tulis catatan_admin
      "fragmen kolom belum pasti pemiliknya".

33. WACANA TIDAK BOLEH MENGINAP DI OPSI ATAU TEKS_SOAL.
    Bila di aliran scan terlihat potongan PANJANG (lebih dari kira-kira 500
    karakter, atau dua paragraf lebih, atau diawali "Teks berikut"/"Perhatikan
    teks/bacaan") menempel pada sebuah <li> opsi atau pada teks_soal, hampir
    pasti itu WACANA BERSAMA milik nomor-nomor sesudahnya, bukan bagian dari
    opsi itu: pindahkan ke <div data-field="bacaan" data-grup="bacaan_N"
    data-rentang-soal="A-B"> di SETIAP soal yang memakainya (aturan 20), lalu
    HAPUS dari opsi/teks_soal tempat ia menempel.
    Satu <li> opsi hanya boleh memuat teks opsi itu sendiri (lazimnya satu
    kalimat); ia tidak boleh memuat wacana, kode sumber nomor lain
    ([SNMPTN ...], [UTBK ...]), atau kalimat milik nomor berikutnya.

35. BARIS LOGIKA SILOGISME WAJIB PAKAI PANAH "→" DAN GARIS INFERENSI.
    Tumpukan penarikan kesimpulan ditulis PERSIS seperti buku, satu baris
    per implikasi, dengan garis pemisah sebagai baris tersendiri sebelum
    baris kesimpulan:
        p → q
        q → r
        —————
        p → r
    Panah memakai karakter "→" (atau $p \\rightarrow q$ bila perlu LaTeX).
    DILARANG mengeluarkan bentuk rusak OCR seperti "p-q", "p>q", "pq",
    "por", "q7rT" — bila sumber tercetak rusak begitu, KEMBALIKAN ke bentuk
    kanonik di atas. Ini pengecualian tunggal atas aturan "jangan
    memperbaiki teks": mengembalikan simbol panah yang hilang tidak
    mengubah makna satu pun pernyataan, hanya membuat guru bisa membaca
    penarikan kesimpulannya seperti di buku.

34. PEMBAHASAN WAJIB BERSIDIK JARI SAMA DENGAN SOALNYA.
    Kode sumber (aturan 24) dicetak buku di kepala soal DAN di kepala
    pembahasan, jadi ia adalah SIDIK JARI yang membuktikan penjelasan itu
    milik nomor yang mana. Sebelum menempel pembahasan ke sebuah nomor:
    - bandingkan kodenya; [UTBK2024/TPS/PU/GEL.2/63] di teks_soal WAJIB
      bertemu kepala pembahasan [UTBK2024/TPS/PU/GEL.2/63] juga;
    - bila kode pembahasan milik nomor lain (kasus nyata: tiga nomor
      berurutan mendapat pembahasan yang berputar -- 63 mendapat 69, 65
      mendapat 63, 69 mendapat 65), itu PEMBAHASAN TERTUKAR: JANGAN
      ditempel ke soal itu. Cari dulu pembahasan yang sidik jarinya cocok
      di tempat lain pada sumber; bila ketemu, pakai yang cocok itu;
    - bila tidak ketemu, tulis penjelasan sendiri sebagai guru yang
      menerangkan (aturan 27, kunci tetap dari sumber) dan tulis
      <div data-field="catatan_admin">Pembahasan sumber tertukar antar
      nomor; penjelasan ditulis ulang dari isi soal.</div>.
    Sistem menolak otomatis soal yang sidik jari soal dan pembahasannya
    tidak cocok, jadi menempelkan pembahasan tertukar hanya membuang
    waktu impor orang lain.

36. TANGGA PEMBAHASAN (WAJIB BERURUT — pembahasan adalah bagian yang paling
    berbahaya bila dikarang, sebab siswa DAN guru belajar menalar dari sini).
    Untuk SETIAP nomor, turuni tangga ini BERURUT dan akui anak tangga mana
    yang kamu pakai:
    (1) TERCETAK. Sumber memuat pembahasan -> salin apa adanya (aturan 25-27)
        dan tulis <meta data-field="asal_pembahasan" data-value="tercetak" />.
    (2) TERCETAK TAPI BERCAMPUR DIAGRAM. Pembahasan tercetak memuat diagram/
        grafik/sketsa yang tidak bisa dipertahankan sebagai teks -> salin
        TEKSnya apa adanya, dan untuk diagramnya pakai mekanisme potongan:
        <div data-field="catatan_admin">DIAGRAM PEMBAHASAN perlu dipotong:
        halaman <n>, posisi <...>, isi <deskripsi lengkap figur></div>.
        JANGAN menggambarnya ulang.
    (3) TIDAK ADA DI SUMBER. Tidak semua soal punya pembahasan, dan itu
        BUKAN alasan untuk mengarang seolah tercetak. Tulis penjelasan
        sendiri sebagai guru yang menerangkan langkah demi langkah (kunci
        tetap dari sumber; bila kunci pun tidak tercetak, kosongkan
        kunci_jawaban dan set kunci_terverifikasi="false"), lalu WAJIB
        tandai dua hal:
          <meta data-field="asal_pembahasan" data-value="penalaran" />
          baris pertama pembahasan: "PEMBAHASAN PENALARAN AI:"
        Sistem membaca penanda itu: menampilkan bendera "hasil penalaran AI
        — periksa dulu" di semua layar dan memasukkan soal ke antrean
        review tentor. Jangan pernah menyembunyikan perbedaan ini.
    DILARANG MEMBUAT GAMBAR ATAU SKETSA RASTER dalam bentuk apa pun (base64,
    SVG bikinan, "ilustrasi") untuk pembahasan maupun soal — sketsa yang
    salah lebih berbahaya daripada tanpa sketsa, karena ia terlihat
    meyakinkan. Bila visual benar-benar membantu, satu-satunya bentuk yang
    diizinkan adalah DESKRIPSI SKETSA untuk guru, di catatan admin:
      <div data-field="catatan_admin">SKETSA AI: <deskripsi verbal yang bisa
      diguru gambarkan di papan, mis. "dua lingkaran beririsan, lingkaran
      luar = A, irisan = B"> — bukan gambar sumber, verifikasi dulu.</div>
    Deskripsi itu hanya terlihat guru; TIDAK boleh masuk teks_soal, opsi,
    maupun pembahasan yang dibaca siswa.
`;

export default ATURAN_OCR_MASTER;
