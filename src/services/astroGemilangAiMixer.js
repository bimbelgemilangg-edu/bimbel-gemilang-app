// src/services/astroGemilangAiMixer.js
// ==============================================================================
// ASTRO GEMILANG AI MIXER & SILABUS MANAGER
// Mesin Kurasi, Pemetaan Hierarki Bab & Sub-Materi, serta Pembangkit Soal HOTS
// Otomatis memadukan (mix) arsip soal asli TKA dengan soal pengayaan HOTS
// berstandar TKA 2026/2027 sehingga tentor selalu mendapatkan 10 butir lengkap!
// ==============================================================================

import { normalisasiButir, aiGuardPolicingAndHeal } from '../data/ambisLatihanBankSoal.js';

// ==============================================================================
// 1. POHON SILABUS RESMI TERSTANDARISASI (BAB UTAMA & SUB-MATERI)
// ==============================================================================

export const SILABUS_RESMI_SMP = {
  Matematika: [
    {
      babNomor: 1,
      namaBab: 'Bab 1 · Bilangan (Operasi, Pecahan, Pangkat & Notasi Ilmiah)',
      ringkas: 'Bab 1: Bilangan',
      icon: '🔢',
      deskripsi: 'Sifat bilangan real, KaBaTaKu, skor kompetisi, eksponen, akar sekawan, dan notasi ilmiah.',
      subMateriList: [
        {
          id: 'semua',
          label: '🎯 Semua Sub-Materi Bilangan',
          kataKunci: ['bilangan', 'pecahan', 'pangkat', 'akar', 'fpb', 'kpk', 'notasi', 'aritmetika'],
        },
        {
          id: 'sifat_real',
          label: '🔢 Jenis & Sifat Bilangan Real',
          kataKunci: ['bilangan real', 'bilangan rasional', 'bilangan irasional', 'garis bilangan', 'sifat bilangan', 'bilangan bulat', 'desimal', 'kepadatan', 'asosiatif', 'distributif'],
        },
        {
          id: 'operasi_cerita',
          label: '📝 Operasi Hitung & Cerita Penskoran',
          kataKunci: ['penskoran', 'skor olimpiade', 'suhu daging', 'suhu freezer', 'kabataku', 'operasi campuran', 'termometer', 'ujian benar-salah', 'olimpiade matematika'],
        },
        {
          id: 'pangkat_notasi',
          label: '⚡ Bilangan Berpangkat & Notasi Ilmiah',
          kataKunci: ['berpangkat', 'pangkat', 'eksponen', 'notasi ilmiah', 'baku', 'daya dan energi', 'watt', 'baterai', 'panel surya', 'operasi bilangan berpangkat'],
        },
        {
          id: 'bentuk_akar',
          label: '🌿 Bentuk Akar & Merasionalkan Penyebut',
          kataKunci: ['bentuk akar', 'merasionalkan', 'akar', 'sekawan', 'penyebut', '\\sqrt', 'merasionalkan penyebut', 'rasional'],
        },
        {
          id: 'fpb_kpk',
          label: '🧮 Faktorisasi Prima, FPB & KPK',
          kataKunci: ['fpb', 'kpk', 'faktor persekutuan', 'kelipatan', 'faktorisasi prima', 'paket sembako', 'bantuan'],
        },
        {
          id: 'aritmetika_sosial',
          label: '🏷️ Aritmetika Sosial (Diskon, Pajak & Bunga)',
          kataKunci: ['diskon', 'promo', 'untung', 'rugi', 'pajak', 'bunga', 'harga beli', 'harga jual', 'bruto', 'tara', 'netto', 'laba'],
        },
        {
          id: 'perbandingan',
          label: '⚖️ Perbandingan Senilai & Berbalik Nilai',
          kataKunci: ['perbandingan', 'senilai', 'berbalik nilai', 'skala', 'sewa villa', 'pekerja', 'kecepatan', 'jarak'],
        },
      ],
    },
    {
      babNomor: 2,
      namaBab: 'Bab 2 · Aljabar (SPLDV, Persamaan Kuadrat, Fungsi & Pola Bilangan)',
      ringkas: 'Bab 2: Aljabar & Relasi',
      icon: '📐',
      deskripsi: 'Operasi suku aljabar, pemfaktoran, PLSV/PtLSV, SPLDV parkir/belanja, fungsi kuadrat, dan deret.',
      subMateriList: [
        {
          id: 'semua',
          label: '🎯 Semua Sub-Materi Aljabar',
          kataKunci: ['aljabar', 'spldv', 'plsv', 'ptlsv', 'kuadrat', 'fungsi', 'relasi', 'pola bilangan', 'deret', 'himpunan'],
        },
        {
          id: 'bentuk_aljabar',
          label: '🔤 Bentuk Aljabar & Pemfaktoran',
          kataKunci: ['bentuk aljabar', 'suku sejenis', 'pemfaktoran', 'faktorisasi aljabar', 'koefisien', 'variabel', 'konstanta'],
        },
        {
          id: 'plsv_ptlsv',
          label: '⚖️ PLSV & Pertidaksamaan Linear (PtLSV)',
          kataKunci: ['plsv', 'persamaan linear satu variabel', 'pertidaksamaan linear', 'ptlsv', 'nilai x', 'himpunan penyelesaian'],
        },
        {
          id: 'spldv',
          label: '🚗 SPLDV (Tarif Parkir & Sistem Belanja)',
          kataKunci: ['spldv', 'parkir', 'mobil dan motor', 'dua variabel', 'eliminasi', 'substitusi', 'retribusi parkir'],
        },
        {
          id: 'fungsi_kuadrat',
          label: '📈 Persamaan Kuadrat & Fungsi',
          kataKunci: ['kuadrat', 'persamaan kuadrat', 'akar-akar kuadrat', 'diskriminan', 'titik puncak', 'sumbu simetri'],
        },
        {
          id: 'relasi_fungsi',
          label: '🔗 Relasi & Fungsi Linear',
          kataKunci: ['relasi', 'fungsi linear', 'domain', 'kodomain', 'range', 'bayangan', 'grafik fungsi', 'diagram panah'],
        },
        {
          id: 'pola_deret',
          label: '🪜 Pola Bilangan & Deret Aritmetika',
          kataKunci: ['pola bilangan', 'barisan', 'deret', 'aritmatika', 'korek api', 'kursi gedung', 'gedung pertunjukan'],
        },
        {
          id: 'himpunan_venn',
          label: '⭕ Himpunan & Diagram Venn',
          kataKunci: ['himpunan', 'diagram venn', 'irisan', 'gabungan', 'komplemen', 'semesta', '∩', '∪'],
        },
      ],
    },
    {
      babNomor: 3,
      namaBab: 'Bab 3 · Geometri & Pengukuran (Sudut, Pythagoras, Ruang & Transformasi)',
      ringkas: 'Bab 3: Geometri & Ruang',
      icon: '📏',
      deskripsi: 'Sudut garis, tripel Pythagoras, keliling/luas gabungan, kesebangunan, volume bangun ruang, dan refleksi.',
      subMateriList: [
        {
          id: 'semua',
          label: '🎯 Semua Sub-Materi Geometri',
          kataKunci: ['geometri', 'sudut', 'pythagoras', 'bangun datar', 'bangun ruang', 'transformasi', 'balok', 'limas', 'tabung'],
        },
        {
          id: 'sudut_pythagoras',
          label: '📐 Sudut & Teorema Pythagoras',
          kataKunci: ['garis', 'sudut', 'pelurus', 'penyiku', 'pythagoras', 'tripel pythagoras', 'sisi miring', 'hipotenusa'],
        },
        {
          id: 'bangun_datar',
          label: '🖼️ Keliling & Luas Bangun Datar Gabungan',
          kataKunci: ['bangun datar', 'keliling gabungan', 'luas arsir', 'persegi', 'segitiga', 'trapesium', 'lingkaran', 'belah ketupat'],
        },
        {
          id: 'kongruen_sebangun',
          label: '👥 Kekongruenan & Kesebangunan',
          kataKunci: ['kongruen', 'sebangun', 'kesebangunan', 'foto dan karton', 'bayangan tiang', 'lebar sungai'],
        },
        {
          id: 'ruang_sisi_datar',
          label: '📦 Bangun Ruang Sisi Datar (Balok, Kubus, Limas)',
          kataKunci: ['balok', 'kubus', 'prisma', 'limas', 'monumen', 'jaring-jaring', 'volume gabungan balok'],
        },
        {
          id: 'ruang_sisi_lengkung',
          label: '🥫 Bangun Ruang Sisi Lengkung (Tabung, Kerucut, Bola)',
          kataKunci: ['tabung', 'kerucut', 'bola', 'semangka', 'minyak', 'tenda kerucut', 'volume bola'],
        },
        {
          id: 'transformasi',
          label: '🔄 Transformasi Geometri (Refleksi & Rotasi)',
          kataKunci: ['transformasi', 'refleksi', 'translasi', 'rotasi', 'dilatasi', 'koordinat bayangan'],
        },
      ],
    },
    {
      babNomor: 4,
      namaBab: 'Bab 4 · Data & Peluang (Statistika, Diagram & Peluang Teoretik)',
      ringkas: 'Bab 4: Data & Peluang',
      icon: '📊',
      deskripsi: 'Penyajian diagram batang/lingkaran, rata-rata gabungan, median, kuartil, dan peluang teoretik dadu/koin.',
      subMateriList: [
        {
          id: 'semua',
          label: '🎯 Semua Sub-Materi Data & Peluang',
          kataKunci: ['statistika', 'diagram', 'peluang', 'rata-rata', 'median', 'modus', 'kuartil'],
        },
        {
          id: 'diagram_tabel',
          label: '📊 Penyajian Data (Tabel & Diagram Batang/Lingkaran)',
          kataKunci: ['diagram batang', 'diagram lingkaran', 'tabel frekuensi', 'grafik', 'penjualan', 'tinggi badan'],
        },
        {
          id: 'ukuran_pemusatan',
          label: '🎯 Ukuran Pemusatan (Mean, Median, Modus)',
          kataKunci: ['rata-rata', 'mean', 'median', 'modus', 'nilai gabungan', 'nilai rata-rata siswa', 'ulangan'],
        },
        {
          id: 'ukuran_penyebaran',
          label: '📉 Ukuran Penyebaran (Jangkauan & Kuartil)',
          kataKunci: ['jangkauan', 'kuartil', 'q1', 'q3', 'interkuartil', 'box plot'],
        },
        {
          id: 'peluang_teoretik',
          label: '🎲 Peluang Teoretik & Ruang Sampel',
          kataKunci: ['peluang teoretik', 'dadu', 'koin', 'kartu bridge', 'titik sampel', 'ruang sampel', 'kantong kelereng'],
        },
        {
          id: 'peluang_empirik',
          label: '🎯 Peluang Empirik & Frekuensi Relatif',
          kataKunci: ['peluang empirik', 'frekuensi relatif', 'lemparan bebas', 'percobaan', 'rasio keberhasilan'],
        },
      ],
    },
  ],

  'Bahasa Indonesia': [
    {
      babNomor: 1,
      namaBab: 'Bab 1 · Pemahaman Tekstual (Istilah Teknis, Informasi Tersurat & Tata Bahasa)',
      ringkas: 'Bab 1: Pemahaman Tekstual',
      icon: '📖',
      deskripsi: 'Makna istilah serapan, informasi tersurat, kalimat efektif, konjungsi, dan ejaan baku PUEBI.',
      subMateriList: [
        { id: 'semua', label: '🎯 Semua Sub-Materi Tekstual', kataKunci: ['istilah', 'tersurat', 'makna kata', 'tata bahasa'] },
        { id: 'istilah_teknis', label: '🔍 Istilah Teknis & Makna Kata', kataKunci: ['istilah', 'makna kata', 'kamus', 'serapan'] },
        { id: 'info_tersurat', label: '📑 Menemukan Informasi Tersurat (5W1H)', kataKunci: ['siapa', 'kapan', 'di mana', 'apa', 'tersurat'] },
        { id: 'ide_pokok', label: '💡 Ide Pokok & Gagasan Utama Paragraf', kataKunci: ['ide pokok', 'gagasan utama', 'kalimat utama', 'deduktif', 'induktif'] },
        { id: 'tata_kalimat', label: '✍️ Kalimat Efektif & Ejaan Baku', kataKunci: ['kalimat efektif', 'ejaan', 'tanda baca', 'huruf kapital'] },
      ],
    },
    {
      babNomor: 2,
      namaBab: 'Bab 2 · Pemahaman Inferensial (Ide Pokok, Simpulan & Hubungan Sebab-Akibat)',
      ringkas: 'Bab 2: Pemahaman Inferensial',
      icon: '🧠',
      deskripsi: 'Simpulan paragraf, hubungan logis kausalitas, implikasi tersirat, dan prediksi peristiwa.',
      subMateriList: [
        { id: 'semua', label: '🎯 Semua Sub-Materi Inferensial', kataKunci: ['inferensial', 'simpulan', 'sebab akibat', 'tersirat'] },
        { id: 'simpulan_teks', label: '📌 Simpulan Teks & Ringkasan', kataKunci: ['simpulan', 'kesimpulan', 'ringkasan teks', 'inti bacaan'] },
        { id: 'sebab_akibat', label: '⚡ Hubungan Sebab-Akibat Kausalitas', kataKunci: ['sebab', 'akibat', 'dampak', 'karena', 'sehingga'] },
        { id: 'prediksi_tersirat', label: '🔮 Prediksi Kelanjutan Peristiwa', kataKunci: ['prediksi', 'kemungkinan yang terjadi', 'tersirat'] },
      ],
    },
    {
      babNomor: 3,
      namaBab: 'Bab 3 · Teks Fiksi & Puisi (Tokoh, Alur, Majas & Nilai Moral)',
      ringkas: 'Bab 3: Teks Fiksi & Puisi',
      icon: '🎭',
      deskripsi: 'Penokohan dan watak, tahapan alur fiksi, majas metafora/personifikasi, dan pesan amanat.',
      subMateriList: [
        { id: 'semua', label: '🎯 Semua Sub-Materi Sastra', kataKunci: ['fiksi', 'cerpen', 'tokoh', 'watak', 'majas', 'amanat', 'puisi'] },
        { id: 'tokoh_watak', label: '👤 Karakter Tokoh & Bukti Watak', kataKunci: ['watak tokoh', 'karakter', 'sifat tokoh', 'dialog'] },
        { id: 'alur_latar', label: '🗺️ Alur Cerita, Konflik & Latar', kataKunci: ['alur', 'latar suasana', 'latar tempat', 'konflik'] },
        { id: 'majas_bahasa', label: '🎨 Gaya Bahasa (Majas Personifikasi & Simile)', kataKunci: ['majas', 'metafora', 'personifikasi', 'hiperbola', 'citraan'] },
        { id: 'amanat_moral', label: '🌱 Amanat Cerita & Nilai Kehidupan', kataKunci: ['amanat', 'nilai moral', 'pelajaran hidup', 'pesan'] },
      ],
    },
    {
      babNomor: 4,
      namaBab: 'Bab 4 · Evaluasi & Apresiasi (Akurasi Argumen, Relevansi Teks & Sikap Penulis)',
      ringkas: 'Bab 4: Evaluasi & Apresiasi',
      icon: '⚖️',
      deskripsi: 'Fakta vs opini, keberpihakan sikap penulis, kekuatan argumen artikel, dan tanggapan kritis.',
      subMateriList: [
        { id: 'semua', label: '🎯 Semua Sub-Materi Evaluasi', kataKunci: ['evaluasi', 'argumen', 'fakta opini', 'sikap penulis', 'tanggapan'] },
        { id: 'fakta_opini', label: '📰 Membedakan Fakta dan Opini', kataKunci: ['fakta', 'opini', 'pernyataan fakta', 'pendapat'] },
        { id: 'sikap_penulis', label: '🧐 Sikap & Keberpihakan Penulis', kataKunci: ['sikap penulis', 'keberpihakan', 'nada tulisan', 'tujuan penulis'] },
        { id: 'kekuatan_argumen', label: '🛡️ Evaluasi Argumen & Bukti Pendukung', kataKunci: ['argumen', 'akurasi data', 'kelemahan teks', 'tanggapan kritis'] },
      ],
    },
  ],
};

