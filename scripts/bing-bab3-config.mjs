// Config bab 2 — RECOUNT TEXT (Bahasa Inggris K12, turn 98)
export const INPUT = '../.ekstrak-bing2.json';
export const OUT_DRAFT = 'docs/drafts/draft-bahasa-inggris-k12-v1-bab3.json';
export const OUT_IMPOT = 'IMPOR-BAHASA-INGGRIS-BAB3-TERBARU.json';
export const BUILDER = 'scripts/build-bing-k12-bab3.mjs';
export const SUMBER_TEKS = 'Bab 2 Recount Text (kunci tabel di HTML, pembahasan di HTML/PDF 08 Pembahasan)';

export const CG = {
  1: 'Trigger = peristiwa penyebab di paragraf pembuka; cari kekhawatiran/fakta yang memulai aksi.',
  2: 'Urutan recount = timeline; susun lewat penanda tahun/paragraf, jangan lewat perasaan.',
  3: 'Alasan = kalimat tujuan ("to ...") di paragraf 1; pilih semua motivasi yang tertulis.',
  4: 'Main idea paragraf = kalimat inti; paragraf 3 = langkah nyata/proyek solusi.',
  5: 'True/False: verifikasi per baris ke paragraf; kata mutlak = False.',
  6: 'Biographical recount = lahir -> karier -> penghargaan -> warisan; ikuti angka tahun.',
  7: '"Primarily known for" = peran utama yang disebut berulang & di penutup.',
  8: 'Tindakan nyata = daftar kerja di paragraf lingkungan (urging, calling, joining).',
  9: 'Why = argumen tokoh: kerusakan lingkungan = ketidakadilan yang timpang.',
  10: 'Categorize: tempel aksi ke eranya (anti-apartheid vs advokasi lingkungan).',
  11: 'Main idea paragraf trek = tantangan fisik (panas, medan batuan).',
  12: 'Purpose recount = to retell past experiences — bukan persuade/procedure.',
  13: 'Conclusion = generalisasi: persiapan logistik + mental = syarat sukses.',
  14: 'Challenges = yang dialami/dihadapi; coret yang tidak terjadi di teks.',
  15: 'Penanda waktu: matahari terik = afternoon; bintang/dingin = nighttime.',
  16: 'Early years = peristiwa awal gerakan; ban plastik 2019 = hasil akhir, bukan awal.',
  17: 'Makna frasa = konteks sekitarnya: "landmark victory" = bersejarah & jadi model.',
  18: 'Ide tersirat = pesan besar: kegigihan anak muda membawa perubahan nyata.',
  19: 'Detail inspiratif = yang bisa ditiru pembaca (platform Youthtopia).',
  20: 'Trigger paragraf 1: video gunungan plastik saat mengikuti kegiatan sekolah.',
  21: 'Significance = titik balik yang memaksa dunia memperhatikan perjuangan RI.',
  22: 'Tahapan = proklamasi -> kedatangan Sekutu -> ultimatum -> pertempuran -> peringatan.',
  23: 'Paragraf terakhir = simbol abadi tekad; cari kalimat penutup bermakna luas.',
  24: 'Why longer = abaikan ultimatum + semangat perlawanan + taktik gerilya.',
  25: 'Bung Tomo = siaran radio pembakar semangat; cek tiap pernyataan ke perannya.',
};

