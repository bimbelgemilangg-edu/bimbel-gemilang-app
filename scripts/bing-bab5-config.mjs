// Config bab 5 — HORTATORY EXPOSITION (Bahasa Inggris K12, turn 98)
export const INPUT = '../.ekstrak-bing7.json';
export const OUT_DRAFT = 'docs/drafts/draft-bahasa-inggris-k12-v1-bab5.json';
export const OUT_IMPOT = 'IMPOR-BAHASA-INGGRIS-BAB5-TERBARU.json';
export const BUILDER = 'scripts/build-bing-k12-bab5.mjs';
export const SUMBER_TEKS = 'Bab 5 Hortatory Exposition h.92+ (kunci tabel di HTML, pembahasan di HTML/PDF 08 Pembahasan)';

export const CG = {
  1: 'Stated = ada kalimat pendukung eksplisit di teks; Not stated = tambahan opini opsi.',
  2: 'Rantai sebab-akibat: limbah menyumbat saluran -> genangan -> penyakit.',
  3: '"Mainly discussed" = fokus dominan paragraf, bukan detail penyerta.',
  4: 'Prediksi = kelanjutan logis dari dampak yang sudah disebut teks.',
  5: 'Opini didukung contoh = cari opini yang diikuti bukti konkret di teks.',
  6: 'Kontribusi siswa = rekomendasi bagian akhir (reduce, reuse, kampanye).',
  7: 'Topik = tesis paragraf 1: pentingnya literasi digital bagi siswa.',
  8: 'Audience = siapa yang disapa/dicontohkan teks; pembaca umum bila tanpa sapaan khusus.',
  9: 'Skills abad 21 = daftar eksplisit: critical thinking, creativity, collaboration.',
  10: 'Tindakan literasi digital baik = verifikasi info, batasi konten, etika bermedia.',
  11: 'Intention hortatory = mendorong tindakan (sekolah memprioritaskan literasi digital).',
  12: 'Akademik = belajar/kolaborasi; karier = peluang kerja/keterampilan profesi.',
  13: 'Best summary = tesis + argumen inti + rekomendasi dalam SATU kalimat menyeluruh.',
  14: 'Eksposisi membuka dengan tesis dan menutup dengan rekomendasi yang mengikat ulang.',
  15: 'Inferensi masa depan = konsekuensi lanjutan yang logis dari ketergantungan fosil.',
  16: 'Arrangement = cocokkan topik per paragraf sesuai urutan teks.',
  17: 'Tiga jenis fosil = coal, oil, natural gas (daftar eksplisit).',
  18: 'Proses alami vs aktivitas manusia: drilling/transport/fracking = manusia.',
  19: 'Main idea = dampak buruk kelebihan layar pada anak.',
  20: 'Pernyataan pendukung = mekanisme gangguan pencernaan akibat layar.',
  21: 'Inferensi: kesempatan mengatur emosi & fokus berkurang karena layar konstan.',
  22: 'Sustaining = mempertahankan (perhatian); substitusi ke kalimat.',
  23: 'Kognitif/sosial = komunikasi, emosi, fokus; fisik = mata, tidur, pencernaan.',
  24: 'Strategi orang tua = batas waktu + jadwal penggunaan layar.',
  25: 'Anak mengabaikan sinyal tubuh karena atensi terserap aktivitas layar.',
};