// ==============================================================================
// 2. KATALOG GENERATOR SOAL HOTS AI (SINTESIS PENGAYAAN BERSTANDAR TKA 2026/2027)
// ==============================================================================

export const BANK_SINTESIS_HOTS_AI = {
  // Bab 1 Matematika SMP: Bilangan
  sifat_real: [
    {
      id: 'ai_hots_bil_real_01',
      isAiGenerated: true,
      sumberAsal: 'Astro AI HOTS Synthesizer 2026',
      subtesKode: 'MTK',
      tingkatKesulitan: 'sedang',
      materi: 'Jenis & Sifat Bilangan Real',
      babNomor: 1,
      namaBab: 'Bab 1 · Bilangan (Operasi, Pecahan, Pangkat & Notasi Ilmiah)',
      soal: 'Seorang peneliti di laboratorium mengukur massa serbuk kristal yang berada di antara $\\frac{3}{8}\\text{ mg}$ dan $\\frac{5}{12}\\text{ mg}$. Di antara bilangan rasional berikut, manakah nilai yang tepat berada di antara kedua batas massa tersebut?',
      opsiJawaban: [
        { key: 'A', label: 'A', teks: '$\\frac{19}{48}\\text{ mg}$' },
        { key: 'B', label: 'B', teks: '$\\frac{17}{48}\\text{ mg}$' },
        { key: 'C', label: 'C', teks: '$\\frac{21}{48}\\text{ mg}$' },
        { key: 'D', label: 'D', teks: '$\\frac{15}{48}\\text{ mg}$' },
      ],
      kunciJawaban: 'A',
      pembahasan: '📌 **Konsep Kepadatan Bilangan Rasional:**\nSamakan penyebut kedua pecahan dengan KPK dari 8 dan 12, yaitu 24, atau perbesar ke 48:\n$$\\frac{3}{8} = \\frac{18}{48} \\quad \\text{dan} \\quad \\frac{5}{12} = \\frac{20}{48}$$\nBilangan yang berada tepat di antara $\\frac{18}{48}$ dan $\\frac{20}{48}$ adalah **$\\frac{19}{48}$**.\n\n✅ Jawaban: **A**.',
    },
    {
      id: 'ai_hots_bil_real_02',
      isAiGenerated: true,
      sumberAsal: 'Astro AI HOTS Synthesizer 2026',
      subtesKode: 'MTK',
      tingkatKesulitan: 'sulit',
      materi: 'Jenis & Sifat Bilangan Real',
      babNomor: 1,
      namaBab: 'Bab 1 · Bilangan (Operasi, Pecahan, Pangkat & Notasi Ilmiah)',
      soal: 'Dengan memanfaatkan sifat distributif operasi bilangan real, hasil perhitungan dari $(2026 \\times 2025) - (2025 \\times 2024)$ adalah ....',
      opsiJawaban: [
        { key: 'A', label: 'A', teks: '4.050' },
        { key: 'B', label: 'B', teks: '2.025' },
        { key: 'C', label: 'C', teks: '4.048' },
        { key: 'D', label: 'D', teks: '2.026' },
      ],
      kunciJawaban: 'A',
      pembahasan: '📌 **Faktorisasi Distributif:**\nPerhatikan faktor sekutu $2025$ pada kedua suku:\n$$(2026 \\times 2025) - (2025 \\times 2024) = 2025 \\times (2026 - 2024)$$\n$$= 2025 \\times 2 = 4.050$$\n\n✅ Jawaban: **A**.',
    },
    {
      id: 'ai_hots_bil_real_03',
      isAiGenerated: true,
      sumberAsal: 'Astro AI HOTS Synthesizer 2026',
      subtesKode: 'MTK',
      tingkatKesulitan: 'sedang',
      materi: 'Jenis & Sifat Bilangan Real',
      babNomor: 1,
      namaBab: 'Bab 1 · Bilangan (Operasi, Pecahan, Pangkat & Notasi Ilmiah)',
      soal: 'Perhatikan empat bilangan berikut:\n(1) $\\sqrt{144}$\n(2) $\\sqrt{20}$\n(3) $0{,}3333...$\n(4) $\\pi$\n\nPasangan bilangan yang keduanya tergolong sebagai **bilangan rasional** adalah ....',
      opsiJawaban: [
        { key: 'A', label: 'A', teks: '(1) dan (3)' },
        { key: 'B', label: 'B', teks: '(1) dan (2)' },
        { key: 'C', label: 'C', teks: '(2) dan (4)' },
        { key: 'D', label: 'D', teks: '(3) dan (4)' },
      ],
      kunciJawaban: 'A',
      pembahasan: '📌 **Definisi Bilangan Rasional & Irasional:**\n• (1) $\\sqrt{144} = 12 = \\frac{12}{1}$ (Rasional)\n• (2) $\\sqrt{20} = 2\\sqrt{5}$ (Irasional karena $\\sqrt{5}$ desimal tak berujung)\n• (3) $0{,}3333... = \\frac{1}{3}$ (Rasional karena desimal berulang teratur)\n• (4) $\\pi \\approx 3{,}14159...$ (Irasional)\n\nPasangan bilangan rasional adalah (1) dan (3).\n\n✅ Jawaban: **A**.',
    },
    {
      id: 'ai_hots_bil_real_04',
      isAiGenerated: true,
      sumberAsal: 'Astro AI HOTS Synthesizer 2026',
      subtesKode: 'MTK',
      tingkatKesulitan: 'mudah',
      materi: 'Jenis & Sifat Bilangan Real',
      babNomor: 1,
      namaBab: 'Bab 1 · Bilangan (Operasi, Pecahan, Pangkat & Notasi Ilmiah)',
      soal: 'Empat sampel larutan disimpan di dalam lemari pendingin laboratorium. Suhu masing-masing larutan adalah: Larutan P ($-12^\\circ\\text{C}$), Larutan Q ($-4^\\circ\\text{C}$), Larutan R ($-18^\\circ\\text{C}$), dan Larutan S ($-1^\\circ\\text{C}$). Urutan larutan dari suhu yang **paling hangat** ke yang paling dingin adalah ....',
      opsiJawaban: [
        { key: 'A', label: 'A', teks: 'S, Q, P, R' },
        { key: 'B', label: 'B', teks: 'R, P, Q, S' },
        { key: 'C', label: 'C', teks: 'S, P, Q, R' },
        { key: 'D', label: 'D', teks: 'Q, S, P, R' },
      ],
      kunciJawaban: 'A',
      pembahasan: '📌 **Urutan Bilangan Bulat Negatif:**\nPada garis bilangan, semakin ke kanan letak bilangan maka nilainya semakin besar (lebih hangat):\n$$-1^\\circ\\text{C} > -4^\\circ\\text{C} > -12^\\circ\\text{C} > -18^\\circ\\text{C}$$\nUrutan dari paling hangat: Larutan S, Q, P, lalu R.\n\n✅ Jawaban: **A**.',
    },
    {
      id: 'ai_hots_bil_real_05',
      isAiGenerated: true,
      sumberAsal: 'Astro AI HOTS Synthesizer 2026',
      subtesKode: 'MTK',
      tingkatKesulitan: 'sulit',
      materi: 'Jenis & Sifat Bilangan Real',
      babNomor: 1,
      namaBab: 'Bab 1 · Bilangan (Operasi, Pecahan, Pangkat & Notasi Ilmiah)',
      soal: 'Jika $a$ dan $b$ adalah bilangan bulat negatif dengan $a < b$, manakah pernyataan berikut yang bernilai **selalu benar**?',
      opsiJawaban: [
        { key: 'A', label: 'A', teks: '$\\frac{1}{a} > \\frac{1}{b}$' },
        { key: 'B', label: 'B', teks: '$a^2 < b^2$' },
        { key: 'C', label: 'C', teks: '$a - b > 0$' },
        { key: 'D', label: 'D', teks: '$a + b > 0$' },
      ],
      kunciJawaban: 'A',
      pembahasan: '📌 **Analisis Sifat Ketidaksamaan Bilangan Negatif:**\nMisalkan $a = -4$ dan $b = -2$ (memenuhi $a < b$):\n• Opsi A: $\\frac{1}{-4} = -0{,}25$ dan $\\frac{1}{-2} = -0{,}50$. Karena $-0{,}25 > -0{,}50$, maka $\\frac{1}{a} > \\frac{1}{b}$ bernilai BENAR.\n• Opsi B: $(-4)^2 = 16$ dan $(-2)^2 = 4 \\implies 16 > 4$ (Salah).\n• Opsi C: $-4 - (-2) = -2 < 0$ (Salah).\n• Opsi D: $(-4) + (-2) = -6 < 0$ (Salah).\n\n✅ Jawaban: **A**.',
    },
    {
      id: 'ai_hots_bil_real_06',
      isAiGenerated: true,
      sumberAsal: 'Astro AI HOTS Synthesizer 2026',
      subtesKode: 'MTK',
      tingkatKesulitan: 'sedang',
      materi: 'Jenis & Sifat Bilangan Real',
      babNomor: 1,
      namaBab: 'Bab 1 · Bilangan (Operasi, Pecahan, Pangkat & Notasi Ilmiah)',
      soal: 'Bentuk desimal tak hingga berulang $0{,}454545...$ dapat dinyatakan dalam bentuk pecahan paling sederhana $\\frac{p}{q}$. Nilai dari $(p + q)$ adalah ....',
      opsiJawaban: [
        { key: 'A', label: 'A', teks: '16' },
        { key: 'B', label: 'B', teks: '144' },
        { key: 'C', label: 'C', teks: '45' },
        { key: 'D', label: 'D', teks: '99' },
      ],
      kunciJawaban: 'A',
      pembahasan: '📌 **Konversi Desimal Berulang ke Pecahan Biasa:**\nMisalkan $x = 0{,}454545...$\n$$100x = 45{,}454545...$$\n$$100x - x = 45 \\implies 99x = 45 \\implies x = \\frac{45}{99}$$\nSederhanakan dengan membagi pembilang dan penyebut dengan $9$:\n$$x = \\frac{5}{11} \\implies p = 5, \\, q = 11$$\nMaka nilai $p + q = 5 + 11 = 16$.\n\n✅ Jawaban: **A**.',
    },
    {
      id: 'ai_hots_bil_real_07',
      isAiGenerated: true,
      sumberAsal: 'Astro AI HOTS Synthesizer 2026',
      subtesKode: 'MTK',
      tingkatKesulitan: 'sedang',
      materi: 'Jenis & Sifat Bilangan Real',
      babNomor: 1,
      namaBab: 'Bab 1 · Bilangan (Operasi, Pecahan, Pangkat & Notasi Ilmiah)',
      soal: 'Hasil penyederhanaan dari operasi pecahan $\\left(\\frac{2}{3} + \\frac{1}{4}\\right) \\div \\left(1 - \\frac{1}{6}\\right)$ adalah ....',
      opsiJawaban: [
        { key: 'A', label: 'A', teks: '$1\\frac{1}{10}$' },
        { key: 'B', label: 'B', teks: '$\\frac{9}{10}$' },
        { key: 'C', label: 'C', teks: '$1\\frac{3}{10}$' },
        { key: 'D', label: 'D', teks: '$\\frac{11}{12}$' },
      ],
      kunciJawaban: 'A',
      pembahasan: '📌 **Perhitungan Pecahan Bertingkat:**\n1. Pembilang: $\\frac{2}{3} + \\frac{1}{4} = \\frac{8 + 3}{12} = \\frac{11}{12}$\n2. Penyebut: $1 - \\frac{1}{6} = \\frac{5}{6}$\n3. Hasil bagi:\n$$\\frac{11}{12} \\div \\frac{5}{6} = \\frac{11}{12} \\times \\frac{6}{5} = \\frac{11 \\times 1}{2 \\times 5} = \\frac{11}{10} = 1\\frac{1}{10}$$\n\n✅ Jawaban: **A**.',
    },
  ],

  // Bentuk Akar & Merasionalkan
  bentuk_akar: [
    {
      id: 'ai_hots_akar_01',
      isAiGenerated: true,
      sumberAsal: 'Astro AI HOTS Synthesizer 2026',
      subtesKode: 'MTK',
      tingkatKesulitan: 'sedang',
      materi: 'Bentuk Akar & Merasionalkan Penyebut',
      babNomor: 1,
      namaBab: 'Bab 1 · Bilangan (Operasi, Pecahan, Pangkat & Notasi Ilmiah)',
      soal: 'Bentuk rasional dari pecahan $\\frac{12}{3 - \\sqrt{3}}$ adalah ....',
      opsiJawaban: [
        { key: 'A', label: 'A', teks: '$2(3 + \\sqrt{3})$' },
        { key: 'B', label: 'B', teks: '$2(3 - \\sqrt{3})$' },
        { key: 'C', label: 'C', teks: '$4(3 + \\sqrt{3})$' },
        { key: 'D', label: 'D', teks: '$6(3 + \\sqrt{3})$' },
      ],
      kunciJawaban: 'A',
      pembahasan: '📌 **Rasionalisasi Penyebut Bentuk Akar:**\nKalikan sekawan $(3 + \\sqrt{3})$:\n$$\\frac{12}{3 - \\sqrt{3}} \\times \\frac{3 + \\sqrt{3}}{3 + \\sqrt{3}} = \\frac{12(3 + \\sqrt{3})}{3^2 - 3} = \\frac{12(3 + \\sqrt{3})}{6} = 2(3 + \\sqrt{3})$$\n\n✅ Jawaban: **A**.',
    },
    {
      id: 'ai_hots_akar_02',
      isAiGenerated: true,
      sumberAsal: 'Astro AI HOTS Synthesizer 2026',
      subtesKode: 'MTK',
      tingkatKesulitan: 'sedang',
      materi: 'Bentuk Akar & Merasionalkan Penyebut',
      babNomor: 1,
      namaBab: 'Bab 1 · Bilangan (Operasi, Pecahan, Pangkat & Notasi Ilmiah)',
      soal: 'Hasil dari $\\sqrt{75} + 2\\sqrt{48} - \\sqrt{108}$ adalah ....',
      opsiJawaban: [
        { key: 'A', label: 'A', teks: '$7\\sqrt{3}$' },
        { key: 'B', label: 'B', teks: '$5\\sqrt{3}$' },
        { key: 'C', label: 'C', teks: '$9\\sqrt{3}$' },
        { key: 'D', label: 'D', teks: '$6\\sqrt{3}$' },
      ],
      kunciJawaban: 'A',
      pembahasan: '📌 **Penyederhanaan Suku Bentuk Akar:**\n• $\\sqrt{75} = \\sqrt{25 \\times 3} = 5\\sqrt{3}$\n• $2\\sqrt{48} = 2\\sqrt{16 \\times 3} = 2(4\\sqrt{3}) = 8\\sqrt{3}$\n• $\\sqrt{108} = \\sqrt{36 \\times 3} = 6\\sqrt{3}$\n\nJumlahkan:\n$$5\\sqrt{3} + 8\\sqrt{3} - 6\\sqrt{3} = (5 + 8 - 6)\\sqrt{3} = 7\\sqrt{3}$$\n\n✅ Jawaban: **A**.',
    },
  ],

  // Bilangan Berpangkat & Notasi Ilmiah
  pangkat_notasi: [
    {
      id: 'ai_hots_pangkat_01',
      isAiGenerated: true,
      sumberAsal: 'Astro AI HOTS Synthesizer 2026',
      subtesKode: 'MTK',
      tingkatKesulitan: 'sedang',
      materi: 'Bilangan Berpangkat & Notasi Ilmiah',
      babNomor: 1,
      namaBab: 'Bab 1 · Bilangan (Operasi, Pecahan, Pangkat & Notasi Ilmiah)',
      soal: 'Jarak rata-rata antara planet Bumi dan Matahari adalah sekitar $149.600.000\\text{ km}$. Penulisan jarak tersebut dalam bentuk **notasi ilmiah baku** dengan pembulatan sampai dua tempat desimal adalah ....',
      opsiJawaban: [
        { key: 'A', label: 'A', teks: '$1{,}50 \\times 10^8\\text{ km}$' },
        { key: 'B', label: 'B', teks: '$1{,}50 \\times 10^7\\text{ km}$' },
        { key: 'C', label: 'C', teks: '$14{,}96 \\times 10^7\\text{ km}$' },
        { key: 'D', label: 'D', teks: '$0{,}15 \\times 10^9\\text{ km}$' },
      ],
      kunciJawaban: 'A',
      pembahasan: '📌 **Aturan Notasi Ilmiah Baku ($a \\times 10^n$, dengan $1 \\le a < 10$):**\n$$149.600.000 = 1{,}496 \\times 10^8$$\nPembulatan dua tempat desimal menghasilkan **$1{,}50 \\times 10^8\\text{ km}$**.\n\n✅ Jawaban: **A**.',
    },
    {
      id: 'ai_hots_pangkat_02',
      isAiGenerated: true,
      sumberAsal: 'Astro AI HOTS Synthesizer 2026',
      subtesKode: 'MTK',
      tingkatKesulitan: 'sulit',
      materi: 'Bilangan Berpangkat & Notasi Ilmiah',
      babNomor: 1,
      namaBab: 'Bab 1 · Bilangan (Operasi, Pecahan, Pangkat & Notasi Ilmiah)',
      soal: 'Nilai dari $\\frac{4^5 \\times 8^2}{16^3}$ adalah ....',
      opsiJawaban: [
        { key: 'A', label: 'A', teks: '16' },
        { key: 'B', label: 'B', teks: '8' },
        { key: 'C', label: 'C', teks: '32' },
        { key: 'D', label: 'D', teks: '64' },
      ],
      kunciJawaban: 'A',
      pembahasan: '📌 **Penyederhanaan Basis Eksponen Sama (Basis 2):**\n• $4^5 = (2^2)^5 = 2^{10}$\n• $8^2 = (2^3)^2 = 2^6$\n• $16^3 = (2^4)^3 = 2^{12}$\n\nHitung:\n$$\\frac{2^{10} \\times 2^6}{2^{12}} = \\frac{2^{16}}{2^{12}} = 2^{16 - 12} = 2^4 = 16$$\n\n✅ Jawaban: **A**.',
    },
  ],

  // Operasi Cerita & Penskoran
  operasi_cerita: [
    {
      id: 'ai_hots_skor_01',
      isAiGenerated: true,
      sumberAsal: 'Astro AI HOTS Synthesizer 2026',
      subtesKode: 'MTK',
      tingkatKesulitan: 'sedang',
      materi: 'Operasi Hitung & Cerita Penskoran',
      babNomor: 1,
      namaBab: 'Bab 1 · Bilangan (Operasi, Pecahan, Pangkat & Notasi Ilmiah)',
      soal: 'Dalam sebuah kompetisi sains nasional tersedia 50 butir soal. Aturan penskoran adalah: setiap jawaban benar mendapat skor 4, salah mendapat skor −2, dan tidak dijawab mendapat skor −1. Seorang siswa berhasil menjawab 44 soal dan memperoleh 36 soal benar. Total skor yang diperoleh siswa tersebut adalah ....',
      opsiJawaban: [
        { key: 'A', label: 'A', teks: '122' },
        { key: 'B', label: 'B', teks: '128' },
        { key: 'C', label: 'C', teks: '136' },
        { key: 'D', label: 'D', teks: '118' },
      ],
      kunciJawaban: 'A',
      pembahasan: '📌 **Perhitungan Skor Berdasarkan Kategori:**\n• Total soal = 50 butir\n• Benar = 36 butir $\\implies 36 \\times 4 = 144$\n• Salah = $44 - 36 = 8$ butir $\\implies 8 \\times (-2) = -16$\n• Tidak dijawab = $50 - 44 = 6$ butir $\\implies 6 \\times (-1) = -6$\n\nTotal skor = $144 - 16 - 6 = 122$.\n\n✅ Jawaban: **A**.',
    },
  ],
};

