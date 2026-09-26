// scripts/build-bindo-k12-bab1.mjs
// ============================================================
// BUILDER MATERI: BAHASA INGGRIS WAJIB K12 — BAB 1 NARRATIVE TEXT (Turn 98)
// Sumber: narrative-text.html (bank owner; buku seri Sukses TKA h.71+)
// + kunci tabel di HTML + pembahasan di HTML/PDF "08 Pembahasan".
// Kerangka helper diwarisi build-bindo-k12-bab1.mjs (generate turn 98).
// ============================================================
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const E = JSON.parse(readFileSync(process.argv[2] || '../.ekstrak-bing1.json', 'utf-8'));

const OCR_FIX = [
  ['meneruskan', 'meneruskan'], // placeholder aman
];
function perbaiki(t) {
  let s = String(t);
  for (const [a, b] of OCR_FIX) s = s.split(a).join(b);
  return s.replace(/ {2,}/g, ' ').trim();
}

// ---------- stimulus ----------
function teksStimulus(i) {
  const s = E.stimuli[i];
  return s.paragraf.map(perbaiki).join('\n\n') + (s.sumber ? `\n\n${perbaiki(s.sumber)}` : '');
}

// ---------- kunci (format buku Inggris: huruf, (n,n), T/F, N/O, I/E) ----------
const hurufIdx = (h) => 'ABCDE'.indexOf(String(h).trim().toUpperCase());
function kunciDariPembahasan(no, s) {
  const p = E.pembahasan[no - 1];
  const jw = (p.teks.match(/Jawaban:\s*([\s\S]*)$/) || [])[1] || '';
  if (s.tipe === 'pg') {
    const m = /^([A-E])\b/.exec(jw.trim());
    if (!m) throw new Error(`soal ${no}: pembahasan tanpa kunci huruf (${jw.slice(0, 40)})`);
    return hurufIdx(m[1]);
  }
  if (s.tipe === 'pgMulti') {
    const nums = jw.match(/\d+/g) || [];
    return nums.map((n) => Number(n) - 1);
  }
  if (!p.tabel) throw new Error(`soal ${no}: tabel pembahasan hilang`);
  return p.tabel.map((r) => (r.benar ? 0 : 1));
}
function kunciTabelRingkas(no, kolom, tipe) {
  const raw = String(E.kunci[no] || '').trim();
  if (!raw) return null;
  if (tipe === 'pgMulti') {
    const m = /\(([\d,\s]+)\)/.exec(raw);
    if (!m) return null;
    return m[1].split(',').map((x) => Number(x.trim()) - 1);
  }
  if (tipe === 'pg') return /^[A-E]$/i.test(raw) ? [hurufIdx(raw)] : null;
  const toks = raw.split(',').map((x) => x.trim().toUpperCase());
  return toks.map((t) => {
    if (t === 'TS') return kolom.findIndex((k) => /^(tidak|not)/i.test(k));
    return kolom.findIndex((k) => k.toUpperCase().startsWith(t[0]));
  });
}
const CG = {
  1: 'Topik = frasa yang mewadahi SELURUH teks; lihat judul + peristiwa berulang, jangan terjebak detail satu paragraf.',
  2: 'Inference = kesimpulan tak tertulis; tarik dari rantai sebab-akibat cerita (pernikahan terlarang -> kehancuran).',
  3: 'Reference: cari subjek terdekat SEBELUM kata ganti; "He was transformed" = raja yang dikutuk, King U-Lue.',
  4: 'True/False = cocokkan kata per kata dengan kalimat teks; satu saja meleset (all/never/only) = False.',
  5: 'Moral = pelajaran yang bisa digeneralisasi; coret opsi yang memuji kekayaan atau kekerasan sebagai solusi.',
  6: 'Closest meaning = substitusi ke kalimat: prosperity (kemakmuran kota) = wealth.',
  7: 'Main idea naratif = siapa + melewati apa: putri penggiling bertahan melewati berbagai penderitaan.',
  8: 'Soal "according to the text": lokalkan kata kunci (could not touch) -> kalimat jawabannya di sebelahnya (tangan bersih/suci).',
  9: 'Challenges = peristiwa yang MENIMPA tokoh; coret aksi yang tidak pernah ia lakukan (bertaruh melawan penyihir).',
  10: 'Hermitage = tempat berlindung yang sunyi -> secluded retreat; kunci konteks "seeking refuge".',
  11: 'Reference: subjek pelaku "ordered his finest smiths" = raja muda, bukan miller/penyihir.',
  12: 'True/False: verifikasi per pernyataan; "miller tahu sejak awal" = False (ia tidak tahu berurusan dengan penyihir).',
  13: 'Moral value biasanya di paragraf resolusi/penutup cerita.',
  14: 'Tone = sikap penulis: reflective = mengajak merenung; cari kata emosi dominan, bukan isi peristiwa.',
  15: 'Purpose naratif = to amuse/entertain + mengajar moral -> pilih "to teach readers the importance of...".',
  16: 'Conclusion = rangkuman yang digeneralisasi: nilai itu subjektif (Owl & Nightingale berdua berguna).',
  17: 'Trace the speaker: tandai kalimat milik Owl vs Nightingale; opsi pandangan Owl harus dari mulut Owl.',
  18: 'Categorize: tempel tiap ciri pada burung yang MENGUCAPKANNYA di teks.',
  19: 'Primary concern = alur utama keseluruhan: perjalanan Inanna ke dunia bawah, bukan detail gerbang/hukum.',
  20: 'Purpose mitologi/naratif = teach + tell + entertain; laporan ilmiah/persuasi = pengecoh.',
  21: 'Kesimpulan per paragraf: fokus paragraf 3 = strategi Enki -> revival "through" makhluk ciptaannya.',
  22: 'Main idea paragraf = inti prosesnya: Inanna dilucuti simbol kekuasaan gerbang demi gerbang.',
  23: 'Consequences = akibat setelah peristiwa; "permanent state" jebakan (teks: siklus, bukan permanen).',
  24: 'True/False: cek instruksi Inanna ke pelayan (paragraf 1) dan detail kebangkitan (paragraf 3).',
  25: 'Categorize Inanna vs Ereshkigal: ratu langit vs ratu dunia bawah; tempelkan aksi ke pelakunya.',
};
const CATATAN_KUNCI = {};
function buatPembahasan(no, s, jawaban) {
  const p = E.pembahasan[no - 1];
  let konsep;
  if (s.tipe === 'tabel' && p.tabel) {
    konsep = p.tabel.map((r, i) => {
      const lab = s.kolom[jawaban[i]].toUpperCase();
      const ket = perbaiki(r.ket);
      return `Baris ${i + 1} — ${lab}${ket ? ': ' + ket : ''}`;
    }).join(' ');
  } else {
    konsep = perbaiki(p.teks.replace(/Jawaban:[\s\S]*$/, ''));
  }
  return `Jalur konsep: ${konsep}${CATATAN_KUNCI[no] || ''} Jalur Cara Gemilang: ${CG[no]}`;
}


