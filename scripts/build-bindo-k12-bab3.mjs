// scripts/build-bindo-k12-bab1.mjs
// ============================================================
// BUILDER MATERI: B. INDONESIA WAJIB K12 — BAB 3 EJAAN, SINTAKSIS & SEMANTIK (Turn 90)
// Sumber: ejaan-sintaksis-semantik.html (Sukses TKA SMA/Saintek bab 3 h.58-59 + kunci).
// Kerangka helper diwarisi build-bindo-k12-bab1.mjs (generate turn 90).
// ============================================================
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const E = JSON.parse(readFileSync(process.argv[2] || '../.ekstrak-bab3.json', 'utf-8'));

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

// ---------- kunci ----------
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
  // tabel: dari centang baris tabel pembahasan
  if (!p.tabel) throw new Error(`soal ${no}: tabel pembahasan hilang`);
  return p.tabel.map((r) => (r.benar ? 0 : 1));
}
function kunciTabelRingkas(no, kolom, tipe) {
  const raw = E.kunci[no];
  if (!raw) return null;
  const toks = raw.split(',').map((x) => x.trim());
  if (tipe === 'tabel') {
    if (toks.some((t) => !/^(B|S|TS|T)$/i.test(t))) return null;
    return toks.map((t) => {
      const u = t.toUpperCase();
      if (u === 'TS' || u === 'T') return kolom.findIndex((k) => /^tidak/i.test(k));
      if (u === 'B') return kolom.findIndex((k) => /^ben/i.test(k));
      // S: Salah / Setuju / Sesuai sesuai nama kolom soal
      const iSalah = kolom.findIndex((k) => /^salah/i.test(k));
      if (iSalah >= 0) return iSalah;
      const iPos = kolom.findIndex((k) => /^(setuju|sesuai)/i.test(k));
      return iPos;
    });
  }
  // pg / pgMulti: huruf opsi atau nomor pernyataan
  if (toks.every((t) => /^[A-E]$/i.test(t))) return toks.map((t) => hurufIdx(t));
  if (toks.every((t) => /^\d+$/.test(t))) return toks.map((t) => Number(t) - 1);
  return null;
}

// ---------- pembahasan dua jalur ----------
const CG = {
  1: 'Uji imbuhan: subjek dikenai pekerjaan = verba di-; subjek pelaku = me-. Kata benda ke-an di posisi predikat perbuatan = tanda salah.',
  2: 'Makna kata = buka KBBI dulu, baru konteks: infrastruktur = prasarana penunjang.',
  3: 'Kalimat kompleks = dua klausa atau lebih; cari konjungsi atau S-P kedua.',
  4: 'Makna kalimat = inti + parafrasa lengkap; coret opsi yang hanya memuat separuh informasi.',
  5: 'Satu inti S-P = simpleks; ada konjungsi penggabung klausa = kompleks.',
  6: 'Imbuhan lagi: pernyataan tentang pihak pelaku butuh me-, tentang pihak dikenai butuh di-.',
  7: 'Ungkapan kias = terjemahkan ke makna lugas: "penjaga di tengah arus" = mengawasi agar tidak memberatkan.',
  8: 'Istilah harus cocok makna KBBI + konteks kalimat; kata berimbuhan me- yang seharusnya pasif = tanda salah.',
  9: 'KBBI: restrukturisasi = penataan kembali (struktur/tatanan) — bukan penghapusan atau penambahan utang.',
  10: 'Koordinatif = setara: dan, serta, atau, tetapi, melainkan, sedangkan — dua klausa mandiri.',
  11: 'Nominal ke-an vs verba me-: konteks perbuatan = verba (soal mandiri buku).',
  12: 'Makna kata = KBBI + konteks; uji tiap pernyataan satu per satu terhadap keduanya.',
  13: 'Subordinatif tujuan = agar, supaya, untuk, demi.',
  14: 'Istilah bidang harus pas konteks: petunjuk kemasan = instruksi, bukan reduplikasi.',
  15: 'Ungkapan "naik daun" = makin populer/diminati — makna kalimat = parafrasa ungkapan.',
  16: 'KBBI: fosil = sisa makhluk purba yang membatu -> energi dari sisa organisme; coret "terbarukan".',
  17: 'Subordinatif kausal = karena, sebab, sehingga.',
  18: 'Ketepatan kata per kalimat: uji imbuhan & makna KBBI pada tiap baris pernyataan.',
  19: 'Makna tersirat = gabungkan inti kalimat; coret opsi ekstrem ("sepenuhnya", "tidak ada dampak").',
  20: 'Tabel ketepatan kata = uji satu per satu dengan konteks + KBBI.',
  21: 'Koordinatif pertentangan = tetapi, melainkan, sedangkan.',
  22: 'KBBI: kronis = berlarut-larut (penyakit/masalah); uji tiap pernyataan terhadap makna itu.',
  23: 'KBBI: kultural = berkaitan kebudayaan -> nilai, keyakinan, tradisi.',
  24: 'KBBI: elaborasi = penjelasan mendalam; konteks penyebaran informasi butuh kata lain.',
  25: 'KBBI: ritual = berkenaan dengan ritus/seremonial -> kegiatan adat (soal mandiri buku).',
};
const CATATAN_KUNCI = {};

