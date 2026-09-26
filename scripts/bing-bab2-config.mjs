// Config bab 2 — DESCRIPTIVE TEXT (Bahasa Inggris K12, turn 98)
export const INPUT = '../.ekstrak-bing6.json';
export const OUT_DRAFT = 'docs/drafts/draft-bahasa-inggris-k12-v1-bab2.json';
export const OUT_IMPOT = 'IMPOR-BAHASA-INGGRIS-BAB2-TERBARU.json';
export const BUILDER = 'scripts/build-bing-k12-bab2.mjs';
export const SUMBER_TEKS = 'Bab 2 Descriptive Text h.76+ (kunci tabel di HTML, pembahasan di HTML/PDF 08 Pembahasan; 5 gambar stimulus diekstrak ke public/gambar-bing/)';
export const GAMBAR_GRUP = {
  0: '/gambar-bing/descriptive-g1.jpg',
  1: '/gambar-bing/descriptive-g2.jpg',
  2: '/gambar-bing/descriptive-g3.jpg',
  3: '/gambar-bing/descriptive-g4.jpg',
  4: '/gambar-bing/descriptive-g5.jpg',
};

export const CG = {
  1: 'Why unique = fakta superlatif paragraf 1: the most isolated inhabited island.',
  2: 'Karakteristik menyeluruh = opsi yang merangkum SEMUA paragraf (isolasi, vulkanik, satwa).',
  3: 'Vital sanctuary = tempat aman satwa; pilih semua alasan yang tertulis di paragraf satwa.',
  4: 'Main idea paragraf = kalimat inti paragraf itu: ketangguhan manusia di lingkungan sulit.',
  5: 'True/False verifikasi per baris ke teks; kata mutlak/angka meleset = False.',
  6: 'Characteristics = adjektiva deskriptif teks (biting winds, permafrost); coret yang tak disebut.',
  7: 'Makna frasa = konteks sekitar: glittering light = kontras terang di tengah salju.',
  8: 'Ide tersirat = pentingnya bagi ketahanan pangan masa depan dunia.',
  9: 'Detail paling meyakinkan = fungsi inti: cadangan benih global bila bencana terjadi.',
  10: 'Categorize: faktor lingkungan (alam memberi) vs technical protection (rancangan manusia).',
  11: 'Topik = objek + aspeknya: ciri fisik Great Blue Hole + nilai ilmiahnya.',
  12: 'Sebab-akibat teks: es mencair -> laut naik -> sistem gua tergenang -> lubang vertikal.',
  13: 'Functions/features = daftar fungsi di paragraf 2-3; coret yang karangan opsi.',
  14: 'Chasm = celah dalam -> abyss; substitusi ke kalimat "vertical chasm".',
  15: 'Verifikasi angka/dimensi paragraf 1 per baris.',
  16: 'Purpose descriptive = to describe/portray sosok (Cillian Murphy), bukan narrate/cerita.',
  17: 'Main idea paragraf 1 = perpaduan fisik unik + kemampuan akting.',
  18: 'Inference = yang tak tertulis langsung: ia sangat menjaga privasi.',
  19: 'Characteristics = adjektiva eksplisit (reserved, enigmatic, intense); kumpulkan dari teks.',
  20: 'Physical vs work/personality: tempel deskripsi ke paragraf asal (fisik=1, kerja/sikap=2-3).',
  21: 'Pernyataan benar replika T-Rex = detail paragraf pameran (skala, pose, material).',
  22: 'Physical structure (tengkorak, ukuran) vs dynamic posture (pose bergerak, aksi).',
  23: 'Target audience = pihak yang berkepentingan dengan tema: pelajar prasejarah, pengunjung museum, pecinta dinosaurus.',
  24: 'More informative = informasi relevan yang BELUM ada (data/perbandingan ukuran ilmiah).',
  25: 'Fact = pernyataan terukur/tercantum eksplisit (the largest...); opini = penilaian.',
};

