// scripts/build-bindo-k12-bab1.mjs
// ============================================================
// BUILDER MATERI: B. INDONESIA WAJIB K12 — BAB 2 PARAGRAF II (Turn 90)
// Sumber: paragraf-2.html (Sukses TKA SMA/Saintek bab 2 h.50-51 + kunci).
// Kerangka helper diwarisi build-bindo-k12-bab1.mjs (generate turn 90).
// ============================================================
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const E = JSON.parse(readFileSync(process.argv[2] || join(ROOT, '.ekstrak-bab2.json'), 'utf-8'));

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
  1: 'Kalimat penjelas = perinci kalimat utama; cari opsi yang merinci peristiwa yang sama (nama KA, desain, gerbong), bukan peristiwa waktu lain.',
  2: 'Kalimat pengisi rumpang = jembatan kalimat sebelum-sesudahnya; uji kohesi: subjek & kata rujukan harus nyambung.',
  3: 'Hubungan antarparagraf = tanya arah logika (akibat->sebab, umum->rinci); pilih dua opsi yang searah dengan urutan informasi teks.',
  4: 'Fakta = tercek angka/waktu/tempat (apa-siapa-berapa-di mana-kapan); opsi berisi penilaian = opini = jawaban soal "bukan fakta".',
  5: 'Simpulan = rangkuman SELURUH paragraf; coret opsi yang hanya memuat satu detail atau menambah klaim baru.',
  6: 'Uji tiap opsi terhadap kalimat utama paragraf: penjelas sah = memerinci topik; yang membelok ke ciri fisik sekilas = tidak mendukung.',
  7: 'Kalimat pengisi = yang topiknya sama dengan kalimat utama DAN kalimat sesudah rumpang; konjungsi sebab (karena) sering jadi engsel.',
  8: 'Hubungan isi = bandingkan fungsi kedua paragraf (pengembangan gagasan vs perbandingan vs sebab-akibat) sebelum menilai pernyataan.',
  9: 'Fakta dalam teks = kalimat berdata (nama latin, asal, kandungan); pernyataan bernuansa pendapat = tidak masuk fakta.',
  10: 'Simpulan tepat = kalimat terluas yang setia pada semua paragraf; opsi bernada menghakimi (melanggar hukum, sekadar atraksi) = coret.',
  11: 'Penjelas tak sesuai = kalimat yang menyimpang dari kalimat utama paragraf; bandingkan subjek setiap opsi dengan topik paragraf.',
  12: 'Pengisi paragraf = lanjutkan kata kunci kalimat sebelumnya (bahasa setempat -> nama tradisi), bukan informasi baru.',
  13: 'Hubungan paragraf = fungsi masing-masing: makna ritual lalu tahapan cara -> "menjelaskan ... dan menguraikan tahapan".',
  14: 'Opini = ada penilaian/perasaan ("betapa eratnya", "indah"); tanggal, musim, jadwal = fakta.',
  15: 'Simpulan teks fenomena = gabungkan definisi + sebab + dampak dalam satu kalimat yang tidak menambah informasi.',
  16: 'Tabel Sesuai: verifikasi per pernyataan ke kalimat teks; penukaran nama/sejarah sering dijungkirbalikkan di pengecoh.',
  17: 'Rumpang bernomor = lihat kalimat sebelum & sesudah; opsi benar memakai rujukan/conjunction yang merujuk keduanya.',
  18: 'Hubungan antarparagraf = petakan isi tiap paragraf dulu (mekanisme vs dampak vs manfaat), baru cocokkan dengan opsi.',
  19: '"Bukan opini" = cari kalimat berdata kandungan/klasifikasi (angka, kelompok sayuran); pandangan masyarakat = opini.',
  20: 'Simpulan teks mitos-fakta = tegaskan hasil verifikasi: mitos gugur, fakta nutrisi berdiri.',
  21: 'Kalimat tidak padu = topik menyimpang dari kalimat utama paragraf; tandai subjek tiap kalimat (sawi vs istilah vs vitamin).',
  22: 'Pengisi rumpang ganda: satu menutup gagasan sebelumnya (fakta kadar), satu membuka gagasan pendekatan berbasis bukti.',
  23: 'Hubungan paragraf 1-2 = pernyataan umum -> penjelasan pendukung; coret opsi "membantah" bila nada paragraf sejalan.',
  24: 'Fakta = terukur & berwaktu ("enam hingga delapan bulan"); opsi bernada promosi = opini.',
  25: 'Simpulan = inti seluruh paragraf: kenaf = serat alam berkelanjutan multi-manfaat; coret opsi ekstrem (invasif, sintetis).',
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
  // ===== SUBBAB A: KALIMAT PENJELAS (2.1) =====
  { jenis: 'judul', teks: 'Kalimat Penjelas' },
  { jenis: 'kilat', teks: 'Kalimat penjelas adalah kalimat yang menjelaskan atau menjabarkan kalimat utama. Sifatnya lebih khusus dan detail, sehingga ia menjadi cara penulis menjabarkan pentingnya ide pokok. Soal ujian sering meminta menemukan penjelas yang TIDAK mendukung topik — itu uji pemahaman yang sama dari arah sebaliknya.' },
  { jenis: 'paragraf', teks: 'Bayangkan paragraf seperti pohon: kalimat utama adalah batangnya, kalimat penjelas adalah ranting dan daunnya. Semua ranting harus tumbuh dari batang yang sama; ranting dari pohon lain itulah yang disebut kalimat tidak padu.' },
  {
    jenis: 'poin', judul: 'Ciri-ciri kalimat penjelas (bank h.50)', items: [
      'Bersifat khusus (merinci, bukan gagasan umum).',
      'Menjelaskan atau menjabarkan kalimat utama.',
      'Sering memakai konjungsi seperti dan.',
      'Membutuhkan kata penghubung seperti bahkan, misalnya, contohnya agar koheren (padu) antarkalimat.',
    ],
  },
  {
    jenis: 'benarSalah', judul: '⚖️ Cek pemahaman: kalimat penjelas',
    keterangan: 'Gemilang Drill — panaskan mesin sebelum zona berlatih.',
    items: [
      { teks: 'Kalimat penjelas bersifat lebih khusus daripada kalimat utama.', jawaban: true, penjelasan: 'Penjelas merinci; utama memayungi.' },
      { teks: 'Kalimat yang topiknya menyimpang dari kalimat utama disebut kalimat tidak padu.', jawaban: true, penjelasan: 'Itu penjelas "palsu" yang sering jadi kunci soal "tidak mendukung".' },
      { teks: 'Kalimat penjelas tidak boleh memakai konjungsi.', jawaban: false, penjelasan: 'Justru konjungsi (bahkan, misalnya, contohnya) menjaga koherensi.' },
      { teks: 'Satu paragraf boleh memiliki beberapa ide pokok agar kaya.', jawaban: false, penjelasan: 'Syarat paragraf baik = kesatuan: satu ide pokok per paragraf.' },
    ],
  },
  {
    jenis: 'caraGemilang', judul: '👑 CG-PENJELAS: batang-ranting',
    teks: 'Kalimat utama = batang (umum, mewadahi); kalimat penjelas = ranting (khusus, merinci). Kalimat tidak padu = ranting dari pohon lain.',
    items: [
      'Temukan batang dulu: kalimat paling umum di awal/akhir paragraf.',
      'Uji tiap opsi: merinci batang = penjelas sah; membahas hal lain = tidak mendukung/tidak padu.',
      'Soal "kecuali/tidak mendukung" = cari ranting asing, biasanya menyelinap sebagai fakta benar tapi beda topik.',
    ],
  },
  { jenis: 'callout', tipe: 'peringatan', judul: 'Jebakan ujian', teks: 'Opsi pengecoh pada soal kalimat penjelas biasanya BENAR secara isi tetapi merinci hal lain (mis. penampilan fisik saat topik manfaat). Jangan menilai kebenaran fakta, nilailah keterhubungan ke kalimat utama.' },
  {
    jenis: 'zona', items: [
      { soal: 'Kalimat penjelas berfungsi untuk ...', opsi: ['memperkenalkan ide pokok baru', 'menjelaskan atau menjabarkan kalimat utama', 'menutup paragraf dengan simpulan umum', 'memindahkan topik ke paragraf berikut', 'memberi judul paragraf'], jawaban: 1, pembahasan: 'Jalur konsep: penjelas merinci kalimat utama (bank h.50). Jalur Cara Gemilang: CG-PENJELAS — ranting menjabarkan batang.' },
      { soal: 'Bacalah paragraf berikut! (1) Temulawak menyimpan banyak manfaat kesehatan. (2) Kurkuminoid di dalamnya berperan sebagai antioksidan. (3) Warna rimpangnya kuning kecokelatan. (4) Manfaat itu didukung kajian farmakologi modern. Kalimat yang tidak mendukung topik utama adalah ...', opsi: ['(1)', '(2)', '(3)', '(4)', 'tidak ada'], jawaban: 2, pembahasan: 'Jalur konsep: topik = manfaat kesehatan; kalimat (3) membahas ciri fisik, bukan manfaat → tidak padu. Jalur Cara Gemilang: ranting asing = ciri fisik di pohon manfaat.' },
      { soal: 'Konjungsi berikut yang lazim dipakai kalimat penjelas untuk menjaga koherensi adalah ...', opsi: ['bahkan, misalnya, contohnya', 'atau, ataupun', 'meskipun, walau', 'jika, apabila', 'ketika, sejak'], jawaban: 0, pembahasan: 'Jalur konsep: bank menyebut bahkan, misalnya, contohnya sebagai penghubung penjelas. Jalur Cara Gemilang: penjelas = perinci → butuh kata perinci (misalnya/contohnya).' },
    ],
  },

  // ===== SUBBAB B: PARAGRAF RUMPANG (2.2) =====
  { jenis: 'judul', teks: 'Paragraf Rumpang & Syarat Paragraf Padu' },
  { jenis: 'kilat', teks: 'Paragraf rumpang punya bagian kosong yang harus diisi kalimat tepat. Kuncinya tiga syarat paragraf: kesatuan (satu ide pokok), koherensi (keterkaitan makna), dan kohesi (keterkaitan bentuk lewat kata penghubung dan rujukan).' },
  {
    jenis: 'poin', judul: '3 syarat paragraf baik', items: [
      'Kesatuan — satu paragraf hanya membahas satu ide pokok/gagasan utama.',
      'Koherensi (kepaduan makna) — antarkalimat berkaitan timbal balik; tanpa ini pembaca menemukan lompatan pikiran.',
      'Kohesi (kepaduan bentuk) — kepaduan lewat pilihan kata perujuk dan penghubung.',
    ],
  },
  {
    jenis: 'tabelinfo', judul: '6 hubungan kohesi & penandanya (bank h.50)',
    kolom: ['Hubungan', 'Penanda', 'Contoh kata'],
    rows: [
      { k: 'Referensi', v: 'Kata penunjuk', w: 'itu, ini, tersebut, berikut' },
      { k: 'Pronominal', v: 'Kata ganti', w: 'saya, kami, kita, engkau, Anda, mereka, ia' },
      { k: 'Elusif', v: 'Cakupan bagian', w: 'sebagian, seluruhnya' },
      { k: 'Konjungsi', v: 'Kata penghubung', w: 'selanjutnya, setelah itu' },
      { k: 'Leksikal', v: 'Pengulangan/sinonim/hiponim', w: 'mengulang kata kunci atau padanannya' },
      { k: 'Kontekstual', v: 'Pertentangan makna', w: 'akan tetapi, sebaliknya, meskipun, namun' },
    ],
  },
  {
    jenis: 'isianRumpang', judul: '✍️ Isian rumpang: penanda kohesi',
    keterangan: 'Isi jenis hubungan kohesi sesuai penandanya.',
    items: [
      { teks: 'Kata "itu, ini, tersebut, berikut" menandai hubungan ...', jawaban: ['referensi'], hint: 'Bersifat penunjukan.', penjelasan: 'Hubungan referensi memakai kata penunjuk.' },
      { teks: 'Kata "selanjutnya, setelah itu" menandai hubungan ...', jawaban: ['konjungsi'], hint: 'Berupa kata penghubung.', penjelasan: 'Hubungan konjungsi memakai penghubung antarkalimat.' },
      { teks: 'Kata "sebagian, seluruhnya" menandai hubungan ...', jawaban: ['elusif'], hint: 'Berbicara cakupan.', penjelasan: 'Hubungan elusif ditandai sebagian/seluruhnya.' },
      { teks: 'Pengulangan kata, sinonim, atau hiponim menandai hubungan ...', jawaban: ['leksikal'], hint: 'Berkaitan dengan kosa kata.', penjelasan: 'Hubungan leksikal = keterkaitan lewat kata.' },
    ],
  },
  {
    jenis: 'caraGemilang', judul: '👑 CG-RUMPANG: sebelum-sesudah',
    teks: 'Kalimat pengisi rumpang = jembatan: subjek & kata rujukannya harus menyambung ke kalimat SEBELUM dan SESUDAH lubang.',
    items: [
      'Baca kalimat sebelum lubang: ambil kata kuncinya.',
      'Baca kalimat sesudah lubang: cari rujukan balik (itu, ini, tersebut).',
      'Pilih opsi yang memuat kedua sambungan itu; opsi fakta benar tapi nyambung satu arah = pengecoh.',
    ],
  },
  { jenis: 'callout', tipe: 'peringatan', judul: 'Jebakan ujian', teks: 'Pada soal rumpang berganda (pgMulti), satu opsi biasanya menutup gagasan lama dan satu lagi membuka gagasan baru — keduanya benar bersama. Jangan terpaku mencari satu kalimat "paling benar".' },
  {
    jenis: 'zona', items: [
      { soal: 'Syarat paragraf yang menuntut satu ide pokok per paragraf disebut ...', opsi: ['kohesi', 'koherensi', 'kesatuan', 'kronologi', 'kohabitasi'], jawaban: 2, pembahasan: 'Jalur konsep: kesatuan = satu ide pokok per paragraf. Jalur Cara Gemilang: satu paragraf satu pohon.' },
      { soal: 'Bacalah paragraf berikut! (1) Banjir rob merendam pesisir utara. (2) ... (3) Akibatnya, ratusan warga harus mengungsi setiap pasang besar tiba. Kalimat yang tepat untuk mengisi rumpang adalah ...', opsi: ['Warga pesisir gemar menangkap ikan saat pasang.', 'Kondisi ini diperparah penurunan muka tanah yang terus berlangsung.', 'Pasar ikan di kota itu buka sejak subuh.', 'Banyak rumah bercat biru di sepanjang pantai.', 'Nelayan menggunakan perahu kayu buatan lokal.'], jawaban: 1, pembahasan: 'Jalur konsep: pengisi harus menjembatani sebab (rob) ke akibat (mengungsi): penurunan tanah memperparah genangan. Jalur Cara Gemilang: jembatan sebelum-sesudah.' },
      { soal: 'Kata "mereka" dalam kalimat kedua yang merujuk kelompok orang pada kalimat pertama termasuk hubungan ...', opsi: ['leksikal', 'pronominal', 'elusif', 'kontekstual', 'konjungsi'], jawaban: 1, pembahasan: 'Jalur konsep: kata ganti orang = hubungan pronominal. Jalur Cara Gemilang: pronominal = pribadi (saya-kami-mereka).' },
    ],
  },

  // ===== SUBBAB C: HUBUNGAN ISI ANTARPARAGRAF (2.3) =====
  { jenis: 'judul', teks: 'Hubungan Isi Antarparagraf' },
  { jenis: 'kilat', teks: 'Teks yang baik menjalin paragraf-paragrafnya: koheren, satu kesatuan, dihubungkan kalimat penghubung, berstruktur konsisten, dan berpola sama. Soal hubungan antarparagraf menguji kemampuan memetakan arah logika teks.' },
  {
    jenis: 'poin', judul: 'Enam perekat antarparagraf (bank h.51)', items: [
      'Koherensi — keterkaitan erat dengan paragraf sebelum & sesudah; dicapai lewat frasa penghubung (oleh karena itu, dengan demikian), pengulangan ide kunci, dan referensi.',
      'Kesatuan (unity) — tiap paragraf satu ide pokok yang mendukung ide utama teks.',
      'Kalimat penghubung — kalimat pembuka penjembatan ("Sebelum membahas lebih lanjut...") atau kalimat penutup-simpulan yang menyambung ke topik berikut.',
      'Struktur teks konsisten — mis. argumentatif: tiap paragraf satu alasan menuju simpulan.',
      'Perbandingan & kontras — paragraf kelebihan lalu paragraf kekurangan.',
      'Pola pengembangan sama — contoh lalu alasan/bukti dengan gaya sejalan.',
    ],
  },
  {
    jenis: 'jodohMini', judul: '🔗 Jodohkan: perekat dan wujudnya di teks',
    items: [
      { kiri: 'Frasa "oleh karena itu", "dengan demikian"', kanan: 'Koherensi lewat kata penghubung' },
      { kiri: 'Kata kunci diulang di paragraf berikutnya', kanan: 'Pengulangan ide' },
      { kiri: 'Kata ganti merujuk ide paragraf sebelumnya', kanan: 'Referensi' },
      { kiri: 'Paragraf kelebihan lalu paragraf kekurangan', kanan: 'Perbandingan & kontras' },
      { kiri: '"Sebelum membahas lebih lanjut, perlu dipahami bahwa…"', kanan: 'Kalimat pembuka penjembatan' },
    ],
  },
  {
    jenis: 'caraGemilang', judul: '👑 CG-HUBUNG: peta arah logika',
    teks: 'Hubungan antarparagraf = arah logika: umum->rinci, sebab->akibat, klaim->dukung, makna->cara, kelebihan->kekurangan.',
    items: [
      'Tulis satu kata isi per paragraf (mis: akibat, sebab, contoh).',
      'Hubungkan dengan panah logika; nama panah itulah jawabannya.',
      'Opsi "membantah" hanya benar bila nada paragraf benar-benar berlawanan.',
    ],
  },
  {
    jenis: 'zona', items: [
      { soal: 'Paragraf pertama memaparkan menurunnya hasil panen; paragraf kedua memerinci penyebabnya berupa cuaca ekstrem dan hama. Hubungan kedua paragraf itu adalah ...', opsi: ['akibat ke sebab', 'sebab ke akibat', 'perbandingan setara', 'contoh ke definisi', 'kronologis murni'], jawaban: 0, pembahasan: 'Jalur konsep: paragraf 1 akibat (penurunan), paragraf 2 sebab (cuaca, hama) → akibat ke sebab. Jalur Cara Gemilang: CG-HUBUNG — tulis isi, tarik panah.' },
      { soal: 'Frasa penghubung berikut yang lazim menciptakan koherensi antarparagraf adalah ...', opsi: ['selanjutnya, setelah itu', 'oleh karena itu, dengan demikian', 'bahkan, misalnya', 'atau, ataupun', 'jika, asalkan'], jawaban: 1, pembahasan: 'Jalur konsep: bank menyebut oleh karena itu, dengan demikian, selain itu sebagai frasa transisi antarparagraf. Jalur Cara Gemilang: transisi logis = sebab-akibat ringkas.' },
    ],
  },

  // ===== SUBBAB D: FAKTA & OPINI (2.4) =====
  { jenis: 'judul', teks: 'Fakta dan Opini' },
  { jenis: 'kilat', teks: 'Fakta = kenyataan yang benar-benar ada/terjadi dan ada buktinya; diuji dengan apa, siapa, berapa, di mana, kapan. Opini = pandangan atau anggapan; diuji dengan mengapa dan bagaimana.' },
  {
    jenis: 'tabelinfo', judul: 'Fakta vs opini (bank h.51)',
    kolom: ['Aspek', 'Fakta', 'Opini'],
    rows: [
      { k: 'Hakikat', v: 'Kenyataan, benar-benar ada/terjadi, ada bukti.', w: 'Pandangan, pikiran, anggapan orang/sekelompok orang.' },
      { k: 'Kata tanya penguji', v: 'apa, siapa, berapa, di mana, kapan.', w: 'mengapa, bagaimana.' },
      { k: 'Contoh buku', v: 'Bencana banjir menimpa 200 rumah dan warga mengungsi beserta ternaknya.', w: 'Kondisi korban banjir di penampungan sangat menyedihkan.' },
    ],
  },
  {
    jenis: 'benarSalah', judul: '⚖️ Cek pemahaman: fakta atau opini?',
    items: [
      { teks: 'Kalimat berisi angka jumlah dan waktu kejadian biasanya fakta.', jawaban: true, penjelasan: 'Tercek lewat berapa/kapan.' },
      { teks: '"Pemandangan itu sungguh menakjubkan" adalah fakta.', jawaban: false, penjelasan: 'Penilaian subjektif = opini.' },
      { teks: 'Opini dapat diuji dengan kata tanya mengapa atau bagaimana.', jawaban: true, penjelasan: 'Sesuai bank h.51.' },
      { teks: 'Fakta harus bisa diverifikasi bukti, bukan sekadar masuk akal.', jawaban: true, penjelasan: 'Definisi fakta: ada buktinya.' },
    ],
  },
  {
    jenis: 'caraGemilang', judul: '👑 CG-FAKTA: 5K vs MB',
    teks: 'Fakta lolos uji 5K: apa-K, siapa, berapa, di mana-K, kapan-K (data). Opini menjawab Mengapa-Bagaimana (penilaian).',
    items: [
      'Ada angka, tanggal, nama tempat terverifikasi? → fakta.',
      'Ada kata penilaian (sangat, sebaiknya, tampaknya, menakjubkan)? → opini.',
      'Soal "bukan opini" = cari kalimat berdata; soal "bukan fakta" = cari kalimat berpendapat.',
    ],
  },
  { jenis: 'callout', tipe: 'peringatan', judul: 'Jebakan ujian', teks: 'Kalimat campuran fakta+penilaian tetap opini bila inti pernyataannya penilaian ("program itu berhasil meningkatkan...", tanpa data). Sebaliknya, kalimat datar berangka meski membosankan = fakta.' },
  {
    jenis: 'zona', items: [
      { soal: 'Kalimat berikut yang merupakan fakta adalah ...', opsi: ['Rasanya hidangan itu paling enak sekota.', 'Sebanyak 200 rumah terdampak banjir pada Senin malam.', 'Pemerintah sepertinya akan menaikkan tarif lagi.', 'Lukisan itu indah sekali bagi penikmat seni.', 'Menurut saya filmnya terlalu panjang.'], jawaban: 1, pembahasan: 'Jalur konsep: ada jumlah (200 rumah) dan waktu (Senin malam) = tercek = fakta. Jalur Cara Gemilang: CG-FAKTA — uji 5K.' },
      { soal: 'Kata tanya penguji opini menurut bank soal adalah ...', opsi: ['apa dan siapa', 'berapa dan kapan', 'di mana dan apa', 'mengapa dan bagaimana', 'kapan dan siapa'], jawaban: 3, pembahasan: 'Jalur konsep: opini diuji dengan mengapa/bagaimana (bank h.51). Jalur Cara Gemilang: MB = opini.' },
      { soal: 'Bacalah kalimat berikut! "Sawi termasuk sayuran rendah purin berdasarkan tabel komposisi pangan." Kalimat ini tergolong ...', opsi: ['opini karena menyebut sayuran', 'fakta karena merujuk data tabel', 'opini karena bersifat teknis', 'fakta karena berisi ajakan', 'bukan keduanya'], jawaban: 1, pembahasan: 'Jalur konsep: pernyataan merujuk data terverifikasi (tabel komposisi) = fakta. Jalur Cara Gemilang: ada sumber data = lolos uji bukti.' },
    ],
  },

  // ===== SUBBAB E: SIMPULAN (2.5) =====
  { jenis: 'judul', teks: 'Menyusun Simpulan' },
  { jenis: 'kilat', teks: 'Simpulan adalah hasil menyimpulkan: mencari inti dan pendapat dari data teks. Simpulan yang baik memuat ide pokok setiap paragraf, mencerminkan seluruh isi, dan tidak wajib berurutan.' },
  {
    jenis: 'urutan', judul: '🧩 Susun: langkah menyimpulkan teks dengan cepat',
    keterangan: 'Urutkan langkah kerja dari bank (bagan h.51).',
    items: [
      'Kumpulkan hal yang dibahas tiap paragraf',
      'Rangkai inti teks + pendapat',
      'Pastikan simpulan mencerminkan seluruh isi teks',
    ],
  },
  {
    jenis: 'gambar', url: '/bagan/bab2-materi-1.svg',
    keterangan: 'Bagan buku: cara menyimpulkan teks dengan cepat — kumpulkan "hal yang dibahas" tiap paragraf (kotak 1–3), lalu tarik simpulan yang mencerminkan SELURUH isi teks.',
  },
  {
    jenis: 'poin', judul: 'Ciri simpulan yang tepat', items: [
      'Memuat gagasan keseluruhan / semua hal yang dibahas.',
      'Mencerminkan seluruh isi teks, bukan satu paragraf.',
      'Boleh tidak berurutan sesuai teks — yang penting menyeluruh.',
      'Tidak menambah informasi baru di luar teks.',
    ],
  },
  {
    jenis: 'caraGemilang', judul: '👑 CG-SIMPUL: payung terbesar',
    teks: 'Simpulan = payung terbesar yang masih muat di kepala teks: mencakup semua paragraf, tanpa menambah klaim.',
    items: [
      'Tulis satu kata inti per paragraf, lalu cari opsi yang memuat semuanya.',
      'Opsi detail tunggal = terlalu sempit; opsi menambah hal baru = terlalu lebar.',
      'Nada menghakimi yang tidak ada di teks = coret.',
    ],
  },
  {
    jenis: 'zona', items: [
      { soal: 'Simpulan yang baik harus ...', opsi: ['mengikuti urutan kalimat teks persis', 'memuat ide pokok setiap paragraf', 'mengutip satu kalimat terindah', 'menambahkan pendapat penyimpulan', 'berfokus pada paragraf pertama'], jawaban: 1, pembahasan: 'Jalur konsep: ide pokok setiap paragraf termuat dalam simpulan (bank h.51). Jalur Cara Gemilang: CG-SIMPUL — payung semua paragraf.' },
      { soal: 'Teks berisi: (1) kenaf tumbuh cepat; (2) serat kenaf kuat untuk industri; (3) kenaf ramah lingkungan dibanding plastik. Simpulan terbaik adalah ...', opsi: ['Kenaf hanya cocok untuk industri tekstil.', 'Kenaf tanaman invasif yang berbahaya.', 'Kenaf serat alam berkelanjutan yang unggul agronomis, bermanfaat industri, dan ramah lingkungan.', 'Kenaf membutuhkan puluhan tahun untuk panen.', 'Kenaf pengganti plastik satu-satunya.'], jawaban: 2, pembahasan: 'Jalur konsep: simpulan menggabungkan ketiga paragraf (cepat/kuat/ramah) = opsi C-pol lengkap. Jalur Cara Gemilang: payung terbesar yang setia.' },
    ],
  },
  { jenis: 'callout', tipe: 'info', judul: 'Siap uji pemahaman', teks: 'Bab 2 tuntas: penjelas, rumpang, hubungan antarparagraf, fakta-opini, simpulan — lima keluarga soal yang mendominasi 25 soal resmi bab ini. Saat berlatih, beri label keluarga soal di tiap nomor supaya polanya menempel.' },
];

