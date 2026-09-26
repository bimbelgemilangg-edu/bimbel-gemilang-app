// scripts/build-bindo-k12-bab1.mjs
// ============================================================
// BUILDER MATERI: BAHASA INGGRIS WAJIB K12 — BAB 7 — INFOGRAPHIC (EDISI CARA GEMILANG) (Turn 98)
// Sumber: Bab 7 Infographic h.103+ (kunci tabel di HTML, pembahasan di HTML/PDF 08 Pembahasan; 3 gambar infografis diekstrak ke public/gambar-bing/). Kerangka helper diwarisi build-bindo-k12-bab1.mjs.
// ============================================================
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const E = JSON.parse(readFileSync(process.argv[2] || '../.ekstrak-bing5.json', 'utf-8'));

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
 "1": "Baca angka + labelnya: 70% pekerja Amerika mengalami penyakit terkait stres.",
 "2": "Angka + satuan: lebih dari 20 jam per minggu online — termasuk apa saja hitungannya.",
 "3": "Fungsi angka 33% = menyoroti dampak stres hari Senin, bukan data acak.",
 "4": "NOT mentioned = eliminasi angka/label yang ADA di infografik; sisa = jawaban.",
 "5": "Daftar etnis pada grafik anak asuh = sumber opsi pgMulti.",
 "6": "Bandingkan dua grafik: orangtua angkat mayoritas putih vs anak lebih beragam.",
 "7": "approximately = sekitar = around; substitusi ke frasa.",
 "8": "True/False = verifikasi angka grafik per baris (bila buku salah cetak, voting pembahasan yang menang).",
 "9": "Statistik dipajang = to raise awareness (menyadarkan), bukan menghibur.",
 "10": "epidemic dalam konteks = masalah luas & serius, bukan wabah medis harfiah.",
 "11": "Label kunci: \"silent epidemic\" = cara infografik menggambarkan isu.",
 "12": "Jenis abuse = daftar eksplisit ikon/label (physical, psychological, ...).",
 "13": "Main concern = risiko perilaku online tak aman & tersembunyi.",
 "14": "Frasa = orangtua khawatir atas interaksi online anak.",
 "15": "32% avoid = tidak memberitahu orangtua soal aktivitas online.",
 "16": "Aktivitas penyumbang emisi = pembakaran fosil, deforestasi, industri.",
 "17": "Discouraged = poaching (perburuan liar) dilarang dalam konservasi.",
 "18": "Problem = kerusakan/ancaman; Solution = tindakan konservasi.",
 "19": "If continues = proyeksi tren: spesies hilang/biodiversitas anjlok.",
 "20": "Cognitive advantages = kontrol atensi, memori, task-switching.",
 "21": "Social advantage = daya tarik/power of seduction multibahasa.",
 "22": "Prediksi siswa multibahasa = transfer keuntungan kognitif.",
 "23": "Kontributor terbesar = persen tertinggi: Indonesia 46%.",
 "24": "98% tubuh hiu = dibuang kembali ke laut setelah sirip diambil.",
 "25": "Inferensi ekosistem = rantai makanan laut terganggu."
};
const CATATAN_KUNCI = {"8":" (Catatan: tabel kunci ringkas buku mencetak \"T,T,F,F,T\" untuk baris terakhir, tetapi centang tabel pembahasan dan baris Jawaban pembahasan sepakat FALSE — kami mengikuti pembahasan.)"};
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

  // ===== SUBBAB A: INFOGRAPHIC — MEMBACA DATA SEKILAS =====
  { jenis: 'judul', teks: 'Infographic: Reading Data at a Glance' },
  { jenis: 'kilat', teks: 'An infographic is a visual representation of data, information, or knowledge designed to present complex information quickly, clearly, and engagingly. Membacanya = menerjemahkan angka, label, dan ikon menjadi pesan.' },
  { jenis: 'peta', teks: 'Infographic adalah "dashboard" bacaan TKA: soal menguji ketelitian membaca angka/persen/label dan kemampuan menyimpulkan pesan visual. Keterampilan ini juga dipakai di soal grafik mapel lain — satu latihan, banyak panen.' },
  { jenis: 'paragraf', teks: 'Infografik seperti dasbor mobil: kecepatan, bahan bakar, dan lampu peringatan tampil serentak sebagai angka dan ikon. Pembaca yang baik tidak hanya melihat angkanya, tetapi membaca pasangan angka-labelnya — persis seperti soal persen di ujian.' },
  {
    jenis: 'poin', judul: 'Key elements of an infographic (bank h.103)', items: [
      'Visual hierarchy — tata letak menuntun mata ke informasi terpenting lebih dulu.',
      'Data & facts — angka, persen, dan fakta yang jadi tulang punggung pesan.',
      'Graphics & icons — simbol yang mempercepat pemahaman.',
      'Color & typography — penekanan & pengelompokan informasi.',
      'Concise messaging — pesan ringkas gaya bullet point, bukan paragraf panjang.',
    ],
  },
  {
    jenis: 'tabelinfo', judul: 'Language features infografik + contoh',
    kolom: ['Fitur', 'Contoh'],
    rows: [
      { k: 'Conciseness (bullet style)', v: '"70% stress-related illness" — tanpa kalimat lengkap.' },
      { k: 'Persuasive language', v: 'Boost, Vital, Discover — kata yang meyakinkan/menginspirasi.' },
      { k: 'Noun phrases sebagai label', v: '"Daily Intake", "Energy Levels" — bukan kalimat utuh.' },
      { k: 'Active verbs kuat', v: 'Saves, Reduces, Improves.' },
    ],
  },
  {
    jenis: 'urutan', judul: '🧩 Susun: cara membaca infografik',
    keterangan: 'Urutan membaca yang efisien dari bank & praktik tim Gemilang.',
    items: [
      'Baca judul & subjudul: pesan utama yang diklaim',
      'Scan label, legenda, dan satuan (%, jam, tahun)',
      'Telusuri angka per bagian sambil dicocokkan dengan labelnya',
      'Rangkai pesan: apa yang ingin membuat pembaca percaya/bertindak',
    ],
  },
  {
    jenis: 'jodohMini', judul: '🔗 Jodohkan: elemen dan fungsinya',
    items: [
      { kiri: 'Menuntun mata ke info terpenting', kanan: 'Visual hierarchy' },
      { kiri: 'Angka, persen, fakta', kanan: 'Data & facts' },
      { kiri: 'Simbol pemercepat paham', kanan: 'Graphics & icons' },
      { kiri: 'Penekanan & pengelompokan', kanan: 'Color & typography' },
      { kiri: 'Pesan ringkas gaya bullet', kanan: 'Concise messaging' },
    ],
  },
  {
    jenis: 'benarSalah', judul: '⚖️ Cek pemahaman: membaca data',
    items: [
      { teks: 'Persen selalu harus dibaca bersama label populasiya (70% dari SIAPA).', jawaban: true, penjelasan: 'Persen tanpa label populasi = jebakan.' },
      { teks: 'Judul infografik selalu netral tanpa pesan persuasif.', jawaban: false, penjelasan: 'Judul sering memuat klaim/pesan (persuasive language).' },
      { teks: 'Noun phrases dipakai sebagai label, bukan kalimat utuh.', jawaban: true, penjelasan: 'Concise messaging.' },
      { teks: 'Warna dan tipografi hanya hiasan tanpa fungsi informasi.', jawaban: false, penjelasan: 'Keduanya mengelompokkan & menekankan informasi.' },
    ],
  },
  {
    jenis: 'caraGemilang', judul: '👑 CG-INFOGRAFIK: ANGKA-LABEL-PESAN',
    teks: 'Setiap angka dikawinkan dengan labelnya (persen dari siapa, satuan apa, tahun mana); lalu rangkai pesan akhir infografik. Soal apa pun jatuh ke salah satu dari tiga itu.',
    items: [
      'Lingkari angka di soal, temukan kembarannya di gambar BESERTA labelnya.',
      'Soal NOT mentioned = daftar yang ADA dulu, coret, sisa jawaban.',
      'Soal inferensi = pesan keseluruhan + tren (naik/turun/terbesar/terkecil).',
    ],
  },
  { jenis: 'callout', tipe: 'peringatan', judul: 'Jebakan ujian', teks: 'Penukar persen-vs-jumlah dan subset-vs-total: "32% of teens" bukan "32% of parents". Cek juga satuan (per week vs per day) dan tahun bila ada dua grafik berdampingan.' },
  {
    jenis: 'zona', items: [
      { soal: 'The element that guides the reader eyes to the most important information first is ...', opsi: ['data & facts', 'visual hierarchy', 'concise messaging', 'noun phrases', 'active verbs'], jawaban: 1, pembahasan: 'Jalur konsep: visual hierarchy menuntun mata (bank h.103). Jalur Cara Gemilang: hierarki = urutan pandang.' },
      { soal: 'An infographic label reads "Daily Intake". This label is an example of ...', opsi: ['a full sentence', 'a noun phrase', 'an imperative', 'a passive clause', 'a temporal conjunction'], jawaban: 1, pembahasan: 'Jalur konsep: label ringkas = noun phrase (bank h.103). Jalur Cara Gemilang: label, bukan kalimat.' },
      { soal: 'A chart shows 46% (Indonesia), 22% (country X), 12% (country Y) of a global total. The biggest contributor is ...', opsi: ['country Y', 'country X', 'Indonesia', 'all equal', 'cannot be determined'], jawaban: 2, pembahasan: 'Jalur konsep: persen terbesar = kontributor terbesar (pola soal shark finning). Jalur Cara Gemilang: ANGKA-LABEL-PESAN — cari puncak.' },
    ],
  },

  // ===== SUBBAB B: POLA SOAL INFOGRAPHIC =====
  { jenis: 'judul', teks: 'Infographic Question Patterns' },
  {
    jenis: 'tabelinfo', judul: 'Pola soal + jurus',
    kolom: ['Pola', 'Penanda', 'Jurus'],
    rows: [
      { k: 'Angka/persen', v: '"What percentage...?", "How many...?"', w: 'Temukan angka + label populasi & satuan.' },
      { k: 'NOT mentioned', v: '"Which is NOT mentioned...?"', w: 'Daftar yang ada dulu, coret, sisa.' },
      { k: 'Fungsi angka', v: '"Why does the infographic mention...?"', w: 'Angka = penekanan pesan apa?' },
      { k: 'Sinonim frasa', v: '"approximately = ..."', w: 'Substitusi ke label/kalimat.' },
      { k: 'Categorize', v: '"Problem/Solution", "True/False"', w: 'Dua kolom aspek; verifikasi per baris.' },
      { k: 'Inferensi/prediksi', v: '"What can be inferred/predicted...?"', w: 'Tren + pesan keseluruhan infografik.' },
    ],
  },
  {
    jenis: 'isianRumpang', judul: '✍️ Isian rumpang: istilah infografik',
    items: [
      { teks: 'The visual arrangement that leads the reader eyes is called visual ...', jawaban: ['hierarchy'], hint: 'Berjenjang/urutan pandang.', penjelasan: 'Visual hierarchy = penuntun mata.' },
      { teks: 'Labels like "Daily Intake" are examples of ... phrases.', jawaban: ['noun'], hint: 'Frasa benda ringkas.', penjelasan: 'Noun phrases sebagai label.' },
      { teks: 'Words like Boost and Discover belong to ... language.', jawaban: ['persuasive'], hint: 'Bersifat membujuk.', penjelasan: 'Persuasive language infografik.' },
    ],
  },
  { jenis: 'callout', tipe: 'guru', judul: 'Ringkas sendiri', teks: 'Pilih satu infografik bab ini, tulis ulang isinya menjadi 5 bullet: judul-klaim, tiga angka-label terpenting, dan pesan akhir. Latihan ini memaksa ANGKA-LABEL-PESAN menjadi kebiasaan.' },
  { jenis: 'callout', tipe: 'info', judul: 'Seri Bahasa Inggris tuntas', teks: 'Tujuh bab (narrative, descriptive, recount, procedure, hortatory, analytical, infographic) lengkap dengan 175 soal resmi bank. Kerjakan berurutan atau lompat ke tipe teks yang paling sering salah — riwayat latihanmu menunjukkan polanya.' },

];

