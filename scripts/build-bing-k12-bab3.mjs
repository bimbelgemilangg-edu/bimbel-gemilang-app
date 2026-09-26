// scripts/build-bindo-k12-bab1.mjs
// ============================================================
// BUILDER MATERI: BAHASA INGGRIS WAJIB K12 — BAB 3 — RECOUNT TEXT (EDISI CARA GEMILANG) (Turn 98)
// Sumber: Bab 2 Recount Text (kunci tabel di HTML, pembahasan di HTML/PDF 08 Pembahasan). Kerangka helper diwarisi build-bindo-k12-bab1.mjs.
// ============================================================
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const E = JSON.parse(readFileSync(process.argv[2] || '../.ekstrak-bing2.json', 'utf-8'));

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
 "1": "Trigger = peristiwa penyebab di paragraf pembuka; cari kekhawatiran/fakta yang memulai aksi.",
 "2": "Urutan recount = timeline; susun lewat penanda tahun/paragraf, jangan lewat perasaan.",
 "3": "Alasan = kalimat tujuan (\"to ...\") di paragraf 1; pilih semua motivasi yang tertulis.",
 "4": "Main idea paragraf = kalimat inti; paragraf 3 = langkah nyata/proyek solusi.",
 "5": "True/False: verifikasi per baris ke paragraf; kata mutlak = False.",
 "6": "Biographical recount = lahir -> karier -> penghargaan -> warisan; ikuti angka tahun.",
 "7": "\"Primarily known for\" = peran utama yang disebut berulang & di penutup.",
 "8": "Tindakan nyata = daftar kerja di paragraf lingkungan (urging, calling, joining).",
 "9": "Why = argumen tokoh: kerusakan lingkungan = ketidakadilan yang timpang.",
 "10": "Categorize: tempel aksi ke eranya (anti-apartheid vs advokasi lingkungan).",
 "11": "Main idea paragraf trek = tantangan fisik (panas, medan batuan).",
 "12": "Purpose recount = to retell past experiences — bukan persuade/procedure.",
 "13": "Conclusion = generalisasi: persiapan logistik + mental = syarat sukses.",
 "14": "Challenges = yang dialami/dihadapi; coret yang tidak terjadi di teks.",
 "15": "Penanda waktu: matahari terik = afternoon; bintang/dingin = nighttime.",
 "16": "Early years = peristiwa awal gerakan; ban plastik 2019 = hasil akhir, bukan awal.",
 "17": "Makna frasa = konteks sekitarnya: \"landmark victory\" = bersejarah & jadi model.",
 "18": "Ide tersirat = pesan besar: kegigihan anak muda membawa perubahan nyata.",
 "19": "Detail inspiratif = yang bisa ditiru pembaca (platform Youthtopia).",
 "20": "Trigger paragraf 1: video gunungan plastik saat mengikuti kegiatan sekolah.",
 "21": "Significance = titik balik yang memaksa dunia memperhatikan perjuangan RI.",
 "22": "Tahapan = proklamasi -> kedatangan Sekutu -> ultimatum -> pertempuran -> peringatan.",
 "23": "Paragraf terakhir = simbol abadi tekad; cari kalimat penutup bermakna luas.",
 "24": "Why longer = abaikan ultimatum + semangat perlawanan + taktik gerilya.",
 "25": "Bung Tomo = siaran radio pembakar semangat; cek tiap pernyataan ke perannya."
};
const CATATAN_KUNCI = {"5":" (Catatan: tabel kunci ringkas buku mencetak \"F,F,T,F,T\", tetapi centang tabel pembahasan dan narasi pembahasan menyatakan baris 1 TRUE — kutipan \"transition from a quiet graduate into a determined activist\"; kami mengikuti pembahasan.)"};
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
const SUMBER = 'Bank owner: Sukses Tes Kemampuan Akademik SMA/Saintek, Bab 2 Recount Text (kunci tabel di HTML, pembahasan di HTML/PDF 08 Pembahasan); kunci & pembahasan buku (soal asli #{no})';
const GAMBAR_GRUP = {};
const OV = {"5":{"jaw":[0,1,0,1,0]}};
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
    judul: "Bab 3 — Recount Text (Edisi Cara Gemilang)",
    ringkasan: "Definisi & social function recount, generic structure orientation-events-re-orientation, kinds of recount, pola soal kronologi/kategorisasi/True-False — dengan susun urutan, jodohkan jenis, benar/salah, isian rumpang, dan 25 soal resmi bank (5 teks: Vanessa Nakate, Desmond Tutu, trek Outback, Bye Bye Plastic Bags, Pertempuran Surabaya) + pembahasan dua jalur.",
    estimasiMenit: 75, urutan: 3, tipe: 'teks',
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

const outDraft = join(ROOT, 'docs/drafts/draft-bahasa-inggris-k12-v1-bab3.json');
const outImpor = join(ROOT, 'IMPOR-BAHASA-INGGRIS-BAB3-TERBARU.json');
writeFileSync(outDraft, json + '\n');
writeFileSync(outImpor, json + '\n');
console.log('SELESAI IMPOR-BAHASA-INGGRIS-BAB3-TERBARU.json | sections:', sections.length, '| soal:', ujiPemahaman.length, '| ukuran:', (json.length / 1024).toFixed(1), 'KB');