export const SECTIONS = `
  // ===== SUBBAB A: DESCRIPTIVE TEXT — MELUKIS DENGAN KATA =====
  { jenis: 'judul', teks: 'Descriptive Text: Painting with Words' },
  { jenis: 'kilat', teks: 'Descriptive text explains how a person or an object is like — its form, properties, amount, and others. Social function: to describe, represent, or reveal a person or object, abstract or concrete, so the reader can picture it.' },
  { jenis: 'peta', teks: 'Descriptive adalah teks "potret": tidak ada urutan waktu (itu recount), tidak ada argumen (itu exposition), tidak ada langkah (itu procedure). Soal TKA-nya khas: karakteristik objek, kategorisasi ciri, makna frasa, main idea per paragraf, dan purpose = menggambarkan.' },
  { jenis: 'paragraf', teks: 'Bayangkan descriptive sebagai sketsa potret: pelukis menyebut subjek dulu (identification), lalu menambahkan detail lapis demi lapis (description) sampai penonton "melihat" tanpa hadir. Setiap detail adalah calon opsi jawaban soal karakteristik.' },
  {
    jenis: 'poin', judul: 'Generic structure (bank h.76)', items: [
      'Identification — memperkenalkan & menyatakan subjek/topik utama yang akan dideskripsikan.',
      'Description — merinci subjek (fisik, sifat, jumlah, latar) agar pembaca bisa membayangkannya.',
    ],
  },
  {
    jenis: 'tabelinfo', judul: 'Language features + contoh',
    kolom: ['Fitur', 'Contoh'],
    rows: [
      { k: 'Simple present tense', v: 'The island lies in the South Atlantic; it has a mild climate.' },
      { k: 'Focus on a specific participant', v: 'Satu subjek utama: Tristan da Cunha / the Seed Vault / Cillian Murphy.' },
      { k: 'Adjectives', v: 'isolated, volcanic, biting winds, reserved, enigmatic.' },
      { k: 'Action verbs (relational/mental juga)', v: 'has, consists of, seems, possesses.' },
    ],
  },
  {
    jenis: 'jodohMini', judul: '🔗 Jodohkan: struktur dan fungsinya',
    items: [
      { kiri: 'Introduces and states the main subject', kanan: 'Identification' },
      { kiri: 'Details the subject so readers can picture it', kanan: 'Description' },
      { kiri: 'Tense khas teks descriptive', kanan: 'Simple present' },
      { kiri: 'Kata yang mewarnai ciri (isolated, biting, reserved)', kanan: 'Adjectives' },
    ],
  },
  {
    jenis: 'benarSalah', judul: '⚖️ Cek pemahaman: descriptive basics',
    items: [
      { teks: 'Descriptive text predominantly uses simple present tense.', jawaban: true, penjelasan: 'Menggambarkan keadaan umum/fakta subjek.' },
      { teks: 'Descriptive text retells events in chronological order.', jawaban: false, penjelasan: 'Itu recount; descriptive tanpa urutan waktu.' },
      { teks: 'Adjectives are central language feature of descriptive text.', jawaban: true, penjelasan: 'Ciri dibangun lewat adjektiva.' },
      { teks: 'Descriptive focuses on one specific participant.', jawaban: true, penjelasan: 'Subjek tunggal yang dipotret.' },
    ],
  },
  {
    jenis: 'caraGemilang', judul: '👑 CG-DESCRIPTIVE: SPOT',
    teks: 'Subjek -> Picture-Of-Traits: temukan subjeknya, kumpulkan sifat per paragraf; soal kategorisasi = tempel sifat ke aspeknya; soal frasa = substitusi konteks.',
    items: [
      'Tandai subjek utama di identification (kalimat pertama).',
      'Garis bawahi adjektiva/frasa ciri per paragraf — itulah bank opsi soal karakteristik.',
      'Soal categorize: buat dua kolom aspek (mis. fisik vs sikap) sebelum membaca pernyataan.',
    ],
  },
  { jenis: 'callout', tipe: 'peringatan', judul: 'Jebakan ujian', teks: 'Soal karakteristik sering menyisipkan ciri yang "masuk akal" tetapi tidak ada di teks (halu-wajar). Kembali ke adjektiva yang benar-benar tertulis. Untuk soal EXCEPT/kecuali, cari satu-satunya yang tidak tercatat.' },
  {
    jenis: 'zona', items: [
      { soal: 'The social function of descriptive text is ...', opsi: ['to retell past events', 'to describe a person or an object', 'to persuade readers', 'to explain how to make something', 'to argue a point of view'], jawaban: 1, pembahasan: 'Jalur konsep: to describe, represent, or reveal a person or an object (bank h.76). Jalur Cara Gemilang: CG-DESCRIPTIVE — potret, bukan cerita.' },
      { soal: 'Which section of a descriptive text introduces the main subject?', opsi: ['Description', 'Re-orientation', 'Identification', 'Complication', 'Thesis'], jawaban: 2, pembahasan: 'Jalur konsep: identification memperkenalkan subjek utama. Jalur Cara Gemilang: SPOT — S dulu (subjek).' },
      { soal: '"The vault stays cold throughout the year." The closest meaning of "throughout" is ...', opsi: ['during the whole of', 'at the beginning of', 'after the end of', 'in the middle of', 'before the start of'], jawaban: 0, pembahasan: 'Jalur konsep: throughout = selama seluruh periode. Jalur Cara Gemilang: substitusi opsi ke kalimat; pilih yang menjaga makna "setiap saat".' },
    ],
  },

  // ===== SUBBAB B: POLA SOAL DESCRIPTIVE =====
  { jenis: 'judul', teks: 'Descriptive Question Patterns' },
  {
    jenis: 'tabelinfo', judul: 'Pola soal + jurus',
    kolom: ['Pola', 'Penanda', 'Jurus'],
    rows: [
      { k: 'Characteristics', v: '"Which are characteristics...?"', w: 'Kumpulkan adjektiva/frasa ciri tertulis; coret yang halu-wajar.' },
      { k: 'Categorize', v: '"Categorize based on..."', w: 'Buat kolom aspek dulu, tempel pernyataan per paragraf asal.' },
      { k: 'Phrase meaning', v: '"The phrase ... suggests"', w: 'Substitusi konteks sekitar frasa.' },
      { k: 'Main idea paragraf', v: '"main idea of the 2nd paragraph"', w: 'Kalimat inti paragraf itu saja.' },
      { k: 'Purpose', v: '"What is the purpose...?"', w: 'To describe/portray — bukan retell/argue/procedure.' },
      { k: 'Fact vs opinion', v: '"Which statement is a fact...?"', w: 'Fakta = terukur/tercantum; opini = penilaian.' },
    ],
  },
  {
    jenis: 'isianRumpang', judul: '✍️ Isian rumpang: istilah descriptive',
    items: [
      { teks: 'The first part of a descriptive text that states the main subject is called ...', jawaban: ['identification'], hint: 'Berkenalan dengan subjek.', penjelasan: 'Identification memperkenalkan subjek.' },
      { teks: 'The part that details the subject features is called ...', jawaban: ['description'], hint: 'Rincian ciri.', penjelasan: 'Description merinci subjek.' },
      { teks: 'Descriptive text mainly uses simple ... tense.', jawaban: ['present'], hint: 'Bentuk sekarang.', penjelasan: 'Simple present untuk keadaan umum.' },
    ],
  },
  { jenis: 'callout', tipe: 'guru', judul: 'Ringkas sendiri', teks: 'Pilih satu dari 5 teks bab ini (pulau Tristan, Seed Vault, Blue Hole, Cillian Murphy, T-Rex) dan buat kartu SPOT: subjek + 6 ciri tertulis + 2 kalimat kategori (fisik vs non-fisik). Kartu itu latihan terbaik untuk soal categorize.' },
  { jenis: 'callout', tipe: 'info', judul: 'Siap uji pemahaman', teks: '25 soal resmi bab ini memakai 5 descriptive bertekstur nyata (tempat ekstrem, figur publik, objek pameran) — masing-masing dengan gambar stimulus. Perhatikan gambar sebelum menjawab: beberapa soal merujuk detail visual.' },
`;

export const META = {
  babJudul: 'Bab 2 — Descriptive Text (Edisi Cara Gemilang)',
  babRingkasan: 'Definisi & social function descriptive, struktur identification-description, language features, pola soal karakteristik/kategorisasi/makna frasa — dengan gambar stimulus asli per teks (5 gambar diekstrak ke public/gambar-bing), jodohkan struktur, benar/salah, isian rumpang, dan 25 soal resmi bank (Tristan da Cunha, Svalbard Seed Vault, Great Blue Hole, Cillian Murphy, T-Rex) + pembahasan dua jalur.',
  urutan: 2,
};