export const SECTIONS = `
  // ===== SUBBAB A: RECOUNT TEXT — DEFINISI & STRUKTUR =====
  { jenis: 'judul', teks: 'Recount Text: Retelling the Past' },
  { jenis: 'kilat', teks: 'A recount text retells the series of events or experiences that happened to the participant in the past in chronological order. Social function: to retell past events or experiences — dari laporan perjalanan sampai biografi tokoh.' },
  { jenis: 'peta', teks: 'Recount adalah saudara narrative yang paling sering tertukar. Bedanya tegas: narrative punya complication-krisis-resolusi (cerita rekaan berkonflik), recount memaparkan urutan kejadian nyata/kronologis. Soal TKA menyukai penukaran ini — kuasai pembedanya dan pola soal urutan waktu.' },
  { jenis: 'paragraf', teks: 'Bayangkan recount sebagai buku harian perjalanan: tanggal dan kejadian tercatat urut apa adanya. Narrative sebaliknya seperti film drama: ada konflik yang memuncak lalu selesai. Buku harian tidak mencari krisis — ia mencatat urutan.' },
  {
    jenis: 'poin', judul: 'Generic structure recount (bank)', items: [
      'Orientation — latar belakang: siapa, kapan, di mana.',
      'Sequence of events — rangkaian peristiwa secara kronologis.',
      'Re-orientation — komentar pribadi penulis tentang peristiwa (penutup opsional).',
    ],
  },
  {
    jenis: 'urutan', judul: '🧩 Susun: generic structure recount',
    items: [
      'Orientation: memperkenalkan peserta, waktu, dan tempat',
      'Sequence of events: menceritakan rangkaian kejadian berurutan',
      'Re-orientation: komentar/penilaian pribadi penulis di penutup',
    ],
  },
  {
    jenis: 'tabelinfo', judul: 'Kinds of recount + contoh di bab ini',
    kolom: ['Jenis', 'Ciri', 'Contoh teks bank'],
    rows: [
      { k: 'Personal recount', v: 'Pengalaman pribadi penulis (sudut "I").', w: 'Perjalanan trek di Outback (teks 3).' },
      { k: 'Factual recount', v: 'Laporan kejadian nyata/informal.', w: 'Aksi iklim Vanessa Nakate (teks 1).' },
      { k: 'Imaginative recount', v: 'Khayalan/imajinasi diceritakan ulang.', w: 'Cerita mimpi atau peran imajiner.' },
      { k: 'Historical recount', v: 'Peristiwa sejarah.', w: 'Pertempuran Surabaya (teks 5).' },
      { k: 'Biographical recount', v: 'Riwayat hidup tokoh.', w: 'Desmond Tutu (teks 2).' },
    ],
  },
  {
    jenis: 'jodohMini', judul: '🔗 Jodohkan: jenis recount dan contohnya',
    items: [
      { kiri: 'Pengalaman trek penulis di Outback', kanan: 'Personal recount' },
      { kiri: 'Laporan aksi iklim Vanessa Nakate', kanan: 'Factual recount' },
      { kiri: 'Riwayat hidup Desmond Tutu', kanan: 'Biographical recount' },
      { kiri: 'Kronologi Pertempuran Surabaya', kanan: 'Historical recount' },
    ],
  },
  {
    jenis: 'benarSalah', judul: '⚖️ Cek pemahaman: recount vs narrative',
    items: [
      { teks: 'Recount text tells events in chronological order.', jawaban: true, penjelasan: 'Definisi bank: chronological order.' },
      { teks: 'Recount wajib memiliki complication seperti narrative.', jawaban: false, penjelasan: 'Complication milik narrative; recount cukup urutan peristiwa.' },
      { teks: 'Re-orientation berisi komentar pribadi penulis dan bersifat opsional.', jawaban: true, penjelasan: 'Struktur ketiga recount.' },
      { teks: 'Language features recount meliputi past tenses dan action verbs.', jawaban: true, penjelasan: 'Fitur bahasa bank: past tenses, action verbs, adverbs of time.' },
    ],
  },
  {
    jenis: 'caraGemilang', judul: '👑 CG-RECOUNT: kronologi adalah raja',
    teks: 'Recount = WHO did WHAT in WHAT order. Semua soal urutan/jadwal/tahap dijawab dengan garis waktu teks, bukan ingatan.',
    items: [
      'Buat timeline kasar di kertas: tahun/penanda waktu per paragraf.',
      'Soal "which list shows the stages" = cocokkan urutan timeline, coret yang melompat.',
      'Soal kategorisasi waktu/peran = tempel tiap pernyataan ke slot timeline atau era tokohnya.',
    ],
  },
  { jenis: 'callout', tipe: 'peringatan', judul: 'Jebakan ujian', teks: 'Penukar narrative vs recount: narrative menekankan krisis & resolusi fiktif; recount menekankan urutan kejadian nyata. Opsi purpose "to persuade/to explain how to" selalu salah untuk recount.' },
  {
    jenis: 'zona', items: [
      { soal: 'The social function of a recount text is ...', opsi: ['to amuse readers with a crisis story', 'to retell past events in chronological order', 'to persuade readers to act', 'to explain how to make something', 'to describe a place in detail'], jawaban: 1, pembahasan: 'Jalur konsep: social function recount = to retell past events/experiences (bank). Jalur Cara Gemilang: CG-RECOUNT — urutan kejadian lampau.' },
      { soal: 'Read the text carefully! Last year, our school team joined a robotics competition. First, we designed the robot. Then, we programmed its sensors. Finally, we presented it to the judges and won the second prize. The generic structure of the text is ...', opsi: ['orientation - events - re-orientation', 'orientation - complication - resolution', 'goal - materials - steps', 'thesis - arguments - reiteration', 'classification - description'], jawaban: 0, pembahasan: 'Jalur konsep: latar (last year, school team) + urutan (first/then/finally) = recount: orientation-events-re-orientation (re-orientation tersirat kemenangan). Jalur Cara Gemilang: penanda first/then/finally = tanda tangan recount.' },
      { soal: 'Which language feature is TYPICAL of recount text?', opsi: ['past tenses and action verbs', 'present tenses and imperatives', 'future tenses and modal of obligation', 'passive voice only', 'direct speech only'], jawaban: 0, pembahasan: 'Jalur konsep: language features recount: past tenses, action verbs, adverbs of time. Jalur Cara Gemilang: cerita lampau = past.' },
    ],
  },

  // ===== SUBBAB B: POLA SOAL RECOUNT =====
  { jenis: 'judul', teks: 'Recount Question Patterns' },
  { jenis: 'kilat', teks: 'Pola soal recount TKA: trigger/why, urutan kronologis, main idea paragraf, purpose, conclusion, categorize (waktu/peran), dan True/False verifikasi. Semuanya dijawab dari garis waktu dan kalimat bukti.' },
  {
    jenis: 'tabelinfo', judul: 'Pola soal + jurus',
    kolom: ['Pola', 'Penanda batang soal', 'Jurus'],
    rows: [
      { k: 'Trigger/why', v: '"What triggered...?", "Why did...?"', w: 'Kalimat sebab di paragraf pemicu.' },
      { k: 'Chronological stages', v: '"Which list shows the key stages...?"', w: 'Timeline tahun/penanda; coret yang melompat.' },
      { k: 'Main idea paragraf', v: '"main idea of the 3rd paragraph"', w: 'Kalimat inti paragraf itu saja.' },
      { k: 'Purpose', v: '"What is the purpose of the text?"', w: 'Retell experiences — bukan persuade/procedure.' },
      { k: 'Conclusion', v: '"What can be concluded...?"', w: 'Generalisasi aman tanpa kata mutlak.' },
      { k: 'Categorize', v: '"Categorize based on when/who..."', w: 'Tempel pernyataan ke slot waktu/era tokoh.' },
    ],
  },
  {
    jenis: 'isianRumpang', judul: '✍️ Isian rumpang: istilah recount',
    items: [
      { teks: 'The closing part containing the writer personal comment is called ...', jawaban: ['re-orientation', 'reorientation'], hint: 'Struktur ketiga.', penjelasan: 'Re-orientation = komentar pribadi penutup.' },
      { teks: 'Recount events are told in ... order.', jawaban: ['chronological'], hint: 'Berurutan sesuai waktu.', penjelasan: 'Chronological = sesuai urutan waktu.' },
      { teks: 'Two typical language features of recount are past tenses and ... verbs.', jawaban: ['action'], hint: 'Kata kerja tindakan.', penjelasan: 'Action verbs menggerakkan rangkaian peristiwa.' },
    ],
  },
  { jenis: 'callout', tipe: 'guru', judul: 'Ringkas sendiri', teks: 'Buat garis waktu 5 teks bab ini (Vanessa, Tutu, Outback, Bye Bye Plastic Bags, Surabaya) masing-masing 4 titik. Garis waktu itu senjata utama semua pola soal recount.' },
  { jenis: 'callout', tipe: 'info', judul: 'Siap uji pemahaman', teks: '25 soal resmi bab ini memakai 5 recount (aktivis iklim, biografi Tutu, trek Outback, gerakan Bye Bye Plastic Bags, Pertempuran Surabaya). Tandai pola tiap soal sebelum menjawab.' },
`;

