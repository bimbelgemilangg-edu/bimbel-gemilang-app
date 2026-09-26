// Config bab 6 — ANALYTICAL EXPOSITION (Bahasa Inggris K12, turn 98)
export const INPUT = '../.ekstrak-bing4.json';
export const OUT_DRAFT = 'docs/drafts/draft-bahasa-inggris-k12-v1-bab6.json';
export const OUT_IMPOT = 'IMPOR-BAHASA-INGGRIS-BAB6-TERBARU.json';
export const BUILDER = 'scripts/build-bing-k12-bab6.mjs';
export const SUMBER_TEKS = 'Bab 6 Analytical Exposition h.98+ (kunci tabel di HTML, pembahasan di HTML/PDF 08 Pembahasan)';

export const CG = {
  1: 'Main idea = tesis: kesadaran keamanan siber penting untuk melindungi data.',
  2: 'Kesalahan umum = daftar di paragraf argumen (tautan mencurigakan, kata sandi lemah).',
  3: 'Why benefit = rantai argumen: kepercayaan pelanggan + penurunan risiko.',
  4: 'Praktik rekomendasi = daftar tindakan (MFA, pembaruan, pelatihan).',
  5: 'Breaches = konteks keamanan = pembobolan/kegagalan sistem.',
  6: 'Purpose analytical = persuade that something IS the case (bukan should).',
  7: 'NOT mentioned = eliminasi peran yang terdaftar satu per satu.',
  8: 'Advantage = manfaat; Disadvantage = biaya/kerugian/limitasi.',
  9: 'Contoh spesies = eksplisit: harimau India, orangutan Indonesia.',
  10: 'Inferensi koridor = fungsinya: migrasi, adaptasi, keragaman genetik.',
  11: 'Main idea p3 = studi genetik -> terapi inovatif.',
  12: 'Alasan menyoroti counseling = keluarga paham risiko & pengambilan keputusan.',
  13: 'Daftar gangguan genetik eksplisit (cystic fibrosis, Huntington, sickle cell).',
  14: 'Preventive carriers = gaya hidup, pemantauan, skrining berkala.',
  15: 'Lokalisasi frasa: paragraf yang menyebut penerapan temuan pasca-HGP.',
  16: 'Kontribusi ekonomi = isi kekurangan tenaga kerja, pajak, wirausaha.',
  17: 'Antonim poverty = prosperity (kemakmuran).',
  18: 'Economic = uang/tenaga kerja; Social = komunitas/budaya/keluarga.',
  19: 'Kondisi kontrafaktual: pembatasan -> kekurangan tenaga kerja menua memburuk.',
  20: 'Conclusion = migrasi peluang membangun ekonomi, bukan ancaman.',
  21: 'Argumen terkuat = yang memakai bukti ilmiah (sirkuit otak teraktivasi).',
  22: 'Self-awareness = refleksi metafora + regulasi emosi lewat puisi.',
  23: 'Elicit = membangkitkan = evoke; substitusi ke kalimat.',
  24: 'Menulis puisi = wadah aman menyalurkan & menata emosi.',
  25: 'Simbolis = pemrosesan pengalaman secara tidak langsung lewat lambang.',
};