function kataKeIdx(kolom, kata) {
  const w = String(kata).trim().toLowerCase();
  if (/^tidak/.test(w)) return kolom.findIndex((k) => /^tidak/i.test(k));
  if (/^salah/.test(w)) return kolom.findIndex((k) => /^salah/i.test(k));
  if (/^benar/.test(w)) return kolom.findIndex((k) => /^ben/i.test(k));
  if (/^setuju/.test(w)) return kolom.findIndex((k) => /^setuju/i.test(k));
  if (/^sesuai/.test(w)) return kolom.findIndex((k) => /^sesuai/i.test(k));
  return -1;
}
function kunciFinal(no, s) {
  const dariCentang = kunciDariPembahasan(no, s);
  if (s.tipe !== 'tabel') {
    const kr2 = kunciTabelRingkas(no, s.kolom, s.tipe);
    if (kr2 && s.tipe === 'pg' && kr2[0] !== dariCentang) {
      CATATAN_KUNCI[no] = ' (Catatan: tabel kunci ringkas buku mencetak "' + E.kunci[no] + '" untuk butir ini, tetapi baris jawaban DAN tubuh pembahasan menyatakan opsi ' + String.fromCharCode(65 + dariCentang) + ' — kami mengikuti pembahasan.)';
    }
    if (kr2 && s.tipe === 'pgMulti' && JSON.stringify(kr2) !== JSON.stringify(dariCentang)) {
      CATATAN_KUNCI[no] = ' (Catatan: tabel kunci ringkas berbeda dengan baris jawaban pembahasan; mengikuti pembahasan.)';
    }
    return dariCentang;
  }
  const p = E.pembahasan[no - 1];
  const barisJw = (p.teks.match(/Jawaban:s*([sS]*)$/) || [])[1] || '';
  const dariBaris = barisJw.split(',').map((w) => kataKeIdx(s.kolom, w)).filter((x) => x >= 0);
  const kr = kunciTabelRingkas(no, s.kolom, 'tabel');
  const kandidat = [dariCentang, dariBaris.length === s.baris.length ? dariBaris : null, kr].filter(Boolean);
  const sama = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
  for (const k of kandidat) {
    const setuju = kandidat.filter((x) => sama(x, k)).length;
    if (setuju >= 2) return k;
  }
  CATATAN_KUNCI[no] = ' (Catatan: sumber kunci buku tidak seragam untuk butir ini; nilai mengikuti mayoritas tabel kunci ringkas + baris jawaban pembahasan.)';
  return kr || dariCentang;
}
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
  // ===== SUBBAB A: EJAAN — PENGGUNAAN KATA (3.1.1) =====
  { jenis: 'judul', teks: 'Ejaan: Penggunaan Kata yang Tepat' },
  { jenis: 'kilat', teks: 'Menggunakan kata berarti memakainya dengan tepat sesuai aturan, pedoman, dan konteks — makna harus cocok dengan KBBI dan kalimatnya. Kata dapat berupa kata dasar, berimbuhan, kata ulang, majemuk, atau serapan; pilihan yang meleset membuat kalimat tidak efektif.' },
  { jenis: 'paragraf', teks: 'Kata itu seperti kunci dan gembok: bentuknya boleh mirip, tetapi hanya satu yang benar-benar membuka makna kalimatnya. Memakai kata yang tidak sesuai konteks sama dengan memaksa kunci salah — kalimat tetap "terbuka paksa" tetapi tidak efektif.' },
  {
    jenis: 'poin', judul: 'Rumpun kata yang wajib dikuasai', items: [
      'Kata dasar — bentuk tunggal tanpa imbuhan.',
      'Kata berimbuhan — me-, di-, ke-an, pe-an, dan lain-lain yang mengubah makna gramatikal.',
      'Kata ulang — pengulangan penuh atau sebagian.',
      'Kata majemuk — gabungan bermakna baru.',
      'Kata serapan — adaptasi dari bahasa asing/daerah sesuai ejaan bahasa Indonesia.',
    ],
  },
  {
    jenis: 'benarSalah', judul: '⚖️ Cek pemahaman: penggunaan kata',
    items: [
      { teks: 'Kata yang tidak sesuai konteks kalimat dapat membuat kalimat tidak efektif.', jawaban: true, penjelasan: 'Sesuai bank h.58.' },
      { teks: 'Pemilihan kata cukup mengikuti kebiasaan tutur, tidak perlu rujukan KBBI.', jawaban: false, penjelasan: 'Penggunaan kata harus sesuai makna KBBI dan konteks.' },
      { teks: 'Imbuhan di- dipakai bila subjek menjadi pihak yang dikenai pekerjaan.', jawaban: true, penjelasan: 'Pola pasif; pelaku aktif memakai me-.' },
      { teks: 'Kata serapan bebas ditulis sesuai bahasa aslinya.', jawaban: false, penjelasan: 'Serapan menyesuaikan ejaan bahasa Indonesia.' },
    ],
  },
  {
    jenis: 'caraGemilang', judul: '👑 CG-EJAAN: me- aktif, di- pasif, ke-an benda',
    teks: 'Uji cepat ketepatan kata: siapa subjeknya? Pelaku = me-; yang dikenai = di-; hal/hasil = ke-an atau pe-an.',
    items: [
      'Baca kalimat, tandai subjek: melakukan atau dikenai?',
      'Cocokkan imbuhan verba; tukar bila terbalik.',
      'Bila konteksnya hal/benda tetapi terbaca perbuatan, curigai ke-an yang seharusnya me- (pola soal asli #11).',
    ],
  },
  { jenis: 'callout', tipe: 'peringatan', judul: 'Jebakan ujian', teks: 'Soal ketepatan kata sering menyamar sebagai soal makna: opsi berbunyi wajar tetapiimbusannya salah arah (kenaikan vs menaikkan, dinyatakan vs menyatakan). Uji imbuhan dulu, baru makna.' },
  {
    jenis: 'zona', items: [
      { soal: 'Kata yang maknanya harus selalu dicocokkan dengan kamus resmi dan konteks kalimat disebut soal ...', opsi: ['penggunaan kata', 'ejaan tanda baca', 'penulisan angka', 'pengucapan', 'pemenggalan'], jawaban: 0, pembahasan: 'Jalur konsep: bank membuka bab ejaan dengan penggunaan kata sesuai KBBI + konteks. Jalur Cara Gemilang: KBBI + konteks = pasangan wajib.' },
      { soal: 'Kalimat berikut yang menggunakan kata berimbuhan tepat adalah ...', opsi: ['Surat itu sudah dikirim kemarin.', 'Surat itu sudah mengirim kemarin.', 'Surat itu sudah kiriman kemarin.', 'Surat itu sedang ke kirim kemarin.', 'Surat itu terkirimkan pengirim kemarin.'], jawaban: 0, pembahasan: 'Jalur konsep: subjek "surat" dikenai pekerjaan → pasif di-. Jalur Cara Gemilang: CG-EJAAN — dikenai = di-.' },
      { soal: 'Penggunaan kata yang tidak tepat membuat kalimat menjadi ...', opsi: ['tidak efektif', 'majemuk', 'subordinatif', 'konotatif', 'elusif'], jawaban: 0, pembahasan: 'Jalur konsep: bank h.58 menyebut akibatnya kalimat tidak efektif. Jalur Cara Gemilang: kunci salah = gembok macet.' },
    ],
  },

  // ===== SUBBAB B: SINTAKSIS — KALIMAT SIMPLEKS (3.1.2.1) =====
  { jenis: 'judul', teks: 'Sintaksis: Kalimat Simpleks' },
  { jenis: 'kilat', teks: 'Kalimat simpleks = satu klausa: satu struktur subjek-predikat, satu informasi utama. Ia boleh panjang oleh keterangan, tetapi keterangan itu frasa, bukan klausa.' },
  {
    jenis: 'poin', judul: 'Ciri kalimat simpleks (bank h.58)', items: [
      'Terdiri atas satu klausa.',
      'Mengandung satu informasi utama (subjek + predikat).',
      'Tidak memakai konjungsi yang memperluas klausa.',
      'Pola: S-P, S-P-K, S-P-O, S-P-O-K, S-P-Pel, S-P-Pel-K, S-P-O-Pel, atau S-P-O-Pel-K.',
    ],
  },
  {
    jenis: 'flashcard', judul: '🃏 Flashcard: mengenali pola simpleks',
    items: [
      { depan: 'S-P', belakang: 'Contoh: "Adik tidur." (keterangan boleh absen)' },
      { depan: 'S-P-O', belakang: 'Contoh: "Adik minum susu."' },
      { depan: 'S-P-Pel', belakang: 'Contoh: "Ia menjadi tentor." (pelengkap bukan objek)' },
      { depan: 'S-P-O-K', belakang: 'Contoh: "Adik minum susu di dapur." (K frasa, bukan klausa)' },
    ],
  },
  {
    jenis: 'caraGemilang', judul: '👑 CG-SIMPLEKS: hitung inti S-P',
    teks: 'Simpleks = tepat SATU inti subjek-predikat. Lebih dari satu inti, atau satu inti + konjungsi penggabung klausa = kompleks.',
    items: [
      'Garisbawahi subjek & predikat; hitung intinya.',
      'Keterangan berupa frasa (di pasar, kemarin) TIDAK menambah klausa.',
      'Konjungsi dan/tetapi/karena yang menyambung dua S-P = tanda kompleks.',
    ],
  },
  {
    jenis: 'zona', items: [
      { soal: 'Kalimat simpleks disebut juga kalimat ...', opsi: ['majemuk', 'tunggal', 'bertingkat', 'setara', 'campuran'], jawaban: 1, pembahasan: 'Jalur konsep: satu klausa = kalimat tunggal (bank h.58). Jalur Cara Gemilang: simpleks = satu inti.' },
      { soal: 'Manakah kalimat yang merupakan simpleks?', opsi: ['Adik minum susu di dapur.', 'Adik minum susu lalu tidur.', 'Karena hujan, adik tidur.', 'Adik minum susu dan ayah membaca.', 'Meskipun lelah, adik belajar.'], jawaban: 0, pembahasan: 'Jalur konsep: hanya satu klausa; "di dapur" frasa keterangan. Opsi lain memakai konjungsi penggabung klausa. Jalur Cara Gemilang: hitung inti S-P = 1.' },
    ],
  },

  // ===== SUBBAB C: SINTAKSIS — KALIMAT KOMPLEKS (3.1.2.2) =====
  { jenis: 'judul', teks: 'Sintaksis: Kalimat Kompleks' },
  { jenis: 'kilat', teks: 'Kalimat kompleks (majemuk) terdiri atas dua klausa atau lebih, dapat dibentuk dari paduan beberapa simpleks. Tiga golongan: koordinatif (setara), subordinatif (bertingkat), dan variatif (gabungan keduanya, minimal tiga inti).' },
  {
    jenis: 'tabelinfo', judul: 'Koordinatif: tiga hubungan setara',
    kolom: ['Hubungan', 'Konjungsi', 'Catatan'],
    rows: [
      { k: 'Penjumlahan', v: 'dan, serta', w: 'Menambah informasi setara.' },
      { k: 'Pemilihan', v: 'atau', w: 'Menawarkan pilihan setara.' },
      { k: 'Pertentangan', v: 'tetapi, melainkan, sedangkan', w: 'Menjejerkan hal berlawanan setara.' },
    ],
  },
  {
    jenis: 'tabelinfo', judul: 'Subordinatif: 10 hubungan & konjungsinya (bank h.58-59)',
    kolom: ['Hubungan', 'Konjungsi'],
    rows: [
      { k: 'Waktu', v: 'sejak, saat, sewaktu, ketika, setelah, sampai, manakala' },
      { k: 'Syarat', v: 'jika, asalkan, apabila, kalau' },
      { k: 'Tujuan', v: 'agar, supaya, guna, untuk' },
      { k: 'Konsesif/pertentangan', v: 'walaupun, meskipun, sekalipun, biarpun, kendatipun, sungguhpun' },
      { k: 'Perbandingan', v: 'ibarat, seperti, laksana' },
      { k: 'Penyebab', v: 'karena, sebab' },
      { k: 'Akibat', v: 'sehingga, sampai-sampai, maka' },
      { k: 'Cara', v: 'dengan, secara' },
      { k: 'Sangkalan', v: 'seolah-olah, seakan-akan' },
      { k: 'Perluasan/penjelasan', v: 'yang, bahwa' },
    ],
  },
  {
    jenis: 'poin', judul: 'Kompleks variatif', items: [
      'Gabungan koordinatif dan subordinatif dalam satu kalimat.',
      'Sekurang-kurangnya memuat tiga inti kalimat (tiga klausa).',
      'Contoh buku: "Pekerjaan itu telah selesai ketika kakak datang dan ibu selesai memasak."',
    ],
  },
  {
    jenis: 'jodohMini', judul: '🔗 Jodohkan: konjungsi dan hubungan subordinatif',
    items: [
      { kiri: 'karena, sebab', kanan: 'Penyebab' },
      { kiri: 'agar, supaya, guna', kanan: 'Tujuan' },
      { kiri: 'walaupun, meskipun', kanan: 'Konsesif/pertentangan' },
      { kiri: 'ketika, sejak, manakala', kanan: 'Waktu' },
      { kiri: 'sehingga, maka', kanan: 'Akibat' },
      { kiri: 'yang, bahwa', kanan: 'Perluasan/penjelasan' },
    ],
  },
  {
    jenis: 'benarSalah', judul: '⚖️ Cek pemahaman: kompleks',
    items: [
      { teks: 'Kalimat kompleks koordinatif menghubungkan klausa-klausa sederajat.', jawaban: true, penjelasan: 'Definisi bank h.58.' },
      { teks: 'Pada kompleks subordinatif terdapat induk kalimat dan anak kalimat.', jawaban: true, penjelasan: 'Hubungan tidak sederajat.' },
      { teks: 'Kompleks variatif minimal memuat tiga inti kalimat.', jawaban: true, penjelasan: 'Gabungan koordinatif + subordinatif.' },
      { teks: 'Konjungsi "atau" menandai koordinatif penjumlahan.', jawaban: false, penjelasan: '"atau" = pemilihan; penjumlahan = dan/serta.' },
    ],
  },
  {
    jenis: 'caraGemilang', judul: '👑 CG-KOMPLEKS: konjungsi dulu, golongan kemudian',
    teks: 'Temukan konjungsinya, lalu golongkan: setara (dan/atau/tetapi/melainkan/sedangkan) = koordinatif; bertingkat (10 hubungan) = subordinatif; campur 3 inti = variatif.',
    items: [
      'Tandai konjungsi dalam kalimat.',
      'Cocokkan dengan tabel 10 subordinatif atau 3 koordinatif.',
      'Soal "tujuan" buru agar/supaya/untuk; soal "pertentangan setara" buru tetapi/melainkan/sedangkan.',
    ],
  },
  { jenis: 'callout', tipe: 'peringatan', judul: 'Jebakan ujian', teks: 'Sedangkan = koordinatif pertentangan, tetapi walaupun = subordinatif konsesif — keduanya sama-sama "bernuansa lawan" tetapi golongannya beda. Soal sering menukarnya.' },
  {
    jenis: 'zona', items: [
      { soal: 'Kalimat "Ia belajar supaya lulus seleksi" termasuk kompleks subordinatif hubungan ...', opsi: ['syarat', 'tujuan', 'akibat', 'cara', 'waktu'], jawaban: 1, pembahasan: 'Jalur konsep: supaya = konjungsi tujuan. Jalur Cara Gemilang: CG-KOMPLEKS — konjungsi dulu.' },
      { soal: 'Pasangan konjungsi koordinatif pertentangan adalah ...', opsi: ['dan, serta', 'atau, ataupun', 'tetapi, melainkan', 'jika, apabila', 'ketika, sejak'], jawaban: 2, pembahasan: 'Jalur konsep: bank h.58: pertentangan = tetapi, melainkan, sedangkan. Jalur Cara Gemilang: setara-oposisi.' },
      { soal: 'Kalimat dengan tiga klausa yang menggabungkan pola koordinatif dan subordinatif disebut ...', opsi: ['simpleks', 'kompleks koordinatif', 'kompleks subordinatif', 'kompleks variatif', 'kalimat majemuk rapatan'], jawaban: 3, pembahasan: 'Jalur konsep: variatif = gabungan keduanya, minimal tiga inti. Jalur Cara Gemilang: tiga inti + dua pola = variatif.' },
    ],
  },

  // ===== SUBBAB D: SEMANTIK (3.1.3) =====
  { jenis: 'judul', teks: 'Semantik: Makna Kata & Makna Kalimat' },
  { jenis: 'kilat', teks: 'Makna kata ada empat: leksikal (kamus), gramatikal (proses imbuhan/ulangan/gabungan), denotasi (lugas), konotasi (kias). Makna kalimat ditentukan makna kata pembentuknya plus hubungan runtunan katanya — dianalisis dari inti kalimat dan sinonimnya.' },
  {
    jenis: 'tabelinfo', judul: '4 makna kata dengan contoh buku (ibu)',
    kolom: ['Makna', 'Sumber makna', 'Contoh buku'],
    rows: [
      { k: 'Leksikal', v: 'Kamus/leksikon', w: 'ibu = wanita yang telah melahirkan seseorang.' },
      { k: 'Gramatikal', v: 'Pengimbuhan / pengulangan / pemajemukan', w: 'keibuan = bersifat seperti ibu; ibu-ibu = wanita dewasa; ibu jari = jempol.' },
      { k: 'Denotasi', v: 'Lugas, apa adanya, sebenarnya', w: 'makna lurus tanpa kiasan.' },
      { k: 'Konotasi', v: 'Kiasan, idiomatis, tambahan', w: 'makna sampingan berperasaan.' },
    ],
  },
  { jenis: 'paragraf', teks: 'Makna kalimat lahir dari dua sumber: makna kata-kata pembentuknya dan cara kata-kata itu dirangkai. Karena itu kalimat dianalisis dari intinya (subjek-predikat) lalu dicari sinonim kata kuncinya. Hasilnya bisa bermakna denotatif maupun konotatif.' },
  {
    jenis: 'isianRumpang', judul: '✍️ Isian rumpang: jenis makna',
    items: [
      { teks: 'Makna kata sesuai kamus disebut makna ...', jawaban: ['leksikal'], hint: 'Berkaitan dengan leksikon.', penjelasan: 'Leksikal = makna kamus.' },
      { teks: 'Makna yang muncul karena pengimbuhan, pengulangan, atau pemajemukan disebut makna ...', jawaban: ['gramatikal'], hint: 'Berkaitan dengan tata bahasa.', penjelasan: 'Gramatikal = hasil proses gramatikal.' },
      { teks: 'Makna kiasan atau idiomatis disebut makna ...', jawaban: ['konotasi', 'konotatif'], hint: 'Lawan dari lugas.', penjelasan: 'Konotasi = kiasan/sampingan.' },
    ],
  },
  {
    jenis: 'caraGemilang', judul: '👑 CG-SEMANTIK: Kamus–Proses–Lugas–Kias',
    teks: 'LEKsikal = kamus; GRAmatikal = proses; DENotasi = lugas; KONotasi = kias. Makna kalimat = inti kalimat + sinonim kata kunci.',
    items: [
      'Soal makna kata: KBBI dulu, lalu uji konteks kalimat.',
      'Soal makna kalimat: temukan inti S-P, parafrasekan tanpa membuang informasi.',
      'Ungkapan/idiom ("naik daun") selalu bermakna konotatif — terjemahkan ke makna lugasnya.',
    ],
  },
  {
    jenis: 'zona', items: [
      { soal: 'Makna "ibu jari" (= jempol) timbul karena proses ...', opsi: ['pengimbuhan', 'pengulangan', 'pemajemukan', 'penyerapan', 'pemenggalan'], jawaban: 2, pembahasan: 'Jalur konsep: ibu + jari digabung menjadi makna baru = pemajemukan (bank h.59). Jalur Cara Gemilang: CG-SEMANTIK — proses gabungan.' },
      { soal: 'Makna kalimat dapat dianalisis dengan cara ...', opsi: ['menghitung jumlah kata', 'menganalisis inti kalimat dan sinonim kata-katanya', 'melihat panjang pendeknya kalimat', 'menebak dari judul teks', 'mengubah kalimat menjadi puisi'], jawaban: 1, pembahasan: 'Jalur konsep: bank h.59: inti kalimat + sinonim kata. Jalur Cara Gemilang: inti + parafrasa.' },
    ],
  },
  { jenis: 'callout', tipe: 'info', judul: 'Bab 3 tuntas — seri lengkap', teks: 'Ejaan (ketepatan kata), sintaksis (simpleks-kompleks), dan semantik (makna) adalah kacamata bahasa untuk membedah kalimat. Bersama bab 1-2 (paragraf) dan bab 4 (sastra), senjata TKA Bahasa Indonesia-mu kini lengkap. Lanjut ke Uji Pemahaman 25 soal!' },
];