// ==============================================================================
// 3. FUNGSI INTI: KURASI & MIX HYBRID SOAL AI
// ==============================================================================

/**
 * Melakukan pemindaian bank soal, menyaring soal otentik TKA,
 * dan secara otomatis me-mix dengan soal pengayaan HOTS berkualitas tinggi
 * sehingga menghasilkan tepat targetJumlah butir soal pilihan yang solid.
 */
export function kurasiDanMixSoalAi({
  jenjang = 'SMP',
  mapel = 'Matematika',
  babNomor = 1,
  subMateriId = 'semua',
  subMateriNama = '',
  bankSoalPool = [],
  targetJumlah = 10,
}) {
  // 1. Dapatkan daftar kata kunci pencocokan sub-materi
  const mapelNorm = mapel.toLowerCase().includes('indonesia') ? 'Bahasa Indonesia' : 'Matematika';
  const babObj = (SILABUS_RESMI_SMP[mapelNorm] || []).find((b) => b.babNomor === babNomor) || (SILABUS_RESMI_SMP[mapelNorm] || [])[0];
  const subObj = babObj?.subMateriList?.find((s) => s.id === subMateriId) || babObj?.subMateriList?.[0];

  const kataKunci = subObj?.kataKunci || ['bilangan'];

  // 2. Kumpulkan soal relevan dari bank soal yang tersedia
  const cocokBank = [];
  bankSoalPool.forEach((s) => {
    const sj = String(s.jenjang || '').toUpperCase();
    if (jenjang === 'SMP' && !sj.includes('SMP') && s.jenjang) return;

    const sm = String(s.mataPelajaran || s.mapel || '').toLowerCase();
    if (mapel.toLowerCase().includes('matematika') && !sm.includes('matematika') && !sm.includes('numerasi') && s.subtesKode !== 'MTK') return;

    const teksLengkap = (
      String(s.materi || '') + ' ' +
      String(s.namaBab || '') + ' ' +
      String(s.topik || '') + ' ' +
      String(s.soal || s.teksSoal || '') + ' ' +
      String(s.pembahasan || '')
    ).toLowerCase();

    // Hitung kecocokan kata kunci
    let hit = 0;
    kataKunci.forEach((kw) => {
      if (teksLengkap.includes(kw.toLowerCase())) hit += 1;
    });

    if (hit > 0 || subMateriId === 'semua') {
      const bFix = normalisasiButir(s, 'MTK', babObj.namaBab, cocokBank.length + 1);
      if (bFix) {
        cocokBank.push({
          ...bFix,
          _skorRelevansi: hit + (s.isTkaAutentik ? 10 : 0),
        });
      }
    }
  });

  // Urutkan bank soal berdasarkan prioritas: Autentik TKA MKKS DIY di posisi teratas
  cocokBank.sort((a, b) => b._skorRelevansi - a._skorRelevansi);

  // 3. Deduplikasi semantik pada bank soal
  const sidikSet = new Set();
  const bankLolosDedup = [];
  cocokBank.forEach((item) => {
    const fp = (item.soal || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40);
    if (!sidikSet.has(fp)) {
      sidikSet.add(fp);
      bankLolosDedup.push(item);
    }
  });

  // 4. Siapkan kuota: Ambil dari bank soal
  const hasilPaket = [];
  const kuotaBank = Math.min(bankLolosDedup.length, targetJumlah);
  hasilPaket.push(...bankLolosDedup.slice(0, kuotaBank));

  // 5. JIKA KURANG DARI targetJumlah: MIX DENGAN SOAL HOTS SINTESIS AI
  if (hasilPaket.length < targetJumlah) {
    const sisa = targetJumlah - hasilPaket.length;
    const katalogKey = (subMateriId && subMateriId !== 'semua') ? subMateriId : 'sifat_real';
    const poolSintesis = BANK_SINTESIS_HOTS_AI[katalogKey] || BANK_SINTESIS_HOTS_AI.sifat_real || [];

    poolSintesis.forEach((soalAi) => {
      if (hasilPaket.length >= targetJumlah) return;
      const fp = (soalAi.soal || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40);
      if (!sidikSet.has(fp)) {
        sidikSet.add(fp);
        const normAi = normalisasiButir(soalAi, 'MTK', babObj.namaBab, hasilPaket.length + 1);
        if (normAi) {
          hasilPaket.push(normAi);
        }
      }
    });
  }

  // 6. Jika masih kurang juga, lengkapi dari bank soal cadangan bab tersebut
  if (hasilPaket.length < targetJumlah) {
    bankSoalPool.forEach((s) => {
      if (hasilPaket.length >= targetJumlah) return;
      const fp = (s.soal || s.teksSoal || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40);
      if (!sidikSet.has(fp)) {
        sidikSet.add(fp);
        const norm = normalisasiButir(s, 'MTK', babObj.namaBab, hasilPaket.length + 1);
        if (norm) hasilPaket.push(norm);
      }
    });
  }

  // 7. Penomoran akhir 1 s.d. targetJumlah
  return hasilPaket.slice(0, targetJumlah).map((b, idx) => ({
    ...b,
    nomor: idx + 1,
    nomorSoal: idx + 1,
  }));
}