export const SECTIONS = `
  // ===== SUBBAB A: HORTATORY EXPOSITION — BERARGUMEN UNTUK BERTINDAK =====
  { jenis: 'judul', teks: 'Hortatory Exposition: Arguing for Action' },
  { jenis: 'kilat', teks: 'Hortatory exposition persuades the readers that something SHOULD or SHOULD NOT be done toward a case or issue. Bedanya dengan analytical: analytical berhenti pada "ini penting/benar", hortatory menutup dengan REKOMENDASI tindakan.' },
  { jenis: 'peta', teks: 'Teks hortatory adalah pidato kampanye: klaim (thesis), alasan (arguments), lalu ajakan (recommendation). Soal TKA favoritnya: stated/not stated, rekomendasi penulis, inferensi konsekuensi, dan kategorisasi argumen — semuanya dijawab dari peta tiga bagian itu.' },
  { jenis: 'paragraf', teks: 'Bayangkan poster kampanye kebersihan: kepala poster menyatakan masalah (thesis), badan poster memberi alasan mengapa berbahaya (arguments), kaki poster menyerukan apa yang harus dilakukan (recommendation). Hilangkan kakinya, poster jadi analytical.' },
  {
    jenis: 'poin', judul: 'Generic structure (bank h.92)', items: [
      'Thesis — pernyataan posisi/isu yang jadi perhatian penulis.',
      'Argument — alasan-alasan pendukung posisi (biasanya beberapa paragraf).',
      'Recommendation — saran tindakan: should/should not/must/ought to.',
    ],
  },
  {
    jenis: 'tabelinfo', judul: 'Language features + contoh',
    kolom: ['Fitur', 'Contoh'],
    rows: [
      { k: 'Simple present tense', v: 'Waste clogs the drains and spreads disease.' },
      { k: 'Modal verbs', v: 'should, must, ought to, need to.' },
      { k: 'Passive voice', v: 'The waterways are blocked by plastic waste.' },
      { k: 'Expression of recommendation', v: 'Students should reduce single-use plastic.' },
      { k: 'Evaluative words & thinking verbs', v: 'importantly, unfortunately; think, believe, realize.' },
    ],
  },
  {
    jenis: 'jodohMini', judul: '🔗 Jodohkan: struktur dan penandanya',
    items: [
      { kiri: 'Pernyataan posisi/isu di pembuka', kanan: 'Thesis' },
      { kiri: 'Alasan pendukung berparagraf-paragraf', kanan: 'Argument' },
      { kiri: '"Schools should prioritize digital literacy."', kanan: 'Recommendation' },
      { kiri: 'should, must, ought to', kanan: 'Modal verbs' },
    ],
  },
  {
    jenis: 'benarSalah', judul: '⚖️ Cek pemahaman: hortatory vs analytical',
    items: [
      { teks: 'Hortatory exposition ends with a recommendation of what should be done.', jawaban: true, penjelasan: 'Pembeda utama dari analytical.' },
      { teks: 'Analytical exposition also contains explicit recommendation.', jawaban: false, penjelasan: 'Analytical berhenti pada reiteration/penegasan tesis.' },
      { teks: 'Stated/Not-stated questions require explicit textual support.', jawaban: true, penjelasan: 'Not stated = tidak ada kalimat pendukungnya.' },
      { teks: 'Modal verbs like should and must are typical of hortatory text.', jawaban: true, penjelasan: 'Language features bank h.92.' },
    ],
  },
  {
    jenis: 'caraGemilang', judul: '👑 CG-HORTATORY: T-A-R + SHOULD TEST',
    teks: 'Petakan teks ke T-A-R (Thesis-Arguments-Recommendation); uji hortatory dengan SHOULD TEST: ada seruan should/must di penutup? ada = hortatory.',
    items: [
      'Tandai tesis (paragraf 1), daftar argumen per paragraf, garis bawahi rekomendasi penutup.',
      'Soal stated/not stated: cari kalimat pendukung harfiah; tak ada = not stated.',
      'Soal rekomendasi/strategi: jawabannya di bagian recommendation, bukan arguments.',
    ],
  },
  { jenis: 'callout', tipe: 'peringatan', judul: 'Jebakan ujian', teks: 'Opsi "not stated" sering berbunyi masuk akal dan konsisten dengan topik — tetapi bila teks tak pernah mengatakannya, tetap not stated. Sebaliknya, opsi stated harus punya kalimat pendukung, bukan sekadar sinonim topik.' },
  {
    jenis: 'zona', items: [
      { soal: 'The part of hortatory exposition that tells what should be done is ...', opsi: ['thesis', 'argument', 'recommendation', 're-orientation', 'description'], jawaban: 2, pembahasan: 'Jalur konsep: recommendation = saran tindakan (bank h.92). Jalur Cara Gemilang: SHOULD TEST.' },
      { soal: 'Which sentence uses a recommendation expression?', opsi: ['Waste clogs the drains.', 'Students should bring their own bottles.', 'Plastic was invented in the 20th century.', 'Many people ignore the issue.', 'The river flows into the sea.'], jawaban: 1, pembahasan: 'Jalur konsep: should + verb = expression of recommendation. Jalur Cara Gemilang: modal should = tanda tangan hortatory.' },
      { soal: 'A text argues that screen time harms children and ends by restating that the harm is real, WITHOUT telling what to do. The text is ...', opsi: ['hortatory exposition', 'analytical exposition', 'procedure', 'recount', 'descriptive'], jawaban: 1, pembahasan: 'Jalur konsep: tanpa rekomendasi = analytical (tesis-argumen-reiteration). Jalur Cara Gemilang: SHOULD TEST gagal = analytical.' },
    ],
  },

  // ===== SUBBAB B: POLA SOAL HORTATORY =====
  { jenis: 'judul', teks: 'Hortatory Question Patterns' },
  {
    jenis: 'tabelinfo', judul: 'Pola soal + jurus',
    kolom: ['Pola', 'Penanda', 'Jurus'],
    rows: [
      { k: 'Stated / Not stated', v: '"Which arguments are stated...?"', w: 'Kalimat pendukung harfiah per pernyataan.' },
      { k: 'Recommendation/strategy', v: '"What can ... do based on the text?"', w: 'Bagian recommendation penutup.' },
      { k: 'Inference/prediction', v: '"It can be predicted/inferred..."', w: 'Kelanjutan logis dampak yang disebut.' },
      { k: 'Categorize argumen', v: '"Academic/Career", "Natural/Human"', w: 'Dua kolom aspek dulu, tempel per pernyataan.' },
      { k: 'Summary', v: '"The best summary..."', w: 'Tesis + argumen inti + rekomendasi satu kalimat.' },
      { k: 'Intention/purpose', v: '"The author intention..."', w: 'Mendorong tindakan (should), bukan sekadar informar.' },
    ],
  },
  {
    jenis: 'isianRumpang', judul: '✍️ Isian rumpang: istilah hortatory',
    items: [
      { teks: 'The opening statement of the writer position on an issue is called ...', jawaban: ['thesis'], hint: 'Posisi penulis.', penjelasan: 'Thesis = pernyataan posisi.' },
      { teks: 'The closing part urging action is called ...', jawaban: ['recommendation'], hint: 'Berisi should/must.', penjelasan: 'Recommendation = seruan tindakan.' },
      { teks: 'Should, must, and ought to are ... verbs.', jawaban: ['modal'], hint: 'Kata bantu.', penjelasan: 'Modal verbs penanda rekomendasi.' },
    ],
  },
  { jenis: 'callout', tipe: 'guru', judul: 'Ringkas sendiri', teks: 'Ambil satu isu sekolah (sampah kantin, gadget di kelas), tulis hortatory mini 3 paragraf: thesis-2 argument-recommendation dengan minimal dua modal verb. Tukar dengan teman untuk uji stated/not stated.' },
  { jenis: 'callout', tipe: 'info', judul: 'Siap uji pemahaman', teks: '25 soal resmi bab ini memakai 4 hortatory: manajemen sampah, literasi digital, bahan bakar fosil, dan screen time anak. Peta T-A-R-mu adalah kuncinya.' },
`;

export const META = {
  babJudul: 'Bab 5 — Hortatory Exposition (Edisi Cara Gemilang)',
  babRingkasan: 'Social function persuade-should, struktur thesis-argument-recommendation, language features (modal, passive, evaluative words), pola soal stated-not stated/rekomendasi/inferensi/kategorisasi — dengan jodohkan struktur, benar/salah hortatory-vs-analytical, isian rumpang, CG-HORTATORY, dan 25 soal resmi bank (sampah, literasi digital, fosil, screen time) + pembahasan dua jalur.',
  urutan: 5,
};