// ---------- sections (penataan ulang premium) ----------
const sections = [
  // ===== SUBBAB A: NARRATIVE TEXT — DEFINISI & ANATOMI =====
  { jenis: 'judul', teks: 'Narrative Text: Definition & Anatomy' },
  { jenis: 'kilat', teks: 'A narrative text is a story describing a sequence of fictional or non-fictional events in a constructive format. Social function: to amuse and entertain the reader with a story of complication leading to crisis and resolution, sambil menyelipkan moral lesson.' },
  { jenis: 'peta', teks: 'Narrative adalah tipe teks paling sering keluar di TKA Bahasa Inggris: pola soalnya berulang — topic/main idea, inference, reference, moral value, closest meaning, True/False, dan categorize. Menguasai anatomi narrative (struktur + language features) membuat semua pola itu jadi pemetaan, bukan tebakan.' },
  { jenis: 'paragraf', teks: 'Bayangkan narrative seperti rangkaian domino yang jatuh: setiap peristiwa menyenggol peristiwa berikutnya karena sebab-akibat, menuju satu krisis, lalu resolusi. Domino yang tidak menyenggol apa-apa itulah detail pengecoh di opsi jawaban.' },
  {
    jenis: 'poin', judul: 'Generic structure (bank h.71)', items: [
      'Orientation — memperkenalkan tokoh dan menggambarkan latar (setting).',
      'Complication — memunculkan situasi masalah/konflik hingga krisis.',
      'Resolution — penyelesaian masalah (baik atau buruk).',
      'Coda — menunjukkan perubahan tokoh dan pelajaran yang dipetik (opsional).',
    ],
  },
  {
    jenis: 'urutan', judul: '🧩 Susun: generic structure narrative',
    keterangan: 'Urutkan dari pembukaan cerita sampai penutup.',
    items: [
      'Orientation: tokoh & latar diperkenalkan',
      'Complication: konflik muncul dan memuncak',
      'Resolution: masalah terselesaikan',
      'Coda: perubahan tokoh & pelajaran terlihat',
    ],
  },
  {
    jenis: 'tabelinfo', judul: 'Kinds of narrative text + contoh cepat',
    kolom: ['Jenis', 'Ciri', 'Contoh'],
    rows: [
      { k: 'Fairy tale', v: 'Cerita ajaib bertokoh fantasi, sering "once upon a time".', w: 'Cinderella, putri & peri.' },
      { k: 'Legend', v: 'Asal-usul tempat/benda yang dipercaya masyarakat.', w: 'Legenda Gua Naka (teks 1 bab ini).' },
      { k: 'Myth', v: 'Cerita dewa-dewi & kepercayaan kuno.', w: 'Perjalanan Inanna ke dunia bawah (Sumeria).' },
      { k: 'Fable', v: 'Tokoh binatang berperilaku manusia.', w: 'Kisah Owl & Nightingale (teks 3).' },
      { k: 'Science fiction', v: 'Sains/teknologi imajinatif masa depan.', w: 'Perjalanan antariksa, robot.' },
      { k: 'Fantasy', v: 'Dunia imajiner dengan aturan ajaib.', w: 'Tangan perak & penyihir (teks 2).' },
      { k: 'Historical fiction', v: 'Latar peristiwa sejarah dengan tokoh rekaan.', w: 'Novel berlatar kerajaan Nusantara.' },
    ],
  },
  {
    jenis: 'jodohMini', judul: '🔗 Jodohkan: struktur dan fungsinya',
    items: [
      { kiri: 'Introduces the characters and describes the setting', kanan: 'Orientation' },
      { kiri: 'Introduces the crisis-provoking situation', kanan: 'Complication' },
      { kiri: 'Resolves the problem', kanan: 'Resolution' },
      { kiri: 'Shows how the character has changed and what was learnt', kanan: 'Coda' },
    ],
  },
  {
    jenis: 'flashcard', judul: '🃏 Flashcard: language features narrative',
    items: [
      { depan: 'Past tenses', belakang: 'Kata kerja bentuk lampau: was/were, -ed, irregular (went, stole).' },
      { depan: 'Temporal conjunctions', belakang: 'Penghubung waktu: then, after that, meanwhile, once upon a time.' },
      { depan: 'Saying & thinking verbs', belakang: 'said, told, thought, wondered — mengutip ucapan/pikiran tokoh.' },
      { depan: 'Adverbs & adverbial phrases of time', belakang: 'once upon a time, long ago, one day.' },
      { depan: 'Behavioral & verbal processes', belakang: 'Kata kerja tindakan & ucapan tokoh yang menggerakkan cerita.' },
      { depan: 'Quoted & reported speech', belakang: '"Jangan masuk!" serunya = quoted; ia melarangnya = reported.' },
    ],
  },
  {
    jenis: 'benarSalah', judul: '⚖️ Cek pemahaman: narrative basics',
    keterangan: 'Gemilang Drill — pemanasan sebelum zona berlatih.',
    items: [
      { teks: 'Narrative text uses past tenses as its typical verb form.', jawaban: true, penjelasan: 'Language features bank: past tenses.' },
      { teks: 'Complication is the part where the crisis develops.', jawaban: true, penjelasan: 'Complication memperkenalkan situasi problematik menuju krisis.' },
      { teks: 'Every narrative text must contain a coda.', jawaban: false, penjelasan: 'Coda opsional; banyak cerita berhenti di resolution.' },
      { teks: 'Social function narrative is to describe how to make something.', jawaban: false, penjelasan: 'Itu procedure; narrative = to amuse/entertain + moral.' },
    ],
  },
  {
    jenis: 'caraGemilang', judul: '👑 CG-NARRATIVE: O-C-R-C + moral di tutup',
    teks: 'Kunci narrative: struktur Orientation-Complication-Resolution-(Coda); past tenses; moral value cari di RESOLUTION/CODA; reference cari subjek terdekat sebelum kata ganti.',
    items: [
      'Soal struktur/urutan: petakan paragraf ke O-C-R-C dulu sebelum menjawab.',
      'Soal moral: baca paragraf terakhir; moral = pelajaran universal, bukan ringkasan plot.',
      'Soal reference: mundur satu-dua kalimat, cari subjek yang sedang dibicarakan.',
    ],
  },
  { jenis: 'callout', tipe: 'peringatan', judul: 'Jebakan ujian', teks: 'Opsi inference/conclusion yang memakai kata mutlak (always, never, only, permanent) hampir pasti salah. Moral value juga sering dijebak dengan ringkasan peristiwa — moral harus berupa pelajaran hidup yang bisa dipakai pembaca.' },
  {
    jenis: 'zona', items: [
      { soal: 'Which part of a narrative text introduces the characters and the setting?', opsi: ['Orientation', 'Complication', 'Resolution', 'Coda', 'Evaluation'], jawaban: 0, pembahasan: 'Jalur konsep: orientation memperkenalkan tokoh & latar (bank h.71). Jalur Cara Gemilang: CG-NARRATIVE — O pertama.' },
      { soal: 'Read the text carefully! Once upon a time, a greedy merchant refused to share his food with the starving villagers. One night his warehouse burned down, and he learned that wealth means nothing without kindness. What is the moral value of the story?', opsi: ['Warehouses must be guarded at night.', 'Greed leads to loss; kindness gives wealth its meaning.', 'Villagers should always help merchants.', 'Fire is the best teacher of discipline.', 'Wealth is a sign of hard work.'], jawaban: 1, pembahasan: 'Jalur konsep: krisis (gudang terbakar) mengajarkan penyesalan atas keserakahan -> moral tentang kebaikan. Jalur Cara Gemilang: moral di resolusi, berupa pelajaran universal.' },
      { soal: '"The queen was furious when she discovered the missing necklace." The closest meaning of "furious" is ...', opsi: ['calm', 'confused', 'very angry', 'slightly annoyed', 'delighted'], jawaban: 2, pembahasan: 'Jalur konsep: furious = sangat marah (intensitas tinggi). Jalur Cara Gemilang: substitusi opsi ke kalimat; pilih yang menjaga intensitas emosi.' },
    ],
  },

  // ===== SUBBAB B: POLA SOAL NARRATIVE & JURUSNYA =====
  { jenis: 'judul', teks: 'Question Patterns & How to Conquer Them' },
  { jenis: 'kilat', teks: 'Soal narrative TKA berulang di delapan pola: topic/main idea, inference, reference, moral value, tone, purpose, closest meaning, dan True/False-categorize. Setiap pola punya jurus pencarian yang sama: lokalisasi bukti, lalu eliminasi pengecoh ekstrem.' },
  {
    jenis: 'tabelinfo', judul: '8 pola soal + jurus Gemilang',
    kolom: ['Pola soal', 'Petunjuk di batang soal', 'Jurus'],
    rows: [
      { k: 'Topic / main idea', v: '"What is the topic/main idea...?"', w: 'Rangkum seluruh teks satu frasa; cek judul + peristiwa berulang.' },
      { k: 'Inference / conclusion', v: '"What can be inferred/concluded...?"', w: 'Rantai sebab-akibat; coret opsi ber-kata mutlak.' },
      { k: 'Reference', v: '"The word \"He\" refers to..."', w: 'Subjek terdekat sebelum kata ganti.' },
      { k: 'Moral value', v: '"What is the moral value...?"', w: 'Paragraf resolusi/coda; pelajaran universal.' },
      { k: 'Tone', v: '"What is the tone...?"', w: 'Sikap penulis lewat kata emosi dominan.' },
      { k: 'Purpose', v: '"What is the purpose...?"', w: 'Narrative = amuse/entertain + teach moral.' },
      { k: 'Closest meaning', v: '"The closest meaning of ..."', w: 'Substitusi opsi ke kalimat konteks.' },
      { k: 'True/False & categorize', v: '"Decide whether... / Categorize..."', w: 'Verifikasi per baris; tempel ciri ke pelaku/pembicara.' },
    ],
  },
  {
    jenis: 'isianRumpang', judul: '✍️ Isian rumpang: istilah narrative',
    items: [
      { teks: 'The part of a narrative where the problem is solved is called the ...', jawaban: ['resolution'], hint: 'Setelah komplikasi.', penjelasan: 'Resolution = penyelesaian masalah.' },
      { teks: 'The optional closing part that shows the character change is the ...', jawaban: ['coda'], hint: 'Berupa pelajaran yang dipetik.', penjelasan: 'Coda menutup dengan perubahan tokoh.' },
      { teks: 'Narrative texts typically use ... tenses.', jawaban: ['past'], hint: 'Bentuk lampau.', penjelasan: 'Language features: past tenses.' },
    ],
  },
  { jenis: 'callout', tipe: 'guru', judul: 'Ringkas sendiri', teks: 'Tulis satu kartu CG-NARRATIVE versimu: struktur O-C-R-C, tiga pola soal tersulitmu, dan satu contoh bukti teks untuk masing-masing. Bawa kartu itu ke sesi ujian berikutnya.' },
  { jenis: 'callout', tipe: 'info', judul: 'Siap uji pemahaman', teks: '25 soal resmi bab ini memakai 4 teks narrative (legenda Gua Naka, gadis bertangan perak, Owl & Nightingale, mitologi Inanna). Beri label pola soal di tiap nomor sebelum menjawab — kecepatan naik drastis setelah pola dikenali.' },
];

