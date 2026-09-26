// scripts/build-bindo-k12-bab1.mjs
// ============================================================
// BUILDER MATERI: BAHASA INGGRIS WAJIB K12 — BAB 5 — HORTATORY EXPOSITION (EDISI CARA GEMILANG) (Turn 98)
// Sumber: Bab 5 Hortatory Exposition h.92+ (kunci tabel di HTML, pembahasan di HTML/PDF 08 Pembahasan). Kerangka helper diwarisi build-bindo-k12-bab1.mjs.
// ============================================================
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const E = JSON.parse(readFileSync(process.argv[2] || '../.ekstrak-bing7.json', 'utf-8'));

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
 "1": "Stated = ada kalimat pendukung eksplisit di teks; Not stated = tambahan opini opsi.",
 "2": "Rantai sebab-akibat: limbah menyumbat saluran -> genangan -> penyakit.",
 "3": "\"Mainly discussed\" = fokus dominan paragraf, bukan detail penyerta.",
 "4": "Prediksi = kelanjutan logis dari dampak yang sudah disebut teks.",
 "5": "Opini didukung contoh = cari opini yang diikuti bukti konkret di teks.",
 "6": "Kontribusi siswa = rekomendasi bagian akhir (reduce, reuse, kampanye).",
 "7": "Topik = tesis paragraf 1: pentingnya literasi digital bagi siswa.",
 "8": "Audience = siapa yang disapa/dicontohkan teks; pembaca umum bila tanpa sapaan khusus.",
 "9": "Skills abad 21 = daftar eksplisit: critical thinking, creativity, collaboration.",
 "10": "Tindakan literasi digital baik = verifikasi info, batasi konten, etika bermedia.",
 "11": "Intention hortatory = mendorong tindakan (sekolah memprioritaskan literasi digital).",
 "12": "Akademik = belajar/kolaborasi; karier = peluang kerja/keterampilan profesi.",
 "13": "Best summary = tesis + argumen inti + rekomendasi dalam SATU kalimat menyeluruh.",
 "14": "Eksposisi membuka dengan tesis dan menutup dengan rekomendasi yang mengikat ulang.",
 "15": "Inferensi masa depan = konsekuensi lanjutan yang logis dari ketergantungan fosil.",
 "16": "Arrangement = cocokkan topik per paragraf sesuai urutan teks.",
 "17": "Tiga jenis fosil = coal, oil, natural gas (daftar eksplisit).",
 "18": "Proses alami vs aktivitas manusia: drilling/transport/fracking = manusia.",
 "19": "Main idea = dampak buruk kelebihan layar pada anak.",
 "20": "Pernyataan pendukung = mekanisme gangguan pencernaan akibat layar.",
 "21": "Inferensi: kesempatan mengatur emosi & fokus berkurang karena layar konstan.",
 "22": "Sustaining = mempertahankan (perhatian); substitusi ke kalimat.",
 "23": "Kognitif/sosial = komunikasi, emosi, fokus; fisik = mata, tidur, pencernaan.",
 "24": "Strategi orang tua = batas waktu + jadwal penggunaan layar.",
 "25": "Anak mengabaikan sinyal tubuh karena atensi terserap aktivitas layar."
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
const SUMBER = 'Bank owner: Sukses Tes Kemampuan Akademik SMA/Saintek, Bab 5 Hortatory Exposition h.92+ (kunci tabel di HTML, pembahasan di HTML/PDF 08 Pembahasan); kunci & pembahasan buku (soal asli #{no})';
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
    judul: "Bab 5 — Hortatory Exposition (Edisi Cara Gemilang)",
    ringkasan: "Social function persuade-should, struktur thesis-argument-recommendation, language features (modal, passive, evaluative words), pola soal stated-not stated/rekomendasi/inferensi/kategorisasi — dengan jodohkan struktur, benar/salah hortatory-vs-analytical, isian rumpang, CG-HORTATORY, dan 25 soal resmi bank (sampah, literasi digital, fosil, screen time) + pembahasan dua jalur.",
    estimasiMenit: 75, urutan: 5, tipe: 'teks',
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

const outDraft = join(ROOT, 'docs/drafts/draft-bahasa-inggris-k12-v1-bab5.json');
const outImpor = join(ROOT, 'IMPOR-BAHASA-INGGRIS-BAB5-TERBARU.json');
writeFileSync(outDraft, json + '\n');
writeFileSync(outImpor, json + '\n');
console.log('SELESAI IMPOR-BAHASA-INGGRIS-BAB5-TERBARU.json | sections:', sections.length, '| soal:', ujiPemahaman.length, '| ukuran:', (json.length / 1024).toFixed(1), 'KB');