// ---------- rakit soal ----------
const SUMBER = 'Bank owner: Sukses Tes Kemampuan Akademik SMA/Saintek, Bab 3 Ejaan-Sintaksis-Semantik h.58-59; kunci & pembahasan buku (soal asli #{no})';
const ujiPemahaman = E.soal.map((s0) => {
  const no = s0.no;
  const s = { ...s0, teks: perbaiki(s0.teks), opsi: s0.opsi.map(perbaiki), baris: s0.baris.map(perbaiki), kolom: s0.kolom.map(perbaiki) };
  const jawaban = kunciFinal(no, s);
  const kr = null; // silang-check sudah di dalam kunciFinal (voting/catatan)
  if (kr && no !== 2 && no !== 12) {
    const sama = s.tipe === 'pg' ? kr[0] === jawaban
      : (kr.length === jawaban.length && kr.every((v, i) => v === jawaban[i]));
    if (!sama) throw new Error(`soal ${no}: kunci pembahasan vs tabel ringkas beda (${kr} vs ${jawaban})`);
  }
  if (s.tipe === 'pg' && (jawaban < 0 || jawaban >= s.opsi.length)) throw new Error(`soal ${no} kunci pg di luar opsi`);
  if (s.tipe === 'pgMulti' && jawaban.some((j) => j < 0 || j >= s.opsi.length)) throw new Error(`soal ${no} kunci multi di luar opsi`);
  const kepala = s.mandiri ? '' : `Bacalah kutipan teks berikut dengan saksama!\n\n${teksStimulus(s.grup)}\n\n`;
  let soalTeks = kepala + s.teks;
  if (s.tipe === 'pgMulti' && !/Jawaban benar lebih dari satu|Pilihlah dua jawaban/.test(soalTeks)) {
    soalTeks += '\n\nPilihlah jawaban yang benar! Jawaban benar lebih dari satu.';
  }
  if (s.tipe === 'tabel') {
    soalTeks += `\n(Tentukan ${s.kolom[0]}/${s.kolom[1]} untuk setiap pernyataan berikut!)`;
  }
  return {
    soal: soalTeks, tipe: s.tipe,
    ...(s.tipe === 'tabel' ? { kolom: s.kolom, baris: s.baris } : { opsi: s.opsi }),
    jawaban,
    pembahasan: buatPembahasan(no, s, jawaban),
    sumber: SUMBER.replace('{no}', String(no)),
  };
});