// ==============================================================================
// 4. PEMBANTU HIERARKI SILABUS & FILTER SOAL
// ==============================================================================

/**
 * Mengambil daftar Bab Kurikulum Resmi dengan total jumlah soal dari bankSoal
 */
export function ambilDaftarBab(jenjang = 'SMP', mapel = 'Matematika', bankSoal = []) {
  const mapelNorm = mapel.toLowerCase().includes('indonesia') ? 'Bahasa Indonesia' : 'Matematika';
  const silabusMapel = SILABUS_RESMI_SMP[mapelNorm];

  if (jenjang === 'SMP' && silabusMapel) {
    return silabusMapel.map((bab) => {
      const jumlah = bankSoal.filter((s) => {
        const sj = String(s.jenjang || '').toUpperCase();
        if (s.jenjang && !sj.includes('SMP')) return false;
        const sm = String(s.mataPelajaran || s.mapel || '').toLowerCase();
        if (mapel.toLowerCase().includes('matematika') && !sm.includes('matematika') && !sm.includes('numerasi') && s.subtesKode !== 'MTK') return false;
        return s.babNomor === bab.babNomor;
      }).length;

      return {
        ...bab,
        count: jumlah,
        jumlahSoal: jumlah,
      };
    });
  }

  // Fallback untuk jenjang / mapel lain: kumpulkan bab yang ada di bankSoal
  const mapBab = new Map();
  bankSoal.forEach((s) => {
    const sj = String(s.jenjang || '').toUpperCase();
    if (jenjang && s.jenjang && !sj.includes(jenjang.toUpperCase())) return;
    const sm = String(s.mataPelajaran || s.mapel || '').toLowerCase();
    if (mapel && !sm.includes(mapel.toLowerCase())) return;

    const bNama = s.namaBab || s.bab || s.materi || 'Materi Inti';
    const bNomor = s.babNomor || 1;
    if (!mapBab.has(bNama)) {
      mapBab.set(bNama, {
        babNomor: bNomor,
        namaBab: bNama,
        ringkas: bNama,
        icon: '📚',
        subMateriList: [{ id: 'semua', label: '🎯 Semua Sub-Materi' }],
        count: 0,
        jumlahSoal: 0,
      });
    }
    const item = mapBab.get(bNama);
    item.count += 1;
    item.jumlahSoal += 1;
  });

  return Array.from(mapBab.values());
}

