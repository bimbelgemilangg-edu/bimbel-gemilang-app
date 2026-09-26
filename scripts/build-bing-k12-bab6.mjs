// scripts/build-bindo-k12-bab1.mjs
// ============================================================
// BUILDER MATERI: BAHASA INGGRIS WAJIB K12 — BAB 6 — ANALYTICAL EXPOSITION (EDISI CARA GEMILANG) (Turn 98)
// Sumber: Bab 6 Analytical Exposition h.98+ (kunci tabel di HTML, pembahasan di HTML/PDF 08 Pembahasan). Kerangka helper diwarisi build-bindo-k12-bab1.mjs.
// ============================================================
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const E = JSON.parse(readFileSync(process.argv[2] || '../.ekstrak-bing4.json', 'utf-8'));

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
 "1": "Main idea = tesis: kesadaran keamanan siber penting untuk melindungi data.",
 "2": "Kesalahan umum = daftar di paragraf argumen (tautan mencurigakan, kata sandi lemah).",
 "3": "Why benefit = rantai argumen: kepercayaan pelanggan + penurunan risiko.",
 "4": "Praktik rekomendasi = daftar tindakan (MFA, pembaruan, pelatihan).",
 "5": "Breaches = konteks keamanan = pembobolan/kegagalan sistem.",
 "6": "Purpose analytical = persuade that something IS the case (bukan should).",
 "7": "NOT mentioned = eliminasi peran yang terdaftar satu per satu.",
 "8": "Advantage = manfaat; Disadvantage = biaya/kerugian/limitasi.",
 "9": "Contoh spesies = eksplisit: harimau India, orangutan Indonesia.",
 "10": "Inferensi koridor = fungsinya: migrasi, adaptasi, keragaman genetik.",
 "11": "Main idea p3 = studi genetik -> terapi inovatif.",
 "12": "Alasan menyoroti counseling = keluarga paham risiko & pengambilan keputusan.",
 "13": "Daftar gangguan genetik eksplisit (cystic fibrosis, Huntington, sickle cell).",
 "14": "Preventive carriers = gaya hidup, pemantauan, skrining berkala.",
 "15": "Lokalisasi frasa: paragraf yang menyebut penerapan temuan pasca-HGP.",
 "16": "Kontribusi ekonomi = isi kekurangan tenaga kerja, pajak, wirausaha.",
 "17": "Antonim poverty = prosperity (kemakmuran).",
 "18": "Economic = uang/tenaga kerja; Social = komunitas/budaya/keluarga.",
 "19": "Kondisi kontrafaktual: pembatasan -> kekurangan tenaga kerja menua memburuk.",
 "20": "Conclusion = migrasi peluang membangun ekonomi, bukan ancaman.",
 "21": "Argumen terkuat = yang memakai bukti ilmiah (sirkuit otak teraktivasi).",
 "22": "Self-awareness = refleksi metafora + regulasi emosi lewat puisi.",
 "23": "Elicit = membangkitkan = evoke; substitusi ke kalimat.",
 "24": "Menulis puisi = wadah aman menyalurkan & menata emosi.",
 "25": "Simbolis = pemrosesan pengalaman secara tidak langsung lewat lambang."
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

];

// ---------- rakit soal ----------
// Turn 90 (koreksi owner): opsi bagan soal 4, 16, 18 pada cetakan/HTML
// asli berupa GAMBAR SVG — diekstrak ke public/bagan/ lewat
// scripts/ekstrak-bagan-svg.mjs; teks opsi menjadi keterangan kecil.
const OPSI_GAMBAR = {}; // turn 99: warisan bagan bindo dibuang (bocor lintas mapel)
const SUMBER = 'Bank owner: Sukses Tes Kemampuan Akademik SMA/Saintek, Bab 6 Analytical Exposition h.98+ (kunci tabel di HTML, pembahasan di HTML/PDF 08 Pembahasan); kunci & pembahasan buku (soal asli #{no})';
const GAMBAR_GRUP = {};
const OV = {};
const ujiPemahaman = E.soal.map((s0) => {
  const no = s0.no;
  const s = { ...s0, teks: perbaiki(s0.teks), opsi: s0.opsi.map(perbaiki), baris: s0.baris.map(perbaiki), kolom: s0.kolom.map(perbaiki) };
  let jawaban = kunciDariPembahasan(no, s);
  if (OV[no]) jawaban = OV[no].jaw;
  const kr = kunciTabelRingkas(no, s.kolom, s.tipe);
  if (kr && !OV[no]) {
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
    ...(GAMBAR_GRUP[s.grup] ? { soalGambar: GAMBAR_GRUP[s.grup] } : {}),
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
      'Bank owner: salinan digital HTML bab 1,3,4,6,7 buku seri Sukses TKA SMA + tabel kunci di tiap HTML + pembahasan di HTML/PDF "08 Pembahasan"; kunci mengikuti cetakan asli.',
      'Sumber teks adaptasi per stimulus tercantum pada masing-masing teks.',
      'Kartu Cara Gemilang, tabel pola soal, dan Zona Berlatih = Gemilang Drill tim Gemilang mengikuti pola soal bank owner.',
      'Skema widget interaktif: docs/MATERI-INTERAKTIF.md (turn 87).',
    ],
  },
  bab: [{
    judul: "Bab 6 — Analytical Exposition (Edisi Cara Gemilang)",
    ringkasan: "Social function persuade-that-is-the-case, struktur thesis-arguments-reiteration, language features, pembeda analytical-vs-hortatory (IS-THE-CASE TEST), pola soal NOT-mentioned/argumen-terkuat/kategorisasi/antonim — dengan jodohkan struktur, benar/salah, isian rumpang, CG-EXPO, dan 25 soal resmi bank (cybersecurity, national parks, genetic medicine, migration, poetry) + pembahasan dua jalur.",
    estimasiMenit: 75, urutan: 6, tipe: 'teks',
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

const outDraft = join(ROOT, 'docs/drafts/draft-bahasa-inggris-k12-v1-bab6.json');
const outImpor = join(ROOT, 'IMPOR-BAHASA-INGGRIS-BAB6-TERBARU.json');
writeFileSync(outDraft, json + '\n');
writeFileSync(outImpor, json + '\n');
console.log('SELESAI IMPOR-BAHASA-INGGRIS-BAB6-TERBARU.json | sections:', sections.length, '| soal:', ujiPemahaman.length, '| ukuran:', (json.length / 1024).toFixed(1), 'KB');