export const META = {
  babJudul: 'Bab 3 — Recount Text (Edisi Cara Gemilang)',
  babRingkasan: 'Definisi & social function recount, generic structure orientation-events-re-orientation, kinds of recount, pola soal kronologi/kategorisasi/True-False — dengan susun urutan, jodohkan jenis, benar/salah, isian rumpang, dan 25 soal resmi bank (5 teks: Vanessa Nakate, Desmond Tutu, trek Outback, Bye Bye Plastic Bags, Pertempuran Surabaya) + pembahasan dua jalur.',
  urutan: 3,
};

// Salah cetak buku seri ini (ke-4 yang terdokumentasi): kunci ringkas
// no.5 baris-1 mencetak F, tetapi centang tabel pembahasan DAN narasi
// pembahasan ("transition from a quiet graduate into a determined
// activist") menyatakan TRUE. Mengikuti pembahasan.
export const OVERRIDES = { 5: { jaw: [0, 1, 0, 1, 0] } };
export const CATATAN_KUNCI = { 5: ' (Catatan: tabel kunci ringkas buku mencetak "F,F,T,F,T", tetapi centang tabel pembahasan dan narasi pembahasan menyatakan baris 1 TRUE — kutipan "transition from a quiet graduate into a determined activist"; kami mengikuti pembahasan.)' };