/**
 * Menyaring butir soal di suatu Bab berdasarkan Sub-Materi yang aktif
 */
export function saringSoalBabDanSubMateri(bankSoal, jenjang, mapel, babNomor, subMateriId = 'semua', namaBabFallback = '') {
  const mapelNorm = mapel.toLowerCase().includes('indonesia') ? 'Bahasa Indonesia' : 'Matematika';
  const babObj = (SILABUS_RESMI_SMP[mapelNorm] || []).find((b) => b.babNomor === babNomor);
  const subObj = babObj?.subMateriList?.find((s) => s.id === subMateriId);

  return bankSoal.filter((s) => {
    const sj = String(s.jenjang || '').toUpperCase();
    if (s.jenjang && !sj.includes(jenjang.toUpperCase())) return false;
    const sm = String(s.mataPelajaran || s.mapel || '').toLowerCase();
    if (mapel.toLowerCase().includes('matematika') && !sm.includes('matematika') && !sm.includes('numerasi') && s.subtesKode !== 'MTK') return false;

    // Cek kesesuaian bab
    const matchBab = s.babNomor === babNomor || (s.namaBab && namaBabFallback && s.namaBab === namaBabFallback);
    if (!matchBab) return false;

    // Jika pilih "semua", tampilkan seluruh butir di bab ini
    if (!subMateriId || subMateriId === 'semua') return true;

    // Jika pilih sub-materi tertentu, cocokkan dengan kata kunci sub-materi
    const kataKunci = subObj?.kataKunci || [];
    const teksLengkap = (
      String(s.materi || '') + ' ' +
      String(s.topik || '') + ' ' +
      String(s.soal || s.teksSoal || '') + ' ' +
      String(s.pembahasan || '')
    ).toLowerCase();

    return kataKunci.some((kw) => teksLengkap.includes(kw.toLowerCase()));
  });
}