// ---------- rakit soal ----------
// Turn 90 (koreksi owner): opsi bagan soal 4, 16, 18 pada cetakan/HTML
// asli berupa GAMBAR SVG — diekstrak ke public/bagan/ lewat
// scripts/ekstrak-bagan-svg.mjs; teks opsi menjadi keterangan kecil.
const OPSI_GAMBAR = {
  4: ['a', 'b', 'c', 'd', 'e'].map((h) => `/bagan/bab1-s4-${h}.svg`),
  16: ['a', 'b', 'c', 'd', 'e'].map((h) => `/bagan/bab1-s16-${h}.svg`),
  18: ['a', 'b', 'c', 'd', 'e'].map((h) => `/bagan/bab1-s18-${h}.svg`),
};
const SUMBER = 'Bank owner: Sukses Tes Kemampuan Akademik SMA/Saintek, Bab 1 Narrative Text h.71+ (kunci tabel di HTML, pembahasan di HTML/PDF 08 Pembahasan); kunci & pembahasan buku (soal asli #{no})';
const ujiPemahaman = E.soal.map((s0) => {
  const no = s0.no;
  const s = { ...s0, teks: perbaiki(s0.teks), opsi: s0.opsi.map(perbaiki), baris: s0.baris.map(perbaiki), kolom: s0.kolom.map(perbaiki) };
  const jawaban = kunciDariPembahasan(no, s);
  const kr = kunciTabelRingkas(no, s.kolom, s.tipe);
  if (kr) {
    const sama = s.tipe === 'pg' ? kr[0] === jawaban
      : (kr.length === jawaban.length && kr.every((v, i) => v === jawaban[i]));
    if (!sama) throw new Error(`soal ${no}: kunci pembahasan vs tabel ringkas beda (${kr} vs ${jawaban})`);
  }
  if (s.tipe === 'pg' && (jawaban < 0 || jawaban >= s.opsi.length)) throw new Error(`soal ${no} kunci pg di luar opsi`);
  if (s.tipe === 'pgMulti' && jawaban.some((j) => j < 0 || j >= s.opsi.length)) throw new Error(`soal ${no} kunci multi di luar opsi`);
  const kepala = s.mandiri ? '' : `Read the following text carefully!\n\n${teksStimulus(s.grup)}\n\n`;
  let soalTeks = kepala + s.teks;
  if (s.tipe === 'pgMulti' && !/more than one correct/.test(soalTeks)) {
    soalTeks += '\n\nThere is more than one correct answer. Choose every correct option.';
  }
  if (s.tipe === 'tabel') {
    soalTeks += `\n(Answer each row by choosing ${s.kolom.join(' / ')}.)`;
  }
  return {
    soal: soalTeks, tipe: s.tipe,
    ...(s.tipe === 'tabel' ? { kolom: s.kolom, baris: s.baris } : { opsi: s.opsi }),
    ...(OPSI_GAMBAR[no] ? { opsiGambar: OPSI_GAMBAR[no] } : {}),
    jawaban,
    pembahasan: buatPembahasan(no, s, jawaban),
    sumber: SUMBER.replace('{no}', String(no)),
  };
});