// ---------- rakit soal ----------
// Turn 90 (koreksi owner): opsi bagan soal 4, 16, 18 pada cetakan/HTML
// asli berupa GAMBAR SVG — diekstrak ke public/bagan/ lewat
// scripts/ekstrak-bagan-svg.mjs; teks opsi menjadi keterangan kecil.
const OPSI_GAMBAR = {}; // turn 99: warisan bagan bindo dibuang (bocor lintas mapel)
const SUMBER = 'Bank owner: Sukses Tes Kemampuan Akademik SMA/Saintek, Bab 7 Infographic h.103+ (kunci tabel di HTML, pembahasan di HTML/PDF 08 Pembahasan; 3 gambar infografis diekstrak ke public/gambar-bing/); kunci & pembahasan buku (soal asli #{no})';
const GAMBAR_GRUP = {"0":"/gambar-bing/infographic-g1.jpg","1":"/gambar-bing/infographic-g2.jpg","3":"/gambar-bing/infographic-g4.jpg"};
const OV = {"8":{"jaw":[0,0,1,1,1]}};
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
    deskripsi: 'Materi wajib kelas 12 seri TKA Bahasa Inggris: narrative, descriptive, recount, procedure, hortatory exposition, analytical exposition, dan infographic reading (7 bab sesuai urutan buku). Impor bab tambahan pakai mode "tambah" pada materi ini.',
    urutan: 6, status: 'draft',
    daftarPustaka: [
      'Bank owner: salinan digital HTML bab 1,3,4,6,7 buku seri Sukses TKA SMA + tabel kunci di tiap HTML + pembahasan di HTML/PDF "08 Pembahasan"; kunci mengikuti cetakan asli.',
      'Sumber teks adaptasi per stimulus tercantum pada masing-masing teks.',
      'Kartu Cara Gemilang, tabel pola soal, dan Zona Berlatih = Gemilang Drill tim Gemilang mengikuti pola soal bank owner.',
      'Skema widget interaktif: docs/MATERI-INTERAKTIF.md (turn 87).',
    ],
  },
  bab: [{
    judul: "Bab 7 — Infographic (Edisi Cara Gemilang)",
    ringkasan: "Definisi & key elements infografik (visual hierarchy, data, ikon, warna, concise messaging), language features (bullet style, persuasive words, noun phrases, active verbs), cara membaca ANGKA-LABEL-PESAN, pola soal persen/NOT-mentioned/fungsi angka/kategorisasi/inferensi — dengan 3 gambar infografis asli sebagai stimulus (public/gambar-bing), susun urutan cara membaca, jodohkan elemen, benar/salah, isian rumpang, CG-INFOGRAFIK, dan 25 soal resmi bank (stres & layar, foster children, child abuse, teen online, konservasi, bilingual, shark finning) + pembahasan dua jalur.",
    estimasiMenit: 75, urutan: 7, tipe: 'teks',
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

const outDraft = join(ROOT, 'docs/drafts/draft-bahasa-inggris-k12-v1-bab7.json');
const outImpor = join(ROOT, 'IMPOR-BAHASA-INGGRIS-BAB7-TERBARU.json');
writeFileSync(outDraft, json + '\n');
writeFileSync(outImpor, json + '\n');
console.log('SELESAI IMPOR-BAHASA-INGGRIS-BAB7-TERBARU.json | sections:', sections.length, '| soal:', ujiPemahaman.length, '| ukuran:', (json.length / 1024).toFixed(1), 'KB');
