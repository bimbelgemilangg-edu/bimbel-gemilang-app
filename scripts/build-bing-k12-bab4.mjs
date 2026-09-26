// scripts/build-bindo-k12-bab1.mjs
// ============================================================
// BUILDER MATERI: BAHASA INGGRIS WAJIB K12 — BAB 4 — PROCEDURE TEXT (EDISI CARA GEMILANG) (Turn 98)
// Sumber: Bab 4 Procedure Text h.88+ (kunci tabel di HTML, pembahasan di HTML/PDF 08 Pembahasan). Kerangka helper diwarisi build-bindo-k12-bab1.mjs.
// ============================================================
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const E = JSON.parse(readFileSync(process.argv[2] || '../.ekstrak-bing3.json', 'utf-8'));

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
 "1": "Supported statements = cocokkan per pernyataan ke langkah manual; yang menambah aturan baru = salah.",
 "2": "Intention penulis procedure = memandu cara mengoperasikan (how to), langkah demi langkah.",
 "3": "Soal \"what might happen if\" = cari kalimat peringatan/konsekuensi di langkah terkait.",
 "4": "Troubleshooting = ikuti urutan pemeriksaan manual: cek dudukan/charging dock lebih dulu.",
 "5": "Why sebuah langkah = klausa tujuan di langkah itu (\"so that / in order to / untuk\").",
 "6": "Reference \"it\" = benda terdekat sebelumnya yang logis diganti (dust bag).",
 "7": "True/False prosedur: urutan terbalik atau alat salah = False.",
 "8": "Purpose tips keuangan = mengedukasi cara mengelola uang (how to manage).",
 "9": "Mengabaikan tips lain = rentan biaya tak terduga (dana darurat hilang).",
 "10": "Makna frasa kontekstual: \"guard your health\" = hindari biaya medis besar.",
 "11": "\"Know where your money goes\" = catat & pahami arus pengeluaran.",
 "12": "Percakapan keluarga = ruang aman anak berlatih & bertanya soal uang.",
 "13": "Anak kesulitan = terpapar keuangan digital sebelum paham dasar.",
 "14": "Problem = hambatan/risiko; Solution = tindakan/strategi yang disarankan.",
 "15": "Risiko tanpa edukasi = kebiasaan belanja digital impulsif.",
 "16": "Dua strategi pada perilaku: mencatat pembelian + meninjau total mingguan.",
 "17": "What is the text about = goal pada judul: how to set up Nest Hub.",
 "18": "Urutan: konektor \"then/next\" setelah membuka app = tap \"Set up one device\".",
 "19": "Fitur tambahan penutup: operasi suara lewat Google Assistant bawaan.",
 "20": "Dampak melewatkan langkah = fungsi yang tak jalan (streaming & personalisasi).",
 "21": "\"Both ... them\" = dua perangkat yang disebut: Nest Hub & Nest Hub Max.",
 "22": "Tujuan look up words = memahami kata/ungkapan tak dikenal saat menonton.",
 "23": "Tips speaking = mengucapkan kalimat keras-keras + memakai dalam percakapan.",
 "24": "Passive = menerima (menonton); Active = memproduksi/berinteraksi (berbicara, menulis, berlatih).",
 "25": "look up = mencari makna (di kamus/sumber) -> discover closest."
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
      { k: 'Imperative sentences', v: 'Press the button; Plug in the dock; Don\'t skip this step.' },
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

];

// ---------- rakit soal ----------
// Turn 90 (koreksi owner): opsi bagan soal 4, 16, 18 pada cetakan/HTML
// asli berupa GAMBAR SVG — diekstrak ke public/bagan/ lewat
// scripts/ekstrak-bagan-svg.mjs; teks opsi menjadi keterangan kecil.
const OPSI_GAMBAR = {}; // turn 99: warisan bagan bindo dibuang (bocor lintas mapel)
const SUMBER = 'Bank owner: Sukses Tes Kemampuan Akademik SMA/Saintek, Bab 4 Procedure Text h.88+ (kunci tabel di HTML, pembahasan di HTML/PDF 08 Pembahasan); kunci & pembahasan buku (soal asli #{no})';
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
    judul: "Bab 4 — Procedure Text (Edisi Cara Gemilang)",
    ringkasan: "Social function & struktur goal-materials-steps, language features (imperative, sequence connectors/adverbs), pola soal urutan/troubleshooting/reference/kategorisasi — dengan susun urutan manual, jodohkan fitur bahasa, benar/salah, isian rumpang, CG-PROCEDURE, dan 25 soal resmi bank (robot vacuum, tips keuangan, literasi anak, setup Nest Hub, tips belajar bahasa) + pembahasan dua jalur.",
    estimasiMenit: 75, urutan: 4, tipe: 'teks',
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

const outDraft = join(ROOT, 'docs/drafts/draft-bahasa-inggris-k12-v1-bab4.json');
const outImpor = join(ROOT, 'IMPOR-BAHASA-INGGRIS-BAB4-TERBARU.json');
writeFileSync(outDraft, json + '\n');
writeFileSync(outImpor, json + '\n');
console.log('SELESAI IMPOR-BAHASA-INGGRIS-BAB4-TERBARU.json | sections:', sections.length, '| soal:', ujiPemahaman.length, '| ukuran:', (json.length / 1024).toFixed(1), 'KB');