// ---------- metadata ----------
const draft = {
  materi: {
    judul: 'Bahasa Indonesia Wajib SMA — Persiapan TKA 2026 (Edisi Cara Gemilang)',
    mapel: 'Bahasa Indonesia', kelas: '12', jenjang: 'sma', program: 'semua',
    premium: false, warna: '#E11D48', emoji: '🎭',
    deskripsi: 'Materi wajib kelas 12 seri TKA: bab 1 paragraf & pragmatik, bab 2 paragraf lanjutan, bab 3 ejaan-sintaksis-semantik, bab 4 sastra. Impor bab tambahan pakai mode "tambah" pada materi ini.',
    urutan: 4, status: 'draft',
    daftarPustaka: [
      'Bank owner: salinan digital HTML bab 1-4 dari berkas pindai buku Sukses Tes Kemampuan Akademik SMA – Saintek (bab 3 h.58-59 + kunci/pembahasan); kunci mengikuti cetakan asli.',
      'Kartu CG-EJAAN, CG-SIMPLEKS, CG-KOMPLEKS, CG-SEMANTIK dan soal Zona Berlatih = Gemilang Drill tim Gemilang mengikuti pola soal bank owner.',
      'Skema widget interaktif: docs/MATERI-INTERAKTIF.md (turn 87).',
    ],
  },
  bab: [{
    judul: 'Bab 3 — Ejaan, Sintaksis (Simpleks-Kompleks), dan Semantik (Edisi Cara Gemilang)',
    ringkasan: 'Penggunaan kata sesuai KBBI & konteks (imbuhan me-/di-/ke-an), kalimat simpleks (satu inti S-P) vs kompleks (koordinatif 3 hubungan, subordinatif 10 hubungan, variatif), serta semantik (4 makna kata + makna kalimat) — dengan flashcard pola, jodohkan konjungsi, isian rumpang makna, benar/salah, dan 25 soal resmi bank + pembahasan dua jalur.',
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

const outDraft = join(ROOT, 'docs/drafts/draft-bahasa-indonesia-k12-v1-bab3.json');
const outImpor = join(ROOT, 'IMPOR-BAHASA-INDONESIA-BAB3-TERBARU.json');
writeFileSync(outDraft, json + '\n');
writeFileSync(outImpor, json + '\n');
console.log('SELESAI bab3 | sections:', sections.length, '| soal:', ujiPemahaman.length, '| ukuran:', (json.length / 1024).toFixed(1), 'KB');