// ---------- metadata ----------
const draft = {
  materi: {
    judul: 'Bahasa Inggris Wajib SMA — Persiapan TKA 2026 (Edisi Cara Gemilang)',
    mapel: 'Bahasa Inggris', kelas: '12', jenjang: 'sma', program: 'semua',
    premium: false, warna: '#059669', emoji: '🗣️',
    deskripsi: 'Materi wajib kelas 12 seri TKA Bahasa Inggris: narrative, recount, procedure, analytical exposition, dan infographic reading. Impor bab tambahan pakai mode "tambah" pada materi ini.',
    urutan: 6, status: 'draft',
    daftarPustaka: [
      'Bank owner: salinan digital HTML bab 1,3,4,6,7 buku seri Sukses TKA SMA (narrative h.71+ dll) + tabel kunci di tiap HTML + pembahasan di HTML/PDF "08 Pembahasan"; kunci mengikuti cetakan asli.',
      'Sumber teks adaptasi per stimulus tercantum pada masing-masing teks (mis. thailand.go.th).',
      'Kartu CG-NARRATIVE, tabel pola soal, dan Zona Berlatih = Gemilang Drill tim Gemilang mengikuti pola soal bank owner.',
      'Skema widget interaktif: docs/MATERI-INTERAKTIF.md (turn 87).',
    ],
  },
  bab: [{
    judul: 'Bab 1 — Narrative Text (Edisi Cara Gemilang)',
    ringkasan: 'Definisi & social function narrative, generic structure O-C-R-C, language features, kinds of narrative, plus 8 pola soal TKA dan jurusnya — dengan susun urutan struktur, jodohkan fungsi, flashcard language features, benar/salah, isian rumpang, dan 25 soal resmi bank (4 teks) + pembahasan dua jalur.',
    estimasiMenit: 75, urutan: 1, tipe: 'teks',
    sections, ujiPemahaman,
  }],
};