// ---------- rakit soal ----------
const SUMBER = 'Bank owner: Sukses Tes Kemampuan Akademik SMA/Saintek, Bab 2 Paragraf II h.50-51; kunci & pembahasan buku (soal asli #{no})';
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
      'Bank owner: salinan digital HTML bab 1-4 dari berkas pindai buku Sukses Tes Kemampuan Akademik SMA – Saintek (bab 2 h.50-51 + kunci/pembahasan); kunci mengikuti cetakan asli dengan koreksi salah cetak terdokumentasi.',
      'Kartu CG-PENJELAS, CG-RUMPANG, CG-HUBUNG, CG-FAKTA, CG-SIMPUL dan soal Zona Berlatih = Gemilang Drill tim Gemilang mengikuti pola soal bank owner.',
      'Skema widget interaktif: docs/MATERI-INTERAKTIF.md (turn 87).',
    ],
  },
  bab: [{
    judul: 'Bab 2 — Paragraf II: Penjelas, Rumpang, Hubungan Antarparagraf, Fakta-Opini, Simpulan (Edisi Cara Gemilang)',
    ringkasan: 'Kalimat penjelas & kalimat tidak padu, paragraf rumpang + 3 syarat paragraf + 6 hubungan kohesi, hubungan isi antarparagraf, fakta vs opini, dan menyusun simpulan — dengan jodohkan, isian rumpang, benar/salah, susun urutan, serta 25 soal resmi bank berstimulus teks utuh + pembahasan dua jalur.',
    estimasiMenit: 75, urutan: 2, tipe: 'teks',
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

const outDraft = join(ROOT, 'docs/drafts/draft-bahasa-indonesia-k12-v1-bab2.json');
const outImpor = join(ROOT, 'IMPOR-BAHASA-INDONESIA-BAB2-TERBARU.json');
writeFileSync(outDraft, json + '\n');
writeFileSync(outImpor, json + '\n');
console.log('SELESAI bab2 | sections:', sections.length, '| soal:', ujiPemahaman.length, '| ukuran:', (json.length / 1024).toFixed(1), 'KB');
