// scripts/build-bindo-k12-bab1.mjs
// ============================================================
// BUILDER MATERI: B. INDONESIA WAJIB K12 — BAB 1 PARAGRAF 1 &
// PRAGMATIK (Turn 89). Sumber: salinan digital bank owner
// "paragraf-1-dan-pragmatik (1).html" (Sukses TKA SMA/Saintek
// bab 1 h.40-42 + kunci/pembahasan).
//
// Alur: node scripts/ekstrak-bab-html.mjs <html> /tmp/ekstrak-bab1.json
//       node scripts/build-bindo-k12-bab1.mjs /tmp/ekstrak-bab1.json
//
// Aturan kunci (belajar dari quirks cetakan bab 1):
//  - pg/pgMulti  : kunci dari baris "Jawaban:" di pembahasan buku
//                  (tabel kunci ringkas bab 1 salah cetak di no.2).
//  - tabel       : kunci dari centang tabel pembahasan (potongan
//                  "Jawaban: E" pada no.12 = serpihan salah letak).
//  - Selisih dengan tabel kunci ringkas dicatat di pembahasan.
// ============================================================
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const E = JSON.parse(readFileSync(process.argv[2] || '/tmp/ekstrak-bab1.json', 'utf-8'));

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
    if (toks.some((t) => !/^(B|S|TS)$/i.test(t))) return null;
    return toks.map((t) => {
      const u = t.toUpperCase();
      if (u === 'TS') return kolom.findIndex((k) => /^tidak/i.test(k));
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
  1: 'Gagasan utama = kalimat paling umum yang mewadahi kalimat lain; cek kalimat pertama & terakhir dulu (deduktif/induktif paling sering keluar).',
  2: 'Soal "alasan" = buru kalimat sebab di teks: teknologi disusun sistematis untuk menjawab tantangan spesifik — opsi yang menambah klaim baru = pengecoh.',
  3: 'Tujuan = jenis teks: penuh definisi & paparan = eksposisi -> menjelaskan/menginformasikan; coret opsi yang hanya mencakup satu paragraf.',
  4: 'Soal bagan = tulis 3 informasi inti sesuai urutan muncul; bagan benar memuat ketiganya TANPA tambahan kotak asing.',
  5: 'Tabel B/S per baris: cari bukti teksnya; pernyataan berbau "langkah tunggal/satu-satunya" hampir pasti SALAH.',
  6: 'Gagasan utama paragraf deduktif = kalimat pertama; opsi benar = parafrasanya, bukan detail pendukung.',
  7: 'Teks berita informatif = eksposisi: menjelaskan kebijakan beserta alasannya — bukan mengkritik, bukan membandingkan.',
  8: 'Ada rantai alasan -> dampak = sebab-akibat; urutan waktu = kronologis; rincian ciri objek = deskripsi.',
  9: 'Setuju/Tidak = cocokkan tiap pernyataan dengan fakta teks; pernyataan bertentangan dengan data = Tidak Setuju.',
  10: 'Paragraf induktif: gagasan utama sering di akhir — kerusakan fisik + penurunan keanekaragaman hayati.',
  11: 'Pola per paragraf = lihat rangka: kondisi->sebab = kausalitas; dua hal disandingkan = perbandingan.',
  12: 'Tujuan teks ilmiah = menjelaskan/menginformasikan; opsi "menghibur" atau "mengajak membeli" langsung SALAH.',
  13: 'Gagasan utama = kalimat yang mewadahi; opsi berisi detail/contoh (instant, definisi produktif) = pengecoh.',
  14: 'Kalimat tak berhubungan = membahas hal yang hanya disinggung sekilas (definisi produktif) atau tak disebut teks.',
  15: 'Tujuan ganda = dua lapisan teks: menginformasikan cara + menjelaskan pentingnya; opsi promosi/kritik coret.',
  16: 'Bagan benar = urutan informasi: kaidah -> upaya -> kesimpulan; cocokkan label kotak dengan teks, bukan hafalan.',
  17: 'Paragraf penutup berisi rekomendasi = gagasan utamanya kewajiban/aturan pemakaian.',
  18: 'Tiga kotak inti: pemakaian -> dampak negatif -> pencegahan; bagan yang menukar urutan = salah.',
  19: '"Berhubungan dengan gagasan" = nilainya sama dengan batang soal (harmoni alam-manusia-spiritual); opsi historis/ekonomi = lintas topik.',
  20: 'Soal "kecuali" = eliminasi satu per satu; opsi aneh menambahkan fungsi yang tidak pernah disebut teks.',
  21: 'Cocokkan dengan kalimat bernomor di teks; kata mutlak "sepenuhnya"/"hanya" biasanya jebakan = Tidak Sesuai.',
  22: 'Paparan umum->rinci tanpa urutan waktu = eksposisi; jangan terkecoh opsi prosedural hanya karena ada kata diagnosis.',
  23: 'Tujuan ganda teks medis: informasi utuh + informasi faktor risiko & pencegahan; ajakan/kritik tidak ada di teks.',
  24: 'Per paragraf: sebab->akibat = kausalitas; langkah = prosedural; ciri = deskripsi; uji tiap opsi ke rangka paragraf.',
  25: 'Dua hal dikontraskan = perbandingan; rincian ciri = deskripsi; urutan waktu = kronologis.',
};
const CATATAN_KUNCI = {
  2: ' (Catatan: tabel kunci ringkas buku mencetak "2. S,S,B" — salah cetak; baris jawaban pembahasan menyatakan B, dan butir ini memang PG.)',
  12: ' (Catatan: potongan "Jawaban: E" pada pembahasan buku adalah serpihan salah letak; kunci mengikuti centang tabel pembahasan & tabel kunci ringkas: S,S,B.)',
};
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
  // ===== SUBBAB A: PARAGRAF =====
  { jenis: 'judul', teks: 'Paragraf: Gagasan Utama, Informasi, dan Pola' },
  { jenis: 'kilat', teks: 'Paragraf adalah kesatuan pikiran dalam kumpulan kalimat yang berkaitan untuk membentuk satu ide pokok. Letak kalimat utama menentukan jenis paragraf: deduktif, ineratif, induktif, variatif, atau deskriptif/naratif. Hampir semua soal bacaan TKA bertumpu pada keterampilan menemukan gagasan utama ini.' },
  { jenis: 'peta', teks: 'Bab 1 adalah fondasi seluruh bacaan TKA Bahasa Indonesia: gagasan utama, informasi tersurat-tersirat, tujuan penulis, dan pola pengembangan muncul lagi di bab 2 (paragraf lanjutan), bab 3 (ejaan-semantik pada kalimat), dan bab 4 (sastra). Kuasai pemetaan paragraf di sini = mempercepat semua bab lain.' },
  { jenis: 'paragraf', teks: 'Bayangkan paragraf seperti satu paragraf chat panjang dari temanmu. Meski kalimatnya banyak, niatnya satu: menyampaikan satu hal pokok. Kalimat yang memuat hal pokok itulah kalimat utama; sisanya hanyalah pemerinci.' },
  {
    jenis: 'poin', judul: '5 jenis paragraf menurut letak kalimat utama', items: [
      'Deduktif — kalimat utama di AWAL: pernyataan umum dulu, baru penjelasan khusus.',
      'Ineratif — kalimat utama di TENGAH: kalimat sebelum dan sesudahnya penjelas.',
      'Induktif — kalimat utama di AKHIR: rincian khusus dulu, ditutup kesimpulan umum.',
      'Variatif — kalimat utama di AWAL dan AKHIR: gagasan awal dipertegas lagi di penutup.',
      'Deskriptif/naratif — kalimat utama TERSEBAR di seluruh paragraf: pembaca menyimpulkan sendiri.',
    ],
  },
  {
    jenis: 'jodohMini', judul: '🔗 Jodohkan: jenis paragraf dan letak kalimat utamanya',
    keterangan: 'Pemanasan cepat sebelum masuk materi informasi.',
    items: [
      { kiri: 'Kalimat utama di awal paragraf', kanan: 'Deduktif' },
      { kiri: 'Kalimat utama di tengah paragraf', kanan: 'Ineratif' },
      { kiri: 'Kalimat utama di akhir paragraf', kanan: 'Induktif' },
      { kiri: 'Kalimat utama di awal dan akhir', kanan: 'Variatif' },
      { kiri: 'Kalimat utama tersebar seluruh paragraf', kanan: 'Deskriptif/naratif' },
    ],
  },
  {
    jenis: 'poin', judul: 'Informasi tersurat vs tersirat', items: [
      'Tersurat — tertulis jelas di bacaan; ditemukan dengan membaca menyeluruh: apa masalahnya, di mana, kapan, siapa, mengapa, bagaimana.',
      'Tersirat — tidak tertulis, tersembunyi; ditemukan dengan menghubungkan data teks (menyimpulkan).',
      'Langkah tersirat 1: identifikasi hal-hal penting dalam teks.',
      'Langkah tersirat 2: buat opini/pendapat yang mencakup keseluruhan hal penting itu.',
    ],
  },
  {
    jenis: 'tabelinfo', judul: '5 jenis teks menurut isi & tujuan (bank h.41)',
    kolom: ['Jenis', 'Ciri-ciri', 'Tujuan'],
    rows: [
      { k: 'Deskripsi', v: 'Ada rincian detail: tempat, benda, orang.', w: 'Menggambarkan; pembaca seolah melihat/merasakan yang digambarkan.' },
      { k: 'Eksposisi', v: 'Berisi pengetahuan; pola definisi, proses, klasifikasi, ilustrasi.', w: 'Menjelaskan, memaparkan, menginformasikan.' },
      { k: 'Persuasi', v: 'Berisi ajakan.', w: 'Mengajak, membujuk, mengimbau.' },
      { k: 'Argumentasi', v: 'Ada pendapat, pengetahuan, fakta & opini.', w: 'Memengaruhi, meyakinkan, membuktikan.' },
      { k: 'Narasi', v: 'Ada alur, latar, tokoh.', w: 'Menceritakan, mengisahkan.' },
    ],
  },
  {
    jenis: 'flashcard', judul: '🃏 Flashcard: jenis teks -> tujuan utamanya',
    items: [
      { depan: 'Deskripsi', belakang: 'Menggambarkan objek rincian agar pembaca seolah melihat/merasakan.' },
      { depan: 'Eksposisi', belakang: 'Menjelaskan/memaparkan informasi atau pengetahuan.' },
      { depan: 'Persuasi', belakang: 'Mengajak, membujuk, mengimbau pembaca.' },
      { depan: 'Argumentasi', belakang: 'Meyakinkan pembaca dengan pendapat + bukti.' },
      { depan: 'Narasi', belakang: 'Menceritakan kisah (alur, latar, tokoh).' },
    ],
  },
  {
    jenis: 'tabelinfo', judul: '8 pola pengembangan paragraf (bank h.42)',
    kolom: ['Pola', 'Inti', 'Penanda cepat'],
    rows: [
      { k: 'Deskripsi', v: 'Menggambarkan objek/tempat/peristiwa rinci.', w: 'Rincian ciri yang bisa dibayangkan.' },
      { k: 'Eksposisi', v: 'Menjelaskan topik agar pembaca paham.', w: 'Umum -> rincian -> penutup, tanpa membujuk.' },
      { k: 'Argumentasi', v: 'Meyakinkan pembaca dengan alasan/bukti.', w: 'Klaim + bukti pendukung.' },
      { k: 'Prosedural', v: 'Memberi langkah-langkah melakukan sesuatu.', w: 'Urutan langkah/manual.' },
      { k: 'Klasifikasi', v: 'Mengelompokkan informasi per kategori.', w: 'Pembagian kelompok berdasar kriteria.' },
      { k: 'Sebab-akibat (kausal)', v: 'Menunjukkan hubungan sebab dan akibat.', w: 'Karena -> maka/dampak.' },
      { k: 'Kronologis', v: 'Menyajikan informasi sesuai urutan waktu.', w: 'Penanda waktu berurutan.' },
      { k: 'Perbandingan', v: 'Membandingkan dua hal atau lebih.', w: 'Persamaan/perbedaan disandingkan.' },
    ],
  },
  {
    jenis: 'jodohMini', judul: '🔗 Jodohkan: pola pengembangan dan contoh pakainya',
    items: [
      { kiri: 'Dampak perubahan iklim terhadap lingkungan', kanan: 'Sebab-akibat (kausal)' },
      { kiri: 'Teks sejarah atau narasi kejadian', kanan: 'Kronologis' },
      { kiri: 'Manual instruksi/petunjuk penggunaan', kanan: 'Prosedural' },
      { kiri: 'Pengelompokan tumbuhan/binatang per ciri', kanan: 'Klasifikasi' },
      { kiri: 'Membandingkan dua teori atau produk', kanan: 'Perbandingan' },
      { kiri: 'Laporan hasil observasi tempat/benda', kanan: 'Deskripsi' },
    ],
  },
  {
    jenis: 'caraGemilang', judul: '👑 CG-PARAGRAF: D-I-I-V-D & lapis tujuan',
    teks: 'Letak kalimat utama = nama paragraf: Deduktif=depan, Ineratif=tengah, Induktif=belakang, Variatif=depan+belakang, Deskriptif/naratif=merata. Tujuan penulis = jenis teks (deskripsi-eksposisi-persuasi-argumentasi-narasi).',
    items: [
      'Cari gagasan utama: baca kalimat pertama & terakhir dulu — 80% paragraf ujian deduktif/induktif.',
      'Ragu jenis teks? Hitung kata kerja tujuan: mengajak=bujuk=persuasi; meyakinkan+bukti=argumentasi; murni informar=eksposisi.',
      'Soal bagan: tulis 3 informasi inti sesuai urutan muncul, cocokkan dengan label kotak.',
    ],
  },
  {
    jenis: 'benarSalah', judul: '⚖️ Cek pemahaman: paragraf & informasi',
    keterangan: 'Gemilang Drill — pemanasan sebelum zona berlatih.',
    items: [
      { teks: 'Paragraf deduktif memiliki kalimat utama di akhir paragraf.', jawaban: false, penjelasan: 'Deduktif di awal; yang di akhir itu induktif.' },
      { teks: 'Paragraf variatif mengulang gagasan utamanya di awal dan akhir.', jawaban: true, penjelasan: 'Gagasan awal dipertegas lagi pada kalimat terakhir.' },
      { teks: 'Informasi tersirat harus disimpulkan karena tidak tertulis langsung.', jawaban: true, penjelasan: 'Tersirat = tersembunyi; dihubungkan dari data teks.' },
      { teks: 'Teks persuasi bertujuan meyakinkan pembaca dengan bukti dan fakta.', jawaban: false, penjelasan: 'Itu argumentasi; persuasi = mengajak/membujuk/mengimbau.' },
      { teks: 'Pola pengembangan kronologis menyusun informasi menurut urutan waktu.', jawaban: true, penjelasan: 'Ciri: penanda waktu yang berurutan.' },
    ],
  },
  { jenis: 'callout', tipe: 'peringatan', judul: 'Jebakan ujian', teks: 'Ineratif vs induktif tertukar adalah kesalahan paling umum: ingat "ineratif = di teNGAH". Jebakan kedua: opsi gagasan utama yang sebenarnya hanya kalimat penjelas (terlalu detail) atau terlalu luas melebihi paragraf.' },
  {
    jenis: 'zona', items: [
      { soal: 'Paragraf yang kalimat utamanya terletak di tengah disebut paragraf ...', opsi: ['deduktif', 'ineratif', 'induktif', 'variatif', 'deskriptif'], jawaban: 1, pembahasan: 'Jalur konsep: ineratif menyimpan kalimat utama di tengah, diapit kalimat penjelas. Jalur Cara Gemilang: CG-PARAGRAF — ineratif = teNGAH.' },
      { soal: 'Bacalah paragraf berikut! (1) Sampah plastik menumpuk di saluran air. (2) Saat hujan deras, air tidak lagi punya jalan. (3) Akibatnya, banjir merendam permukiman warga hampir setiap musim hujan. Pola pengembangan paragraf tersebut adalah ...', opsi: ['perbandingan', 'kronologis', 'sebab-akibat', 'klasifikasi', 'prosedural'], jawaban: 2, pembahasan: 'Jalur konsep: rantai tumpukan sampah -> air terhambat -> banjir = hubungan sebab-akibat. Jalur Cara Gemilang: ada karena->dampak = kausal.' },
      { soal: 'Teks yang berisi ajakan kepada pembaca untuk mengikuti suatu kegiatan tergolong teks ...', opsi: ['deskripsi', 'eksposisi', 'narasi', 'persuasi', 'argumentasi'], jawaban: 3, pembahasan: 'Jalur konsep: ciri persuasi = berisi ajakan; tujuannya mengajak/membujuk/mengimbau. Jalur Cara Gemilang: kata "ajakan" langsung kunci persuasi.' },
    ],
  },
  { jenis: 'callout', tipe: 'guru', judul: 'Ringkas sendiri', teks: 'Tulis ulang 5 jenis paragraf + 8 pola pengembangan dengan bahasamu sendiri dalam satu halaman, lalu tandai pola yang paling sering muncul di latihan bab ini. Ringkasan buatan sendiri diingat jauh lebih lama.' },

  // ===== SUBBAB B: PRAGMATIK — BAGAN/SKEMA =====
  { jenis: 'judul', teks: 'Pragmatik: Membaca Bagan, Skema, dan Kerangka' },
  { jenis: 'kilat', teks: 'Skema, bagan, dan kerangka adalah garis besar suatu tulisan dalam bentuk gambar atau grafik untuk memudahkan pemahaman. Di ujian, bagan muncul dua arah: memilih bagan yang cocok untuk sebuah teks, dan membaca maksud sebuah bagan.' },
  { jenis: 'paragraf', teks: 'Skema memiliki arti yang sama dengan bagan, rangka, atau denah. Skema menggambarkan secara analitik sistem atau olahan data sehingga pembaca melihat keseluruhan sekaligus. Karena itu bagan menjadi bahasa favorit soal pemahaman praktis (pragmatik).' },
  {
    jenis: 'gambar', url: '/bagan/bab1-materi-1.svg',
    keterangan: 'Bagan contoh dari buku (1.1.2): alur penelitian-pengembangan — Analisis Kebutuhan → Analisis Kurikulum → Pengembangan Produk Awal → Validasi Ahli → Revisi Produk → Uji Coba Lapangan → Revisi Produk Akhir. Cara baca: label kotak → arah panah → loop revisi.',
  },
  {
    jenis: 'urutan', judul: '🧩 Susun: alur bagan penelitian-pengembangan (contoh bank h.42)',
    keterangan: 'Contoh bagan buku: alur pengembangan produk dari kebutuhan sampai revisi akhir.',
    items: [
      'Analisis kebutuhan',
      'Analisis kurikulum',
      'Pengembangan produk awal',
      'Validasi ahli',
      'Revisi produk',
      'Uji coba lapangan',
      'Revisi produk akhir',
    ],
  },
  {
    jenis: 'poin', judul: 'Cara membaca bagan ala tentor', items: [
      'Baca label setiap kotak dulu sebelum melihat anak panah — label adalah informasi intinya.',
      'Ikuti arah anak panah: urutan alur = urutan panah, bukan urutan posisi gambar.',
      'Waspadai loop revisi: panah balik berarti tahap sebelumnya diulang setelah evaluasi.',
      'Soal "bagan yang tepat": tulis 3 informasi inti teks sesuai urutan muncul, lalu cocokkan — kotak berlebih atau kurang = salah.',
    ],
  },
  {
    jenis: 'caraGemilang', judul: '👑 CG-BAGAN: Label–Panah–Loop',
    teks: 'Bagan = label (isi kotak) + panah (alur) + loop (pengulangan). Soal bagan selalu bisa dipecahkan dengan menulis ulang tiga unsur itu dari teks.',
    items: [
      'Soal memilih bagan: coret opsi yang kotaknya menambah/mengurangi informasi teks.',
      'Soal membaca bagan: jawab dari panah, jangan dari posisi kotak di gambar.',
      'Loop revisi = tanda tahap sebelumnya belum final.',
    ],
  },
  {
    jenis: 'zona', items: [
      { soal: 'Skema, bagan, dan kerangka pada hakikatnya adalah ...', opsi: ['ringkasan teks dalam bentuk poin', 'garis besar tulisan dalam bentuk gambar/grafik', 'daftar istilah penting suatu bacaan', 'urutan kalimat utama tiap paragraf', 'catatan kaki sebuah tulisan'], jawaban: 1, pembahasan: 'Jalur konsep: buku mendefinisikan skema/bagan/kerangka sebagai garis besar tulisan berbentuk gambar/grafik untuk memudahkan pemahaman. Jalur Cara Gemilang: CG-BAGAN — bagan = peta garis besar.' },
      { soal: 'Pada bagan alur pengembangan produk, tahap segera setelah "validasi ahli" adalah ...', opsi: ['uji coba lapangan', 'analisis kurikulum', 'revisi produk', 'revisi produk akhir', 'pengembangan produk awal'], jawaban: 2, pembahasan: 'Jalur konsep: urutan bagan buku: validasi ahli -> revisi produk -> uji coba lapangan. Jalur Cara Gemilang: ikuti panahnya — setelah validasi pasti revisi.' },
      { soal: 'Sebuah teks memuat tiga informasi inti: pengertian lensa kontak, dampak negatif pemakaian, dan pencegahan bahaya. Bagan yang tepat harus memuat ...', opsi: ['pengertian -> dampak positif -> solusi', 'pemakaian -> dampak negatif -> pencegahan', 'pengertian -> pencegahan -> dampak negatif', 'dampak negatif -> pengertian -> pemakaian', 'pencegahan -> pemakaian -> pengertian'], jawaban: 1, pembahasan: 'Jalur konsep: bagan benar mengikuti urutan & isi informasi teks (pola soal asli #18): pemakaian/penggunaan -> dampak negatif -> pencegahan. Jalur Cara Gemilang: tulis 3 inti sesuai urutan muncul, cocokkan label kotak.' },
    ],
  },
  { jenis: 'callout', tipe: 'info', judul: 'Siap uji pemahaman', teks: 'Subbab paragraf & pragmatik tuntas. Saat mengerjakan 25 soal resmi bab ini, tandai tiap soal dengan label CG-nya (gagasan utama / tujuan / bagan / pola / B-S tabel) — pola label itulah yang membuat latihan berikutnya terasa repetitif dan cepat.' },
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
const SUMBER = 'Bank owner: Sukses Tes Kemampuan Akademik SMA/Saintek, Bab 1 Paragraf 1 & Pragmatik h.40-42; kunci & pembahasan buku (soal asli #{no})';
const ujiPemahaman = E.soal.map((s0) => {
  const no = s0.no;
  const s = { ...s0, teks: perbaiki(s0.teks), opsi: s0.opsi.map(perbaiki), baris: s0.baris.map(perbaiki), kolom: s0.kolom.map(perbaiki) };
  const jawaban = kunciDariPembahasan(no, s);
  const kr = kunciTabelRingkas(no, s.kolom, s.tipe);
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
    ...(OPSI_GAMBAR[no] ? { opsiGambar: OPSI_GAMBAR[no] } : {}),
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
      'Bank owner: salinan digital HTML bab 1-4 dari berkas pindai buku Sukses Tes Kemampuan Akademik SMA – Saintek (bab 1 h.40-42 + kunci/pembahasan); kunci mengikuti cetakan asli dengan koreksi salah cetak terdokumentasi.',
      'Kartu CG-PARAGRAF, CG-BAGAN, tabel penanda pola, dan soal Zona Berlatih = Gemilang Drill tim Gemilang mengikuti pola soal bank owner.',
      'Skema widget interaktif: docs/MATERI-INTERAKTIF.md (turn 87).',
    ],
  },
  bab: [{
    judul: 'Bab 1 — Paragraf 1 & Pragmatik (Edisi Cara Gemilang)',
    ringkasan: 'Gagasan utama & 5 jenis paragraf, informasi tersurat-tersirat, tujuan penulis (5 jenis teks), 8 pola pengembangan, serta membaca bagan/skema (pragmatik) — dengan jodohkan, flashcard, susun urutan, benar/salah, dan 25 soal resmi bank berstimulus teks utuh + pembahasan dua jalur.',
    estimasiMenit: 75, urutan: 1, tipe: 'teks',
    sections, ujiPemahaman,
  }],
};

// ---------- guard ----------
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

const outDraft = join(ROOT, 'docs/drafts/draft-bahasa-indonesia-k12-v1-bab1.json');
const outImpor = join(ROOT, 'IMPOR-BAHASA-INDONESIA-BAB1-TERBARU.json');
writeFileSync(outDraft, json + '\n');
writeFileSync(outImpor, json + '\n');
console.log('SELESAI bab1 | sections:', sections.length, '| soal:', ujiPemahaman.length,
  '| pg:', ujiPemahaman.filter((q) => q.tipe === 'pg').length,
  '| pgMulti:', ujiPemahaman.filter((q) => q.tipe === 'pgMulti').length,
  '| tabel:', ujiPemahaman.filter((q) => q.tipe === 'tabel').length,
  '| mandiri:', ujiPemahaman.filter((q) => q.soal.startsWith('Bacalah paragraf berikut dengan saksama! Fenomena') || q.soal.startsWith('Bacalah paragraf berikut dengan saksama Laptop')).length);
console.log('ukuran:', (json.length / 1024).toFixed(1), 'KB');
