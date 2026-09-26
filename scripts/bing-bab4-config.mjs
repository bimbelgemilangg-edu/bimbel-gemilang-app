// Config bab 4 — PROCEDURE TEXT (Bahasa Inggris K12, turn 98)
export const INPUT = '../.ekstrak-bing3.json';
export const OUT_DRAFT = 'docs/drafts/draft-bahasa-inggris-k12-v1-bab4.json';
export const OUT_IMPOT = 'IMPOR-BAHASA-INGGRIS-BAB4-TERBARU.json';
export const BUILDER = 'scripts/build-bing-k12-bab4.mjs';
export const SUMBER_TEKS = 'Bab 4 Procedure Text h.88+ (kunci tabel di HTML, pembahasan di HTML/PDF 08 Pembahasan)';

export const CG = {
  1: 'Supported statements = cocokkan per pernyataan ke langkah manual; yang menambah aturan baru = salah.',
  2: 'Intention penulis procedure = memandu cara mengoperasikan (how to), langkah demi langkah.',
  3: 'Soal "what might happen if" = cari kalimat peringatan/konsekuensi di langkah terkait.',
  4: 'Troubleshooting = ikuti urutan pemeriksaan manual: cek dudukan/charging dock lebih dulu.',
  5: 'Why sebuah langkah = klausa tujuan di langkah itu ("so that / in order to / untuk").',
  6: 'Reference "it" = benda terdekat sebelumnya yang logis diganti (dust bag).',
  7: 'True/False prosedur: urutan terbalik atau alat salah = False.',
  8: 'Purpose tips keuangan = mengedukasi cara mengelola uang (how to manage).',
  9: 'Mengabaikan tips lain = rentan biaya tak terduga (dana darurat hilang).',
  10: 'Makna frasa kontekstual: "guard your health" = hindari biaya medis besar.',
  11: '"Know where your money goes" = catat & pahami arus pengeluaran.',
  12: 'Percakapan keluarga = ruang aman anak berlatih & bertanya soal uang.',
  13: 'Anak kesulitan = terpapar keuangan digital sebelum paham dasar.',
  14: 'Problem = hambatan/risiko; Solution = tindakan/strategi yang disarankan.',
  15: 'Risiko tanpa edukasi = kebiasaan belanja digital impulsif.',
  16: 'Dua strategi pada perilaku: mencatat pembelian + meninjau total mingguan.',
  17: 'What is the text about = goal pada judul: how to set up Nest Hub.',
  18: 'Urutan: konektor "then/next" setelah membuka app = tap "Set up one device".',
  19: 'Fitur tambahan penutup: operasi suara lewat Google Assistant bawaan.',
  20: 'Dampak melewatkan langkah = fungsi yang tak jalan (streaming & personalisasi).',
  21: '"Both ... them" = dua perangkat yang disebut: Nest Hub & Nest Hub Max.',
  22: 'Tujuan look up words = memahami kata/ungkapan tak dikenal saat menonton.',
  23: 'Tips speaking = mengucapkan kalimat keras-keras + memakai dalam percakapan.',
  24: 'Passive = menerima (menonton); Active = memproduksi/berinteraksi (berbicara, menulis, berlatih).',
  25: 'look up = mencari makna (di kamus/sumber) -> discover closest.',
};