const json = JSON.stringify(draft, null, 2);
if (/[\u3400-\u4E00\u3040-\u30FF\uAC00-\uD7AF]/u.test(json)) { console.error('AKSARA ASING!'); process.exit(1); }
for (const sec of sections) {
  if (sec.jenis === 'paragraf') {
    const n = (sec.teks.match(/(?<=[.!?])\s+[A-Z"“]/g) || []).length + 1;
    if (n > 3) { console.error('paragraf >3 kalimat:', sec.teks.slice(0, 50)); process.exit(1); }
  }
}
ujiPemahaman.forEach((q, i) => {
  if (!q.pembahasan.includes('Jalur konsep:') || !q.pembahasan.includes('Jalur Cara Gemilang:')) { console.error('soal', i + 1, 'tidak dua jalur'); process.exit(1); }
});
function nested(v) { if (Array.isArray(v)) return v.some((x) => Array.isArray(x) || nested(x)); if (v && typeof v === 'object') return Object.values(v).some(nested); return false; }
if (nested(draft.bab)) { console.error('nested array!'); process.exit(1); }

const outDraft = join(ROOT, 'docs/drafts/draft-bahasa-inggris-k12-v1-bab1.json');
const outImpor = join(ROOT, 'IMPOR-BAHASA-INGGRIS-BAB1-TERBARU.json');
writeFileSync(outDraft, json + '\n');
writeFileSync(outImpor, json + '\n');
console.log('SELESAI bing bab1 | sections:', sections.length, '| soal:', ujiPemahaman.length, '| ukuran:', (json.length / 1024).toFixed(1), 'KB');