export const SECTIONS = `
  // ===== SUBBAB A: ANALYTICAL EXPOSITION — MEYAKINKAN BAHWA SESUATU MEMANG BEGITU =====
  { jenis: 'judul', teks: 'Analytical Exposition: Persuading that Something IS the Case' },
  { jenis: 'kilat', teks: 'Analytical exposition persuades the readers that something is the case — menegaskan bahwa suatu keadaan/klaim memang benar adanya lewat argumen. Struktur: Thesis - Arguments - Reiteration (penegasan ulang, BUKAN rekomendasi).' },
  { jenis: 'peta', teks: 'Pasangan sekaligus pembeda hortatory: analytical menutup dengan REITERATION ("karena itu benar demikian"), hortatory dengan RECOMMENDATION ("karena itu lakukan ini"). Satu tes sederhana memisahkan keduanya di semua soal purpose/structure.' },
  { jenis: 'paragraf', teks: 'Analytical exposition seperti surat pendapat ahli: membuka posisi, menumpuk bukti, lalu menegaskan ulang posisi awal dengan kata-kata baru. Tidak ada ajakan bertindak — yang diminta hanya satu: setuju bahwa keadaannya memang begitu.' },
  {
    jenis: 'poin', judul: 'Generic structure (bank h.98)', items: [
      'Thesis — pernyataan posisi/klaim utama penulis.',
      'Arguments — alasan & bukti pendukung (satu paragraf per argumen).',
      'Reiteration — penegasan ulang tesis di penutup (berbeda dari recommendation!).',
    ],
  },
  {
    jenis: 'tabelinfo', judul: 'Language features + contoh',
    kolom: ['Fitur', 'Contoh'],
    rows: [
      { k: 'Simple present tense', v: 'Cybersecurity awareness protects businesses.' },
      { k: 'Modal verbs', v: 'can, may, must (penalaran, bukan perintah). ' },
      { k: 'Passive voice', v: 'Mistakes are exploited by attackers.' },
      { k: 'Evaluative words', v: 'importantly, unfortunately, crucial.' },
      { k: 'Thinking verbs', v: 'think, believe, realize, know.' },
      { k: 'Connectives antarargumen', v: 'firstly, furthermore, in conclusion.' },
    ],
  },
  {
    jenis: 'jodohMini', judul: '🔗 Jodohkan: struktur dan isyaratnya',
    items: [
      { kiri: 'Klaim pembuka yang akan dibela', kanan: 'Thesis' },
      { kiri: 'Paragraf-paragraf alasan & bukti', kanan: 'Arguments' },
      { kiri: 'Penutup yang menegaskan ulang tesis', kanan: 'Reiteration' },
      { kiri: 'Penutup yang menyerukan should/must', kanan: 'Recommendation (milik hortatory)' },
    ],
  },
  {
    jenis: 'benarSalah', judul: '⚖️ Cek pemahaman: analytical markers',
    items: [
      { teks: 'Analytical exposition ends with a reiteration of the thesis.', jawaban: true, penjelasan: 'Penegasan ulang, bukan ajakan.' },
      { teks: 'Its social function is to persuade that something is the case.', jawaban: true, penjelasan: 'Definisi bank h.98.' },
      { teks: 'Recommendation (should/must) is the typical closing of analytical exposition.', jawaban: false, penjelasan: 'Itu hortatory; analytical = reiteration.' },
      { teks: 'Thinking verbs (think, believe, realize) are common language features.', jawaban: true, penjelasan: 'Language features bank.' },
    ],
  },
  {
    jenis: 'caraGemilang', judul: '👑 CG-EXPO: IS-THE-CASE TEST',
    teks: 'Tutup teks dengan pertanyaan: penulis ingin kita PERCAYAI keadaan (analytical) atau MELAKUKAN tindakan (hortatory)? Percayai = reiteration; lakukan = recommendation.',
    items: [
      'Petakan T-A-R: thesis (paragraf 1), satu argumen per paragraf tengah, penutup reiteration/recommendation.',
      'Soal argumen terkuat/terdukung = cari argumen dengan bukti/data ilmiah eksplisit.',
      'Soal NOT mentioned = eliminasi daftar eksplisit teks satu per satu.',
    ],
  },
  { jenis: 'callout', tipe: 'peringatan', judul: 'Jebakan ujian', teks: 'Opsi purpose "to recommend how to..." menempel di analytical sebagai pengecoh hortatory. Cek kalimat penutup teks: menegaskan ulang (= analytical) atau menyerukan tindakan (= hortatory).' },
  {
    jenis: 'zona', items: [
      { soal: 'The closing part of an analytical exposition that restates the thesis is called ...', opsi: ['recommendation', 'reiteration', 're-orientation', 'coda', 'goal'], jawaban: 1, pembahasan: 'Jalur konsep: reiteration = penegasan ulang (bank h.98). Jalur Cara Gemilang: IS-THE-CASE TEST.' },
      { soal: 'A text argues that urban trees cool cities and ends: "Thus, urban trees are indeed vital infrastructure." The text is ...', opsi: ['hortatory exposition', 'analytical exposition', 'procedure', 'narrative', 'recount'], jawaban: 1, pembahasan: 'Jalur konsep: penutup menegaskan klaim (indeed vital) tanpa should = analytical. Jalur Cara Gemilang: IS-THE-CASE TEST lulus.' },
      { soal: 'Which connective typically signals a new argument in analytical exposition?', opsi: ['furthermore', 'once', 'after that', 'finally pour', 'meanwhile stir'], jawaban: 0, pembahasan: 'Jalur konsep: furthermore = penambah argumen; once/after that milik procedure. Jalur Cara Gemilang: connective antarargumen vs antarlangkah.' },
    ],
  },

  // ===== SUBBAB B: POLA SOAL ANALYTICAL =====
  { jenis: 'judul', teks: 'Analytical Question Patterns' },
  {
    jenis: 'tabelinfo', judul: 'Pola soal + jurus',
    kolom: ['Pola', 'Penanda', 'Jurus'],
    rows: [
      { k: 'Main idea/thesis', v: '"main idea of the text/paragraph"', w: 'Klaim tesis atau kalimat inti paragraf.' },
      { k: 'NOT mentioned/except', v: '"Which is NOT mentioned...?"', w: 'Eliminasi daftar eksplisit.' },
      { k: 'Strongest argument', v: '"most strongly supported"', w: 'Argumen berbukti data/ilmiah.' },
      { k: 'Categorize advantage/impact', v: '"Advantage/Disadvantage", "Economic/Social"', w: 'Dua kolom aspek dulu.' },
      { k: 'Vocabulary/antonym', v: '"closest meaning / opposite"', w: 'Substitusi konteks atau pasangan antonim.' },
      { k: 'Conclusion/inference', v: '"What conclusion can be drawn...?"', w: 'Generalisasi setia tanpa kata mutlak.' },
    ],
  },
  {
    jenis: 'isianRumpang', judul: '✍️ Isian rumpang: istilah exposition',
    items: [
      { teks: 'The restatement of the thesis at the end of an analytical exposition is called ...', jawaban: ['reiteration'], hint: 'Penegasan ulang.', penjelasan: 'Reiteration menutup analytical exposition.' },
      { teks: 'Paragraphs that give reasons and evidence are called ...', jawaban: ['arguments', 'argument'], hint: 'Alasan pendukung.', penjelasan: 'Arguments = paragraf alasan & bukti.' },
      { teks: 'Words like "crucial" and "unfortunately" are ... words.', jawaban: ['evaluative'], hint: 'Menilai sikap penulis.', penjelasan: 'Evaluative words menandai sikap penulis.' },
    ],
  },
  { jenis: 'callout', tipe: 'guru', judul: 'Ringkas sendiri', teks: 'Bandingkan dua teks bab 5 dan bab 6 (hortatory vs analytical) dalam tabel tiga baris: pembuka, isi, penutup. Selisih satu baris penutup itulah yang diuji hampir semua soal structure/purpose.' },
  { jenis: 'callout', tipe: 'info', judul: 'Siap uji pemahaman', teks: '25 soal resmi bab ini memakai 5 analytical: keamanan siber, taman nasional, kedokteran genetik, migrasi ekonomi, dan puisi-otak. Petakan T-A-R sebelum menyentuh opsi.' },
`;

export const META = {
  babJudul: 'Bab 6 — Analytical Exposition (Edisi Cara Gemilang)',
  babRingkasan: 'Social function persuade-that-is-the-case, struktur thesis-arguments-reiteration, language features, pembeda analytical-vs-hortatory (IS-THE-CASE TEST), pola soal NOT-mentioned/argumen-terkuat/kategorisasi/antonim — dengan jodohkan struktur, benar/salah, isian rumpang, CG-EXPO, dan 25 soal resmi bank (cybersecurity, national parks, genetic medicine, migration, poetry) + pembahasan dua jalur.',
  urutan: 6,
};