export const SECTIONS = `
  // ===== SUBBAB A: PROCEDURE TEXT — RESEP & MANUAL =====
  { jenis: 'judul', teks: 'Procedure Text: How to Make, Do, and Operate' },
  { jenis: 'kilat', teks: 'Procedure text tells HOW to make/do/use/operate something through a sequence of steps. Social function: memberi panduan langkah demi langkah agar tujuan tercapai — dari resep sampai manual robot vacuum.' },
  { jenis: 'peta', teks: 'Soal procedure di TKA jarang tentang hafalan — ia menguji logika urutan: what comes next, what if a step is skipped, what does "it/then" refer to, dan kategorisasi problem-solution atau passive-active. Kuasai penanda urutan dan kalimat imperatif, semuanya terpeta.' },
  { jenis: 'paragraf', teks: 'Procedure adalah resep masakan: judul = goal, bahan = materials, cara memasak = steps. Satu langkah terbalik saja, kue gagal — begitu juga soal "what should be checked first".' },
  {
    jenis: 'poin', judul: 'Generic structure (bank h.88)', items: [
      'Goal — judul bertujuan: how to ... (membuat/melakukan/mengoperasikan).',
      'Materials — bahan/alat/peralatan yang dibutuhkan (tidak selalu ada).',
      'Steps — metode berurutan menuju goal.',
    ],
  },
  {
    jenis: 'tabelinfo', judul: 'Language features + contoh',
    kolom: ['Fitur', 'Contoh'],
    rows: [
      { k: 'Imperative sentences', v: 'Press the button; Plug in the dock; Don\\'t skip this step.' },
      { k: 'Action verbs', v: 'install, change, place, tap, record.' },
      { k: 'Sequence connectors', v: 'first, then, after that, finally.' },
      { k: 'Sequence adverbs', v: 'once it is worn out, before using, while charging.' },
      { k: 'Simple present tense', v: 'The light turns green when fully charged.' },
    ],
  },
  {
    jenis: 'urutan', judul: '🧩 Susun: langkah memasang & menguji robot vacuum (adaptasi teks 1)',
    keterangan: 'Urutkan seperti manual: pemasangan dulu, lalu pemetaan.',
    items: [
      'Install the side brush until it clicks',
      'Place the charging dock against a wall and plug it in',
      'Put the robot on the dock until the light turns green',
      'Run the first mapping session so the robot learns the layout',
    ],
  },
  {
    jenis: 'jodohMini', judul: '🔗 Jodohkan: fitur bahasa dan contohnya',
    items: [
      { kiri: 'Press and hold for three seconds', kanan: 'Imperative sentence' },
      { kiri: 'then, after that, finally', kanan: 'Sequence connector' },
      { kiri: 'install, place, tap', kanan: 'Action verb' },
      { kiri: 'once it is worn out', kanan: 'Sequence adverb' },
    ],
  },
  {
    jenis: 'benarSalah', judul: '⚖️ Cek pemahaman: procedure basics',
    items: [
      { teks: 'The goal of a procedure text is usually expressed in the title ("How to ...").', jawaban: true, penjelasan: 'Goal = judul bertujuan.' },
      { teks: 'Steps may be presented in any order as long as all are included.', jawaban: false, penjelasan: 'Urutan adalah inti procedure; terbalik = gagal.' },
      { teks: 'Imperative sentences are the typical mood of procedure steps.', jawaban: true, penjelasan: 'Perintah langsung kepada pembaca.' },
      { teks: 'Materials section is mandatory in every procedure text.', jawaban: false, penjelasan: 'Tips/kiat (seperti teks keuangan) bisa tanpa materials.' },
    ],
  },
  {
    jenis: 'caraGemilang', judul: '👑 CG-PROCEDURE: GARIS LANGKAH',
    teks: 'Buat garis langkah 1..n di kertas buram saat membaca; semua soal urutan/reference/troubleshooting dijawab dari garis itu.',
    items: [
      'Nomori langkah saat membaca pertama kali (1,2,3...).',
      'Soal "right after X" = lihat langkah n+1 di garismu.',
      'Soal "if X fails/skipped" = cari konsekuensi di kalimat peringatan langkah itu atau langkah berikutnya.',
      'Reference it/them/both = benda/perangkat terdekat sebelumnya yang cocok secara logika.',
    ],
  },
  { jenis: 'callout', tipe: 'peringatan', judul: 'Jebakan ujian', teks: 'Pengecoh favorit: menukar urutan dua langkah yang "keduanya masuk akal" (pasang sikat vs letakkan dock). Kembali ke konektor teks (first/then/after that), bukan logika rumah tangga.' },
  {
    jenis: 'zona', items: [
      { soal: 'The section that lists the tools or ingredients needed is called ...', opsi: ['goal', 'materials', 'steps', 're-orientation', 'identification'], jawaban: 1, pembahasan: 'Jalur konsep: materials = bahan/alat (bank h.88). Jalur Cara Gemilang: struktur G-M-S.' },
      { soal: 'Read the steps! (1) Plug in the kettle. (2) Fill it with water to the max line. (3) Close the lid. (4) Press the switch. Which order is correct according to safe procedure?', opsi: ['1-2-3-4', '2-3-1-4', '2-1-3-4', '3-2-1-4', '4-3-2-1'], jawaban: 1, pembahasan: 'Jalur konsep: isi air dulu sebelum listrik (aman), tutup, baru nyalakan; menancapkan colokan setelah terisi menghindari pemanasan kosong. Jalur Cara Gemilang: garis langkah + logika keselamatan.' },
      { soal: '"Change the filter once it is worn out." The phrase "once it is worn out" functions as ...', opsi: ['a sequence adverb of condition/time', 'a goal', 'an imperative', 'a material', 'a conclusion'], jawaban: 0, pembahasan: 'Jalur konsep: penanda waktu/syarat urutan = sequence adverb. Jalur Cara Gemilang: CG-PROCEDURE — penanda urutan bukan langkah.' },
    ],
  },

  // ===== SUBBAB B: POLA SOAL PROCEDURE =====
  { jenis: 'judul', teks: 'Procedure Question Patterns' },
  {
    jenis: 'tabelinfo', judul: 'Pola soal + jurus',
    kolom: ['Pola', 'Penanda', 'Jurus'],
    rows: [
      { k: 'Next/after step', v: '"What should be done right after...?"', w: 'Garis langkah; jawab n+1.' },
      { k: 'Troubleshooting', v: '"If X fails, what to check first?"', w: 'Kalimat peringatan/langkah pemeriksaan pertama.' },
      { k: 'Why a step', v: '"Why does ... need to ...?"', w: 'Klausa tujuan (so that/in order to). ' },
      { k: 'Reference', v: '"The word it/them refers to..."', w: 'Benda terdekat sebelumnya yang logis.' },
      { k: 'Categorize', v: '"Problem/Solution", "Passive/Active"', w: 'Buat dua kolom aspek dulu.' },
      { k: 'Purpose', v: '"The purpose of the text is..."', w: 'To tell/how to guide — panduan langkah.' },
    ],
  },
  {
    jenis: 'isianRumpang', judul: '✍️ Isian rumpang: istilah procedure',
    items: [
      { teks: 'The title section "How to ..." expresses the ... of a procedure text.', jawaban: ['goal'], hint: 'Tujuan/hasil akhir.', penjelasan: 'Goal = judul bertujuan.' },
      { teks: 'Connectors like "then" and "after that" are called ... connectors.', jawaban: ['sequence'], hint: 'Berkenaan dengan urutan.', penjelasan: 'Sequence connectors penanda urutan.' },
      { teks: 'Sentences that give commands directly to the reader are ... sentences.', jawaban: ['imperative'], hint: 'Berupa perintah.', penjelasan: 'Imperative = kalimat perintah.' },
    ],
  },
  { jenis: 'callout', tipe: 'guru', judul: 'Ringkas sendiri', teks: 'Ambil manual benda di rumahmu (setrika, router, rice cooker), tulis ulang sebagai procedure 4 langkah berbahasa Inggris dengan satu sequence adverb dan satu kalimat peringatan — lalu tukar dengan teman untuk diuji soal "what if".' },
  { jenis: 'callout', tipe: 'info', judul: 'Siap uji pemahaman', teks: '25 soal resmi bab ini memakai 5 procedure: manual robot vacuum, tips keuangan pribadi, literasi keuangan anak, setup Google Nest Hub, dan tips belajar bahasa lewat film. Garis langkahmu adalah senjatanya.' },
`;

export const META = {
  babJudul: 'Bab 4 — Procedure Text (Edisi Cara Gemilang)',
  babRingkasan: 'Social function & struktur goal-materials-steps, language features (imperative, sequence connectors/adverbs), pola soal urutan/troubleshooting/reference/kategorisasi — dengan susun urutan manual, jodohkan fitur bahasa, benar/salah, isian rumpang, CG-PROCEDURE, dan 25 soal resmi bank (robot vacuum, tips keuangan, literasi anak, setup Nest Hub, tips belajar bahasa) + pembahasan dua jalur.',
  urutan: 4,
};
