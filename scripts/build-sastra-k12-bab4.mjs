// scripts/build-sastra-k12-bab4.mjs
// ============================================================
// BUILDER MATERI: Bahasa Indonesia Wajib Kelas 12 — BAB 4 SASTRA
// (Turn 88 — arahan owner: "menata ulang materi bahasa indonesia
// wajib kelas 12 sma", sumber: sastra.html = salinan digital bank
// owner "Sukses Tes Kemampuan Akademik SMA – Saintek" bab 4 h.64-70
// + kunci/pembahasan h.39-42.)
//
// Alur: node scripts/ekstrak-sastra-html.mjs <sastra.html> <ekstrak.json>
//       node scripts/build-sastra-k12-bab4.mjs <ekstrak.json>
// Hasil: docs/drafts/draft-bahasa-indonesia-k12-v1-bab4.json
//        IMPOR-BAHASA-INDONESIA-BAB4-TERBARU.json (salinan root)
//
// PENTING: draft ini memakai WIDGET MATERI INTERAKTIF (turn 87) —
// hanya bisa diimor setelah branch feat/materi-interaktif-v1
// dimerge & deploy. Validator branch sudah mengenali jenisnya.
//
// Prinsip konten (cetak biru turn 81 + prompt produksi turn 86):
// - 25 soal VERBATIM bank owner + kunci dari cetakan + pembahasan
//   DUA JALUR (Jalur konsep dari buku, Jalur Cara Gemilang tambahan).
// - Stimulus cerpen utuh per grup soal (pola CBT: soal mandiri).
// - Perbaikan OCR minimal & terdokumentasi (daftar OCR_FIX); ejaan
//   tidak baku asli buku DIPERTAHANKAN (catatan versi HTML owner).
// - Kartu materi per subbab + widget interaktif (maks 2-3/subbab).
// ============================================================
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const E = JSON.parse(readFileSync(process.argv[2] || '/tmp/ekstrak-sastra.json', 'utf-8'));

// ---------- 1. PERBAIKAN OCR MINIMAL (terdokumentasi) ----------
// Hanya memperbaiki jelas-jelas artefak pindai; gaya bahasa asli dan
// ejaan tidak baku dari buku DIPERTAHANKAN sesuai catatan versi HTML.
const OCR_FIX = [
  ['Suruh suara serak', 'Seru suara serak'],                       // cerpen 1
  ['Dilirigi dengan kepala', 'Diiringi dengan kepala'],            // cerpen 1
  ['menghenritkan orang-orang', 'menghentikan orang-orang'],       // cerpen 3
  ['pejelan kaki', 'pejalan kaki'],                                // cerpen 3 (global)
  ['meneredtkan lembar demi lembar', 'menderetkan lembar demi lembar'], // cerpen 3
  ['memberikanmotivasi', 'memberikan motivasi'],                   // cerpen 2
  ['Ruangan bank berasap-cemas', 'Ruangan bank bernapas cemas'],   // cerpen 4 (selaras kutipan soal #16)
  ['menyerah kertas antreannya', 'menyerahkan kertas antreannya'], // cerpen 4
  ['Perbedaan pertamana di tanah Kel Kei', 'Perbedaan pertama di tanah Kei'], // cerpen 5
  ['Apakah asia kami', 'Apakah usia kami'],                        // cerpen 5
  ['Taspun angin.', 'Terpaan angin.'],                             // cerpen 5
  ['terbangertiup angin', 'terbang ditiup angin'],                 // cerpen 5
  ['mengukir panjang ikon. Empat kilan', 'mengukur panjang ikan. Empat kilan'], // cerpen 5
  ['sangat membuatku tertarik nokra', 'sangat membuatku tertarik'],// cerpen 5
  ['menagur jenis ikan setempat', 'menegur jenis ikan setempat'],  // pembahasan #19
];
function perbaiki(t) {
  let s = String(t);
  for (const [dari, ke] of OCR_FIX) s = s.split(dari).join(ke);
  return s.replace(/ {2,}/g, ' ').trim();
}

// ---------- 2. STIMULUS per grup soal ----------
const grupStimulus = {};
E.stimuli.forEach((s, i) => {
  const m = /nomor (\d+)[—–-]+(\d+)/.exec(s.petik);
  if (!m) throw new Error(`petunjuk stimulus ke-${i + 1} tak bernomor: ${s.petik}`);
  for (let n = Number(m[1]); n <= Number(m[2]); n++) grupStimulus[n] = i;
});
function teksStimulus(i) {
  const s = E.stimuli[i];
  const badan = s.paragraf.map(perbaiki).join('\n\n');
  return badan + (s.sumber ? `\n\n${perbaiki(s.sumber)}` : '');
}

// ---------- 3. KUNCI -> indeks ----------
const kunciPg = (no) => 'ABCDE'.indexOf(String(E.kunci[no]).trim().toUpperCase());
const kunciMulti = (no) => String(E.kunci[no]).split(',').map((x) => Number(x.trim()) - 1);
const kunciTabel = (no, kolom) => String(E.kunci[no]).split(',').map((tok) => {
  const c = tok.trim().toUpperCase()[0];
  const idx = kolom.findIndex((k) => k.toUpperCase().startsWith(c));
  if (idx < 0) throw new Error(`kunci ${tok} (soal ${no}) tak cocok kolom ${JSON.stringify(kolom)}`);
  return idx;
});

// ---------- 4. PEMBAHASAN DUA JALUR ----------
// Jalur konsep = dari buku (dibersihkan); jalur Cara Gemilang = jurus 1 kalimat.
const CG = {
  1: 'Soal "relevan dengan kehidupan sehari-hari" = cari perilaku tokoh yang paling umum terjadi di sekitarmu; di sini: anak malas yang asyik menonton saat diminta tolong orang tua.',
  2: 'CG-SASTRA: watak terlihat dari tindakan ("tak peduli... urusan emaknya" = apatis); waktu dicek dari petunjuk ("Bapakmu sudah mau berangkat" = pagi); POV = cari kata "aku" sebagai pencerita — tidak ada berarti orang ketiga.',
  3: 'Nilai sosial = hubungan & kepercayaan antarmanusia; ibu bisa berutang gula karena solidaritas dan rasa percaya dengan pemilik warung.',
  4: 'Soal makna kata = tes KBBI dulu: episode = bagian riwayat/seri cerita; pilih opsi sinonim terdekat, jangan terkecoh "kisah".',
  5: 'Watak = tindakan konsisten: menasihati dalam = bijaksana; selalu hadir mendengarkan = setia. Coret opsi yang bertolak belakang dengan tindakan tokoh.',
  6: 'Kata kunci suasana emosional: air mata, keluhan, putus asa — pilih kalimat dengan emosi paling kuat, bukan peristiwa fisik biasa.',
  7: 'Perjuangan menahan lelah dan ingin menyerah = urusan etika/tanggung jawab diri → nilai moral.',
  8: 'Unsur ekstrinsik psikologis = kondisi mental tokoh; cari opsi yang membahas ketahanan diri, bukan tren/media sosial/keluarga yang tak ada di teks.',
  9: 'Pola "bila X tidak terjadi" = balik sebab-akibatnya: satu-satunya penyemangat hilang → berhenti latihan.',
  10: 'Tema = persoalan yang mewarnai SELURUH kutipan: tuduhan tanpa bukti akibat prasangka → kesalahpahaman dalam interaksi sosial.',
  11: 'CG-SASTRA: waktu eksplisit "datang malam-malam begini" (bukan sore); watak kurir terbaca dari dialognya; narator menembus pikiran kurir ("pikir si kurir") = orang ketiga serbatahu; tokoh utama = yang pikirannya paling dieksplorasi = kurir.',
  12: 'Reaksi spontan tokoh: "Kurir itu terkejut. Ngerjain bagaimana?" lalu membela diri sopan — jawaban harus ada kutipannya di teks.',
  13: 'CG-MAKNA: tes tunjuk — sulap bisa ditunjuk sebagai pertunjukan nyata dengan trik tangan → denotasi; konotasi = makna kiasan berperasaan.',
  14: 'Pola "bila tidak merasa X" = hilangkan efek emosi itu: tak merasa dicurangi → tak muncul kecewa; antrean tetap dijalani sabar.',
  15: 'Latar = tempat + waktu + suasana, semuanya dari bukti teks: bank (bukan kantor pemerintahan), "bernapas cemas" = khawatir, "tertegun... bertanya-tanya" = heran, "Pagi itu" = pagi.',
  16: 'Benda mati berperilaku manusia ("ruangan bernapas cemas") = personifikasi. CG-MAKNA: cari subjek mati + kata kerja manusia.',
  17: 'Soal "kecuali/tidak terkandung" = eliminasi satu per satu dengan bukti teks: moral (antre), sosial (ketidakadilan), budaya (kebiasaan), psikologis (perasaan tokoh) ada; ketuhanan tidak dibahas.',
  18: 'Tema dari peristiwa dominan: perjalanan ke Pulau Kei + pengalaman di Pasar Langgur → perjalanan dan budaya lokal.',
  19: 'Amanat = nasihat hidup yang bisa dipetik pembaca: hargai cara hidup lokal + pandai beradaptasi. Coret opsi ekstrem ("jangan pernah", "hindarilah") yang tak didukung teks.',
  20: 'Cek per pernyataan dengan bukti teks: dokter-narator = Sharena (bukan Sammy); kata "aku" = orang pertama pelaku utama; konflik = beda pandangan Sharena-Sammy di pasar; "bau amis menembus serat kain" = hiperbola (melebih-lebihkan), bukan metafora.',
  21: 'Sikap Sharena = ingin tahu + mengapresiasi hal baru → rendah hati dan terbuka terhadap kearifan lokal.',
  22: 'Metafora alam untuk hidup-mati (tunas = bayi, daun kering = wafat) = kearifan lokal memandang siklus kehidupan.',
  23: 'Nilai sosial = hubungan antarmanusia: ikatan emosional nenek-cucu + transmisi nilai antargenerasi lewat dialog. Coret topik yang tak dibahas (kesenjangan ekonomi, kritik pendidikan, bahasa daerah).',
  24: 'CG-MAKNA: istilah sastra "pohon kehidupan" diuji dari konteks — daun tunas/hijau/kering dipetakan ke bayi/hidup/wafat = metafora siklus eksistensi, bukan pohon/organisasi/program harfiah.',
  25: 'Filosofi nenek: "gugur adalah hak semua daun" = kematian bisa datang kapan saja → akibat paling logis: tokoh aku menghargai hidup dengan bijak dan bersyukur.',
};

// Jalur konsep khusus (tabel & pgMulti) — dirakit dari tabel pembahasan buku.
const KET_TAMBAH = {
  '2-1': 'Sikap "tidak peduli" dan "itu urusan emaknya" menunjukkan karakter apatis (acuh tak acuh).',
};
function konsepSumber(no, kolom, jawabanIdx) {
  const p = E.pembahasan[no - 1];
  if (p.tabel) {
    // Rakit per baris; nilai kebenaran mengikuti KUNCI RESMI (bukan posisi
    // centang — buku punya salah cetak posisi centang, mis. no.20 baris 3).
    const bagian = p.tabel.map((r, i) => {
      const ket = perbaiki(r.ket) || KET_TAMBAH[`${no}-${i + 1}`] || '';
      return `Baris ${i + 1} — ${kolom[jawabanIdx[i]].toUpperCase()}: ${ket}`.replace(/:\s*$/, '.');
    });
    let teks = bagian.join(' ');
    if (no === 20) {
      teks += ' (Catatan: pada tabel pembahasan buku asli, posisi centang baris ke-3 tertukar; kunci resmi "S,B,B,S" dan keterangan di buku menyatakan BENAR — kami mengikuti kunci resmi.)';
    }
    return teks;
  }
  return perbaiki(String(p.teks).split(/\s*\|\|\s*/)[0])
    .replace(/\s*Jawaban:\s*[\s\S]*$/, '')   // buang ekor "Jawaban: X" (kunci sudah tampil di UI)
    .replace(/\. berdasarkan/g, '. Berdasarkan')
    .trim();
}
// pgMulti: teks sumber bercampur daftar opsi pipih -> tulis ulang setia isi buku.
const KONSEP_KHUSUS = {
  5: 'Lyra konsisten hadir mendengarkan keluhan dan menyemangati tokoh "aku" (setia). Nasihatnya — "Pelari yang berlari untuk mengalahkan pelari lain akan tertinggal karena sibuk menghitung maju lawan-lawannya" — menunjukkan kedalaman pikirannya dalam mengarahkan fokus pada pengembangan diri (bijaksana). Jadi watak Lyra: bijaksana dan setia (opsi 3 dan 5).',
  12: 'Saat dituduh, kurir "terkejut" dan bertanya "Ngerjain bagaimana?" (terkejut dan kebingungan), lalu membela diri dengan sopan: "Pak, saya ini kurir. Bukan pesulap..." (berusaha menjelaskan tidak mengambil uang). Tidak ada bukti di teks bahwa kurir marah, menuduh balik, tertawa, atau pergi diam-diam. Jawaban: opsi 1 dan 4.',
  15: 'Cerita berlangsung di bank, bukan kantor pemerintahan (opsi 1 gugur). Suasana cemas terasa dari ruang tunggu yang "bernapas cemas" dan penuh gerutuan (khawatir). Pak Slamet "tertegun" dan bertanya-tanya mengapa antrean digital lebih cepat padahal katanya habis (heran). Waktu eksplisit: "Pagi itu, Pak Slamet..." (pagi). Pak Slamet digambarkan kecewa dan miris, bukan marah. Jawaban: opsi 2, 4, dan 5.',
  19: 'Penulis menggambarkan keteraturan hidup warga lokal ("Mereka disiplin sehingga jarak tempuh bisa dihitung dengan aman, tenang, dan lancar"); Sharena menghargai keseriusan warga beraktivitas di Pasar Langgur, sementara Sammy dikritik karena tidak mau mengerti situasi pasar tradisional ("Kamu pikir kita sedang di mal. Ini Pasar, Sam. Tolong mengertilah!"). Amanat: hargai kebiasaan masyarakat lokal dan pandai-pandailah beradaptasi (opsi 1 dan 2).',
  23: 'Dialog pohon hayat merefleksikan ikatan emosional keluarga yang dibangun lewat pengalaman bersama dan dialog reflektif antargenerasi (opsi 2), sekaligus menjadi sarana transmisi nilai dan pemahaman kehidupan dari generasi tua ke generasi muda (opsi 3). Kesenjangan ekonomi, kritik pendidikan formal, dan pelestarian bahasa daerah tidak dibahas dalam kutipan. Jawaban: opsi 2 dan 3.',
};

function buatPembahasan(no, kolom, jawabanIdx) {
  const konsep = KONSEP_KHUSUS[no] || konsepSumber(no, kolom, jawabanIdx);
  return `Jalur konsep: ${konsep} Jalur Cara Gemilang: ${CG[no]}`;
}

// ---------- 5. KARTU MATERI (sections) — hasil penataan ulang ----------
// Template cetak biru turn 81 per subbab + widget interaktif turn 87.
const sections = [
  // ===== SUBBAB A: CERPEN — UNSUR INTRINSIK & EKSTRINSIK (4.1.1) =====
  { jenis: 'judul', teks: 'Cerpen: Unsur Intrinsik dan Ekstrinsik' },
  { jenis: 'kilat', teks: 'Cerpen adalah kisahan pendek, kurang dari 1.000 kata, yang memberikan kesan tunggal yang dominan dan memusatkan diri pada suatu tokoh dalam satu situasi. Pembangunnya ada dua: unsur intrinsik (dari dalam teks) dan unsur ekstrinsik (nilai dari luar teks).' },
  { jenis: 'peta', teks: 'Teks sastra adalah ladang soal pemahaman membaca di TKA/UTBK Bahasa Indonesia. Pola soal terlarisnya: identifikasi unsur intrinsik (watak, sudut pandang, latar, tema, amanat), menentukan nilai (moral, sosial, budaya), dan memaknai kata. Menguasai unsur cerpen berarti mengubah mayoritas soal sastra dari "menebak" menjadi "memetakan".' },
  { jenis: 'paragraf', teks: 'Bayangkan cerpen seperti sebuah foto, bukan film. Foto membekukan satu momen penting sehingga kesannya tunggal dan tajam. Karena itu cerpen memusatkan diri pada satu tokoh dalam satu situasi saja.' },
  {
    jenis: 'poin', judul: '7 Unsur Intrinsik (membangun dari DALAM teks)', items: [
      'Tema — gagasan dasar cerita; ditemukan melalui gagasan-gagasan atau pikiran tokoh.',
      'Amanat — ajaran atau pesan yang ingin disampaikan pengarang kepada pembaca.',
      'Gaya bahasa — penggunaan bahasa untuk menciptakan suasana/kekhasan cerita: majas, ungkapan, dialog, diksi; bisa sekaligus menggambarkan karakter tokoh.',
      'Penokohan (perwatakan) — pelukisan tokoh secara lahir dan batin: rupa, pandangan hidup, keyakinan, adat istiadat, sikap, dan tindak-tanduknya.',
      'Alur (plot) — rangkaian peristiwa yang saling berkesinambungan dan menyatakan hubungan sebab akibat; jenisnya: alur maju, alur mundur, dan campuran.',
      'Latar (setting) — tempat (di mana peristiwa terjadi), waktu (kapan), dan suasana (keadaan emosional cerita).',
      'Sudut pandang (point of view) — posisi pengarang membawakan cerita: orang pertama pelaku utama, orang pertama pelaku sampingan, orang ketiga serbatahu, orang ketiga terbatas.',
    ],
  },
  {
    jenis: 'flashcard', judul: '🃏 Flashcard: hafalkan 7 unsur intrinsik',
    keterangan: 'Ketuk kartu untuk melihat pengertian. Tandai yang sudah hafal!',
    items: [
      { depan: 'Tema', belakang: 'Gagasan dasar cerita; ditemukan lewat pikiran-pikiran tokoh.' },
      { depan: 'Amanat', belakang: 'Ajaran/pesan pengarang kepada pembaca.' },
      { depan: 'Gaya bahasa', belakang: 'Pemakaian bahasa (majas, diksi, dialog) untuk menciptakan suasana/kekhasan cerita.' },
      { depan: 'Penokohan', belakang: 'Pelukisan tokoh lahir & batin; cara: analitik (langsung) atau dramatik (tak langsung).' },
      { depan: 'Alur', belakang: 'Rangkaian peristiwa sebab-akibat; jenis: maju, mundur, campuran.' },
      { depan: 'Latar', belakang: 'Tempat, waktu, dan suasana (emosional) cerita.' },
      { depan: 'Sudut pandang', belakang: 'Posisi narator: orang ke-1 pelaku utama/sampingan; orang ke-3 serbatahu/terbatas.' },
    ],
  },
  {
    jenis: 'tabelinfo', judul: 'Jenis Tokoh & Cara Pelukisan Watak',
    kolom: ['Aspek', 'Jenis', 'Pengertian'],
    rows: [
      { k: 'Jenis tokoh', v: 'Protagonis', w: 'Tokoh baik; membawa/mendukung penyelesaian cerita.' },
      { k: 'Jenis tokoh', v: 'Antagonis', w: 'Tokoh penentang protagonis; sumber konflik.' },
      { k: 'Jenis tokoh', v: 'Tritagonis', w: 'Tokoh penengah antara protagonis dan antagonis.' },
      { k: 'Cara pelukisan', v: 'Analitik (langsung)', w: 'Pengarang menyebut langsung sifat tokoh (mis. "ia pemarah").' },
      { k: 'Cara pelukisan', v: 'Dramatik (tak langsung)', w: 'Watak tersirat dari tindakan, dialog, pikiran, fisik, atau ucapan tokoh lain.' },
    ],
  },
  {
    jenis: 'urutan', judul: '🧩 Susun: 5 Tahapan Alur Cerpen',
    keterangan: 'Urutkan tahapan alur dari awal sampai akhir cerita.',
    items: [
      'Orientasi — tahap pengenalan tokoh dan latar',
      'Rising action — konflik mulai muncul',
      'Turning point (klimaks) — konflik memuncak',
      'Antiklimaks — masalah/konflik mulai menurun',
      'Resolusi — tahap penyelesaian',
    ],
  },
  {
    jenis: 'tabelinfo', judul: 'Detektif Latar & Sudut Pandang',
    kolom: ['Unsur', 'Jenis', 'Cara mengenalinya di teks'],
    rows: [
      { k: 'Latar', v: 'Tempat', w: 'Di mana peristiwa terjadi: rumah, sekolah, desa, kota.' },
      { k: 'Latar', v: 'Waktu', w: 'Kapan peristiwa terjadi: pagi, malam, masa lalu, zaman modern — sering tersirat (mis. "bapakmu sudah mau berangkat" = pagi).' },
      { k: 'Latar', v: 'Suasana', w: 'Keadaan emosional cerita: sedih, tegang, bahagia, cemas.' },
      { k: 'Sudut pandang', v: 'Orang pertama pelaku utama', w: 'Narator "aku" = tokoh utama yang mengalami peristiwa.' },
      { k: 'Sudut pandang', v: 'Orang pertama pelaku sampingan', w: 'Narator "aku" menceritakan kisah tokoh lain.' },
      { k: 'Sudut pandang', v: 'Orang ketiga serbatahu', w: 'Narator menyebut nama/"dia" dan mengetahui isi hati SEMUA tokoh.' },
      { k: 'Sudut pandang', v: 'Orang ketiga terbatas', w: 'Narator hanya menembus pikiran/satu sudut pandang tokoh.' },
    ],
  },
  {
    jenis: 'jodohMini', judul: '🔗 Jodohkan: unsur intrinsik dan pengertiannya',
    keterangan: 'Pilih pasangan yang tepat untuk setiap unsur, lalu tekan Cek.',
    items: [
      { kiri: 'Gagasan dasar cerita', kanan: 'Tema' },
      { kiri: 'Pesan pengarang untuk pembaca', kanan: 'Amanat' },
      { kiri: 'Rangkaian peristiwa sebab-akibat', kanan: 'Alur' },
      { kiri: 'Tempat, waktu, dan suasana', kanan: 'Latar' },
      { kiri: 'Posisi pengarang membawakan cerita', kanan: 'Sudut pandang' },
      { kiri: 'Majas, diksi, dan dialog pencipta suasana', kanan: 'Gaya bahasa' },
    ],
  },
  { jenis: 'paragraf', teks: 'Unsur ekstrinsik adalah unsur yang membangun karya sastra dari luar dan secara tidak langsung memengaruhinya. Nilai-nilai ini bisa ditemukan dalam cerpen secara eksplisit (tertulis jelas) maupun implisit (harus disimpulkan).' },
  {
    jenis: 'poin', judul: '5 Nilai Unsur Ekstrinsik', items: [
      'Nilai moral — etika, akhlak, dan tanggung jawab (mis. perjuangan tokoh menahan lelah demi cita-cita).',
      'Nilai sosial — hubungan antarmanusia (mis. solidaritas, rasa percaya, empati).',
      'Nilai budaya — adat dan cara hidup masyarakat (mis. kearifan lokal memandang siklus kehidupan).',
      'Nilai politik — kekuasaan dan pemerintahan (mis. kritik terhadap layanan birokrasi).',
      'Nilai agama — hubungan manusia dengan Tuhan (mis. doa, kepasrahan, rasa syukur).',
    ],
  },
  {
    jenis: 'caraGemilang', judul: '👑 CG-SASTRA: kunci TAGALPS',
    teks: 'INTRINSIK = TAGALPS: Tema, Amanat, Gaya bahasa, Alur, Latar, Penokohan, Sudut pandang. EKSTRINSIK = nilai luar teks: moral–sosial–budaya–politik–agama.',
    items: [
      'Soal menyebut "unsur dalam teks" → sisir 7 slot TAGALPS satu per satu.',
      'Soal menyebut "nilai" atau "dari luar karya" → cocokkan dengan 5 nilai ekstrinsik.',
      'Tokoh: protagonis (baik), antagonis (penentang), tritagonis (penengah); watak dilukiskan analitik (langsung) atau dramatik (lewat tindakan/dialog).',
    ],
  },
  {
    jenis: 'benarSalah', judul: '⚖️ Cek pemahaman: intrinsik vs ekstrinsik',
    keterangan: 'Gemilang Drill — tandai Benar atau Salah sebelum lanjut ke zona berlatih.',
    items: [
      { teks: 'Gagasan dasar cerita disebut amanat.', jawaban: false, penjelasan: 'Gagasan dasar = tema; amanat = pesan pengarang untuk pembaca.' },
      { teks: 'Tahapan alur cerpen diawali orientasi dan diakhiri resolusi.', jawaban: true, penjelasan: 'Urutannya: orientasi → rising action → klimaks → antiklimaks → resolusi.' },
      { teks: 'Melukiskan watak tokoh lewat dialognya dengan tokoh lain adalah cara analitik.', jawaban: false, penjelasan: 'Itu cara dramatik (tak langsung); analitik = pengarang menyebut sifat tokoh secara langsung.' },
      { teks: 'Nilai agama dan nilai politik termasuk unsur ekstrinsik.', jawaban: true, penjelasan: 'Ekstrinsik memuat nilai moral, sosial, budaya, politik, dan agama.' },
      { teks: 'Sudut pandang orang ketiga serbatahu berarti narator mengetahui isi hati semua tokoh.', jawaban: true, penjelasan: 'Serbatahu = narator menembus pikiran/perasaan tokoh mana pun.' },
    ],
  },
  { jenis: 'callout', tipe: 'peringatan', judul: 'Jebakan ujian', teks: 'Orang pertama pelaku utama vs pelaku sampingan sama-sama memakai "aku" — bedanya: pelaku sampingan "aku"-nya menceritakan kisah tokoh lain. Jebakan kedua: pernyataan latar sering menukar suasana dengan waktu; selalu cari bukti eksplisit di teks (mis. "Bapakmu sudah mau berangkat" = pagi).' },
  {
    jenis: 'zona', items: [
      { soal: 'Berikut ini yang termasuk unsur intrinsik cerpen adalah ...', opsi: ['riwayat hidup pengarang', 'kondisi sosial masyarakat saat karya ditulis', 'alur', 'nilai keagamaan masyarakat pengarang', 'sejarah penerbit buku'], jawaban: 2, pembahasan: 'Jalur konsep: unsur intrinsik membangun dari dalam teks (TAGALPS) — alur termasuk di dalamnya; sisanya faktor luar (ekstrinsik). Jalur Cara Gemilang: hafal TAGALPS, coret yang berbau "luar teks".' },
      { soal: 'Bacalah kutipan berikut! "Jangan ke sana, Rin!" teriak Bima. Rina terpaku, jantungnya berdebar kencang. Ia tak pernah melihat Bima semarah itu. Watak Bima pada kutipan tersebut dilukiskan pengarang dengan cara ...', opsi: ['analitik, karena pengarang menyebut sifat tokoh langsung', 'dramatik, karena watak muncul lewat dialog dan reaksi tokoh', 'deskripsi fisik oleh narator', 'monolog batin tokoh utama', 'penjelasan latar suasana'], jawaban: 1, pembahasan: 'Jalur konsep: kemarahan Bima tidak disebut langsung, melainkan tersirat dari teriakan (dialog) dan efeknya pada Rina — itu cara dramatik. Jalur Cara Gemilang: ada bukti tindakan/dialog = dramatik; disebut terang-terangan = analitik.' },
      { soal: 'Sebuah cerpen memakai narator "aku" yang mengisahkan perjuangan Tio, sahabatnya, sebagai tokoh utama. Sudut pandang cerpen tersebut adalah ...', opsi: ['orang pertama pelaku utama', 'orang pertama pelaku sampingan', 'orang ketiga serbatahu', 'orang ketiga terbatas', 'campuran'], jawaban: 1, pembahasan: 'Jalur konsep: narator "aku" hadir, tetapi yang dikisahkan adalah tokoh lain (Tio) → "aku" menjadi pelaku sampingan/penyaksi. Jalur Cara Gemilang: "aku" cerita dirinya = pelaku utama; "aku" cerita orang lain = pelaku sampingan.' },
    ],
  },
  { jenis: 'callout', tipe: 'guru', judul: 'Ringkas sendiri (kebiasaan juara)', teks: 'Tutup materi ini, lalu tuliskan TAGALPS versi bahasamu sendiri di kertas beserta satu contoh buktinya dari cerpen yang baru kamu baca. Menulis ulang rangkuman menguatkan ingatan jauh lebih lama daripada membaca ulang.' },

  // ===== SUBBAB B: PERISTIWA YANG MUNGKIN TERJADI (4.1.2) =====
  { jenis: 'judul', teks: 'Memprediksi Peristiwa yang Mungkin Terjadi' },
  { jenis: 'kilat', teks: 'Menentukan peristiwa yang akan terjadi dalam cerpen bukanlah menebak, melainkan membaca dengan cermat alur cerita dan mengenali tanda-tanda yang ditanamkan pengarang. Tanda itu bisa berupa foreshadowing (pertanda), dialog tokoh, atau deskripsi suasana.' },
  { jenis: 'paragraf', teks: 'Soal prediksi selalu memakai pola "hal yang akan terjadi ... bila ..." atau "peristiwa yang mungkin terjadi selanjutnya". Kunci menjawabnya: setiap peristiwa dalam cerpen punya hubungan sebab-akibat. Jawaban yang benar pasti punya jejak di teks, sehebat apa pun opsi lain terdengar.' },
  {
    jenis: 'urutan', judul: '🧩 Susun: langkah sistematis memprediksi peristiwa',
    keterangan: 'Urutkan langkah dari bacaan sumber (4.1.2) berikut.',
    items: [
      'Analisis struktur cerita: orientasi, komplikasi/konflik, dan resolusi',
      'Perhatikan petunjuk teks: foreshadowing (ramalan/pertanda), dialog tokoh, dan deskripsi suasana',
      'Hubungkan sebab-akibat (kausalitas) antaperistiwa',
      'Gunakan pola umum cerita: konflik–klimaks–penyelesaian',
    ],
  },
  {
    jenis: 'istilah', items: [
      { k: 'Foreshadowing', v: 'Pertanda/ramalan yang ditanamkan pengarang sejak awal untuk peristiwa yang akan terjadi kemudian.' },
      { k: 'Kausalitas', v: 'Hubungan sebab-akibat antaperistiwa dalam cerita.' },
      { k: 'Komplikasi', v: 'Bagian struktur cerita tempat masalah muncul dan meningkat menuju klimaks.' },
    ],
  },
  { jenis: 'contoh', teks: 'Menerapkan jurus prediksi pada pola soal "bila ... tidak terjadi". Soal asli #9 bertanya: apa yang terjadi pada tokoh aku bila Lyra tidak menasihatinya. Langkah 1: temukan konflik utama tokoh — ia lelah berlatih dan ingin menyerah dari atletik. Langkah 2: temukan satu-satunya penyemangat di teks — hanya Lyra ("kalau bukan karena sahabatku Lyra, mungkin aku sudah menyerah"). Langkah 3: hilangkan peristiwa yang ditanyakan (nasihat Lyra), tarik akibat paling logis — tokoh aku berhenti latihan. Itulah jawaban C pada soal asli #9.' },
  {
    jenis: 'caraGemilang', judul: '👑 CG-RAMAL: Petunjuk–Sebab–Pola',
    teks: 'Prediksi = petunjuk pengarang + kausalitas. Jawaban benar SELALU berjejak di teks; jawaban salah biasanya memperkenalkan hal baru atau melompati rantai sebab-akibat.',
    items: [
      'Cari petunjuknya: foreshadowing, dialog, deskripsi suasana.',
      'Tarik garis sebab-akibat: bila A terjadi, B menyusul.',
      'Eliminasi opsi tanpa jejak teks — seindah apa pun kalimatnya.',
    ],
  },
  { jenis: 'callout', tipe: 'peringatan', judul: 'Jebakan ujian', teks: 'Opsi yang paling positif/heroik belum tentu benar. Soal #9 dan #14 di bank ini membuktikan: jawaban mengikuti sifat tokoh dan situasi yang SUDAH dibangun teks, bukan harapan kita untuk tokohnya.' },
  {
    jenis: 'zona', items: [
      { soal: 'Langkah pertama memprediksi peristiwa yang mungkin terjadi dalam cerpen adalah ...', opsi: ['menganalisis struktur cerita', 'menebak akhir cerita dari judul', 'menghitung jumlah tokoh', 'membaca kalimat terakhir lebih dulu', 'menghafal nama pengarang'], jawaban: 0, pembahasan: 'Jalur konsep: langkah sistematis dimulai dari analisis struktur (orientasi–komplikasi–resolusi) agar tahu posisi cerita. Jalur Cara Gemilang: CG-RAMAL — struktur dulu, baru petunjuk.' },
      { soal: 'Bacalah kutipan berikut! Sebelum berangkat, ibu menyelipkan payung kecil ke dalam tas Rara. "Langitnya mendung sekali," gumam ibu. Rara hanya mengangguk sambil lalu. Peristiwa yang mungkin terjadi kemudian adalah ...', opsi: ['Rara kehujanan di jalan pulang', 'Ibu membeli payung baru', 'Langit cerah sepanjang hari', 'Rara kehilangan payung di sekolah', 'Ibu tidak jadi pergi'], jawaban: 0, pembahasan: 'Jalur konsep: pengarang menanam pertanda (payung + langit mendung) — pertanda itu "dipakai" kemudian: hujan turun saat Rara di jalan. Jalur Cara Gemilang: foreshadowing = janji pengarang; cari opsi yang menagih janji itu.' },
      { soal: 'Bacalah kutipan berikut! Damar sudah dua kali gagal seleksi. Kata pelatihnya, "Sekali lagi, itu pun terakhir." Malam itu Damar berlatih sampai larut, mengabaikan rasa sakit di lutut kirinya yang mulai bengkak. Peristiwa yang paling mungkin terjadi pada Damar adalah ...', opsi: ['Damar langsung lolos seleksi karena kerja kerasnya', 'Cedera lutut Damar memburuk dan mengancam kesempatan terakhirnya', 'Pelatih menambah porsi latihan Damar', 'Damar mengundurkan diri sebelum seleksi dimulai', 'Lutut Damar sembuh karena terbiasa berlatih'], jawaban: 1, pembahasan: 'Jalur konsep: petunjuk yang ditanam = lutut bengkak yang DIABAIKAN + latihan berlebihan; rantai sebab-akibat paling logis: cedera memburuk di momen krusial. Jalur Cara Gemilang: petunjuk fisik yang diabaikan tokoh = bom waktu cerita.' },
    ],
  },

  // ===== SUBBAB C: MAKNA KATA — JENIS MAKNA (4.2A) =====
  { jenis: 'judul', teks: 'Makna Kata: Jenis Makna' },
  { jenis: 'kilat', teks: 'Empat jenis makna wajib dikenali: leksikal (kamus), gramatikal (hasil proses tata bahasa), denotasi (makna sebenarnya), dan konotasi (makna kiasan berperasaan). Soal teks sastra paling sering menguji denotasi vs konotasi.' },
  { jenis: 'paragraf', teks: 'Bayangkan makna kata seperti lapisan pakaian. Lapisan paling dalam adalah makna kamus yang telanjang dan objektif. Lapisan luar adalah konteks dan rasa — kata yang sama bisa "berdandan" berbeda di tiap kalimat.' },
  {
    jenis: 'tabelinfo', judul: '4 Jenis Makna Kata',
    kolom: ['Jenis', 'Pengertian', 'Contoh'],
    rows: [
      { k: 'Leksikal', v: 'Makna dasar kata sesuai kamus (KBBI), lepas dari konteks.', w: '"Kambing" = hewan ternak berkaki empat yang mengembik.' },
      { k: 'Gramatikal', v: 'Makna yang timbul akibat proses gramatikal: pengimbuhan, pengulangan, pemajemukan.', w: 'mem- + batu = "membatu" (menjadi diam kaku); "rumah-rumahan" (menyerupai rumah).' },
      { k: 'Denotasi', v: 'Makna sebenarnya/lugas; menunjuk objek nyata tanpa kiasan.', w: '"Meja" = perabot berlapis datar berkaki.' },
      { k: 'Konotasi', v: 'Makna kiasan; mengandung nilai rasa/nuansa tambahan di balik makna lugas.', w: '"Meja hijau" = pengadilan; "bunga desa" = gadis tercantik di desa.' },
    ],
  },
  { jenis: 'contoh', teks: 'Menentukan denotasi/konotasi pada soal teks (pola soal asli #13). Soal menanyakan makna kata dasar "sulap" pada kata "pesulap" dalam cerpen kurir. Langkah 1: temukan kalimat konteksnya — "Acara itu memperlihatkan seorang pesulap ... memainkan trik kecepatan tangannya." Langkah 2: tes makna sebenarnya — sulap = pertunjukan hiburan dengan trik untuk mengelabui mata; persis dipakai harfiah di teks, bukan sebagai kiasan. Langkah 3: simpulkan bermakna denotasi (jawaban B soal asli #13).' },
  {
    jenis: 'flashcard', judul: '🃏 Flashcard: 4 jenis makna',
    items: [
      { depan: 'Makna leksikal', belakang: 'Makna kamus (KBBI), lepas dari konteks.' },
      { depan: 'Makna gramatikal', belakang: 'Makna hasil proses imbuhan/ulangan/pemajemukan.' },
      { depan: 'Denotasi', belakang: 'Makna sebenarnya, lugas, objektif.' },
      { depan: 'Konotasi', belakang: 'Makna kiasan, mengandung nilai rasa.' },
    ],
  },
  {
    jenis: 'benarSalah', judul: '⚖️ Cek pemahaman: jenis makna',
    keterangan: 'Gemilang Drill — waspadai pasangan pernyataan menjebak.',
    items: [
      { teks: '"Meja hijau" dalam arti pengadilan bermakna denotasi.', jawaban: false, penjelasan: 'Itu konotasi — makna kiasan; makna denotatif "meja hijau" hanyalah meja berwarna hijau.' },
      { teks: 'Makna leksikal dapat dicari langsung di KBBI.', jawaban: true, penjelasan: 'Leksikal = makna kamus, dasar, lepas konteks.' },
      { teks: 'Pengimbuhan dapat melahirkan makna gramatikal, misalnya "memutih" berarti menjadi putih.', jawaban: true, penjelasan: 'Proses gramatikal (imbuhan, ulangan, majemuk) melahirkan makna baru.' },
      { teks: 'Konotasi selalu bernuansa negatif.', jawaban: false, penjelasan: 'Konotasi bisa positif ("bunga bangsa" = pahlawan) maupun negatif ("tikus kantor" = koruptor).' },
    ],
  },
  {
    jenis: 'caraGemilang', judul: '👑 CG-MAKNA: Kamus–Proses–Nyata–Rasa',
    teks: 'LEKsikal = Kamus; GRAmatikal = Proses (imbuhan-ulangan-majemuk); DENotasi = Nyata/lugas; KONotasi = kiasan berRasa.',
    items: [
      'Tes tunjuk: bisa menunjuk benda/peristiwa nyata sesuai kalimat? → denotasi.',
      'Ada warna rasa (sindiran, pujian, penghalusan)? → konotasi.',
      'Maknanya berubah karena imbuhan/ulangan/pemajemukan? → gramatikal.',
    ],
  },
  { jenis: 'callout', tipe: 'peringatan', judul: 'Jebakan ujian', teks: 'Selalu uji makna dari kalimat yang DITANYAKAN, bukan dari ingatan umum: kata yang sama bisa denotatif di satu kalimat ("Ibu menyiram bunga") dan konotatif di kalimat lain ("Dia bunga desa"). Jangan pula tertukar: denotasi-konotasi itu soal lugas/kias, leksikal-gramatikal itu soal asal-usul makna.' },
  {
    jenis: 'zona', items: [
      { soal: 'Makna kata yang tercantum dalam kamus (KBBI) dan lepas dari konteks disebut makna ...', opsi: ['gramatikal', 'leksikal', 'konotasi', 'denotasi', 'kontekstual'], jawaban: 1, pembahasan: 'Jalur konsep: leksikal berasal dari kata leksikon = kamus/perbendaharaan kata. Jalur Cara Gemilang: CG-MAKNA — LEK = Kamus.' },
      { soal: '"Tangan kanan kepala desa itu mengundurkan diri kemarin." Frasa "tangan kanan" dalam kalimat tersebut bermakna ...', opsi: ['denotasi, karena menunjuk anggota tubuh', 'konotasi, yaitu orang kepercayaan', 'leksikal, sesuai arti di KBBI', 'gramatikal, hasil pengimbuhan', 'lokasi, menunjukkan posisi duduk'], jawaban: 1, pembahasan: 'Jalur konsep: "tangan kanan" di sini bukan anggota tubuh, melainkan kiasan untuk orang kepercayaan — makna kiasan berperasaan = konotasi. Jalur Cara Gemilang: tes tunjuk gagal (yang mundur bukan tangan sungguhan) → konotasi.' },
      { soal: '"Sejak kepala desa kabur, warga seperti ayam kehilangan induk." Makna konotatif ungkapan "ayam kehilangan induk" adalah ...', opsi: ['warga yang beternak ayam dan merugi', 'kerumunan yang ribut dan saling bertengkar', 'kelompok yang tercerai-berai dan kehilangan arah tanpa pemimpin', 'warga yang mencari-cari kepala desa ke hutan', 'masyarakat yang kembali ke cara hidup tradisional'], jawaban: 2, pembahasan: 'Jalur konsep: ayam tanpa induk tercerai-berai tanpa arah — kiasan untuk warga yang kehilangan pemimpin sehingga kacau dan tak terarah. Jalur Cara Gemilang: konotasi = petakan sifat kiasannya (induk = pemimpin), pilih opsi yang memuat inti kiasan itu.' },
    ],
  },

  // ===== SUBBAB D: MAKNA KATA — RELASI MAKNA (4.2B) =====
  { jenis: 'judul', teks: 'Makna Kata: Relasi Makna' },
  { jenis: 'kilat', teks: 'Kata-kata saling berelasi makna: sinonim (sama/mirip), antonim (berlawanan), pasangan kata khusus–kata umum, dan kata teknis (istilah bidang). Masing-masing punya pola soal dan jebakannya sendiri di TKA.' },
  {
    jenis: 'poin', judul: 'Sinonim: dua jenis (dari bank soal)', items: [
      'Sinonim persis/lengkap — saling menggantikan sepenuhnya. Contoh: absurd = janggal.',
      'Sinonim mirip — maknanya berdekatan tetapi TIDAK selalu saling menggantikan. Contoh: besar = makro = kolosal = raya = agung = akbar (kita menyebut "Masjid Agung", bukan "Masjid Besar"; "pertunjukan kolosal", bukan "pertunjukan raya").',
    ],
  },
  {
    jenis: 'poin', judul: 'Antonim, Kata Khusus–Umum, dan Kata Teknis', items: [
      'Antonim — kata bermakna berlawanan; dipakai menunjukkan perbedaan kontras. Contoh: besar >< kecil; prominen >< biasa.',
      'Kata khusus — merujuk objek yang lebih spesifik, terbatas, dan terdefinisi jelas. Contoh: apel, pisang, anggur.',
      'Kata umum — cakupan luas, tidak merujuk satu jenis tertentu. Contoh: buah (lebih umum dari pisang).',
      'Kata teknis — arti khusus bidang ilmu/teknologi/profesi tertentu; hanya dipahami penguasa bidangnya. Contoh: algoritma (komputasi), deflasi (ekonomi), litigasi (hukum).',
    ],
  },
  {
    jenis: 'jodohMini', judul: '🔗 Jodohkan: relasi makna dan contohnya',
    keterangan: 'Semua contoh diambil dari bank soal bab ini.',
    items: [
      { kiri: 'Sinonim persis (saling menggantikan)', kanan: 'absurd = janggal' },
      { kiri: 'Sinonim mirip (tidak saling menggantikan)', kanan: 'besar ~ kolosal ~ agung' },
      { kiri: 'Antonim (berlawanan makna)', kanan: 'prominen >< biasa' },
      { kiri: 'Kata khusus (spesifik)', kanan: 'apel, pisang, anggur' },
      { kiri: 'Kata umum (cakupan luas)', kanan: 'buah' },
      { kiri: 'Kata teknis (istilah bidang)', kanan: 'algoritma, deflasi, litigasi' },
    ],
  },
  {
    jenis: 'isianRumpang', judul: '✍️ Isian rumpang: relasi makna',
    keterangan: 'Ketik jawabanmu (huruf besar/kecil tidak dinilai).',
    items: [
      { teks: 'Antonim dari kata "prominen" adalah ...', jawaban: ['biasa'], hint: 'Lawan dari menonjol/istimewa.', penjelasan: 'Dari contoh bank soal: prominen >< biasa.' },
      { teks: 'Kata "absurd" dan "janggal" membentuk relasi sinonim jenis ...', jawaban: ['persis', 'lengkap', 'sinonim persis', 'sinonim lengkap'], hint: 'Keduanya bisa saling menggantikan sepenuhnya.', penjelasan: 'Sinonim persis/lengkap = saling menggantikan.' },
      { teks: 'Kata "deflasi" adalah contoh kata teknis di bidang ...', jawaban: ['ekonomi'], hint: 'Berkaitan dengan harga dan uang.', penjelasan: 'Deflasi = penurunan harga umum; istilah ekonomi.' },
      { teks: 'Kata "buah" lebih ... daripada kata "pisang".', jawaban: ['umum'], hint: 'Cakupannya lebih luas.', penjelasan: 'Pasangan khusus–umum: pisang (khusus) adalah jenis buah (umum).' },
    ],
  },
  {
    jenis: 'caraGemilang', judul: '👑 CG-RELASI: SI–LA–KHUS–TEK',
    teks: 'SInonim = mirip; LAwan (antonim) = berlawanan; KHUSus ⊂ umum; TEKnis = istilah bidang.',
    items: [
      'Tes hierarki: bisa bilang "X adalah jenis Y"? → X kata khusus, Y kata umum.',
      'Tes ganti: ditukar tetap luwes? → sinonim persis; terasa janggal? → sinonim mirip.',
      'Tes orang awam: hanya paham ahlinya? → kata teknis.',
    ],
  },
  { jenis: 'callout', tipe: 'peringatan', judul: 'Jebakan ujian', teks: 'Arah khusus–umum sering dibalik di opsi: "apel adalah kata umum dari buah" itu SALAH — apel justru kata khusus. Untuk sinonim mirip, uji dengan frasa nyata ("Hari Raya" bukan "Hari Ageng") sebelum memutuskan bisa saling menggantikan.' },
  {
    jenis: 'zona', items: [
      { soal: 'Kata-kata yang memiliki makna sama atau hampir sama disebut ...', opsi: ['antonim', 'sinonim', 'homofon', 'kata teknis', 'hiponim'], jawaban: 1, pembahasan: 'Jalur konsep: sinonim = relasi kesamaan makna (contoh: absurd = janggal). Jalur Cara Gemilang: CG-RELASI — SI = Sinonim = mirip.' },
      { soal: 'Pasangan kata yang berelasi ANTONIM adalah ...', opsi: ['besar – agung', 'rajin – malas', 'apel – buah', 'indah – cantik', 'meja – kursi'], jawaban: 1, pembahasan: 'Jalur konsep: antonim = berlawanan makna; rajin >< malas. Opsi A/D sinonim mirip, C pasangan khusus–umum, E sekadar dua benda. Jalur Cara Gemilang: LA = lawan; cari pasangan yang "tabrakan arah".' },
      { soal: '"Pengacara terdakwa menegaskan bahwa sengketa ini akan dilanjutkan ke tahap litigasi." Kata "litigasi" merupakan kata teknis bidang hukum yang bermakna ...', opsi: ['penyelesaian sengketa di luar pengadilan', 'proses penyelesaian sengketa melalui pengadilan', 'kesepakatan tertulis antara dua pihak', 'musyawarah yang dipimpin tetua adat', 'tawar-menawar ganti rugi antarpihak'], jawaban: 1, pembahasan: 'Jalur konsep: litigasi = jalur penyelesaian perkara melalui pengadilan; lawannya "non-litigasi" (di luar pengadilan: mediasi, musyawarah). Jalur Cara Gemilang: TEKNIS = istilah bidang; kalau bingung, ingat pola soal: opsi yang menyebut "pengadilan" untuk istilah hukum biasanya kuncinya.' },
    ],
  },
  { jenis: 'callout', tipe: 'info', judul: 'Selesai — siap tempur 25 soal', teks: 'Materi Bab 4 Sastra tuntas. Sebelum masuk Uji Pemahaman (25 soal resmi bank + 6 cerpen utuh), pastikan kamu bisa: (1) menyebut TAGALPS tanpa melihat, (2) membedakan denotasi–konotasi dengan tes tunjuk, dan (3) menerapkan CG-RAMAL Petunjuk–Sebab–Pola. Selamat berlatih!' },
];

// ---------- 6. RAKIT 25 SOAL VERBATIM ----------
const SUMBER_DASAR = 'Bank owner: Sukses Tes Kemampuan Akademik SMA/Saintek, Bab 4 Sastra h.64-70; kunci & pembahasan h.39-42 (soal asli #{no})';
const soalGrup = (no) => {
  const i = grupStimulus[no];
  if (i === undefined) throw new Error(`soal ${no} tanpa grup stimulus`);
  return `Bacalah kutipan cerpen berikut dengan saksama!\n\n${teksStimulus(i)}\n\n`;
};

const ujiPemahaman = E.soal.map((s) => {
  const no = s.no;
  const dasar = { sumber: SUMBER_DASAR.replace('{no}', String(no)) };
  const teksSoal = perbaiki(s.teks).replace(/\s+\(/, ' (');
  if (s.tipe === 'pg') {
    const jawaban = kunciPg(no);
    if (jawaban < 0 || jawaban >= s.opsi.length) throw new Error(`kunci pg ${no} di luar opsi`);
    return {
      soal: soalGrup(no) + teksSoal, tipe: 'pg',
      opsi: s.opsi.map(perbaiki), jawaban,
      pembahasan: buatPembahasan(no), ...dasar,
    };
  }
  if (s.tipe === 'pgMulti') {
    const jawaban = kunciMulti(no);
    if (jawaban.some((j) => j < 0 || j >= s.opsi.length)) throw new Error(`kunci pgMulti ${no} di luar opsi`);
    return {
      soal: soalGrup(no) + teksSoal,
      tipe: 'pgMulti', opsi: s.opsi.map(perbaiki), jawaban,
      pembahasan: buatPembahasan(no), ...dasar,
    };
  }
  // tabel (Benar/Salah atau Sesuai/Tidak Sesuai)
  const kolom = s.kolom.map(perbaiki);
  const jawaban = kunciTabel(no, kolom);
  if (jawaban.length !== s.baris.length) throw new Error(`kunci tabel ${no} tak sepanjang baris`);
  const teksBersih = teksSoal.replace(/\s*\(Pilihlah kolom[^)]*\)\s*/, '');
  return {
    soal: soalGrup(no) + teksBersih + `\n(Tentukan ${kolom[0]}/${kolom[1]} untuk setiap pernyataan berikut!)`,
    tipe: 'tabel', kolom, baris: s.baris.map(perbaiki), jawaban,
    pembahasan: buatPembahasan(no, kolom, jawaban), ...dasar,
  };
});

// bersihkan duplikasi petunjuk pgMulti (teks hasil ekstrak sudah memuatnya)
ujiPemahaman.forEach((q) => {
  if (q.tipe === 'pgMulti') {
    q.soal = q.soal
      .replace(/Pilihlah jawaban yang benar! Jawaban benar lebih dari satu\.\s*$/, '')
      .trim() + '\n\nPilihlah jawaban yang benar! Jawaban benar lebih dari satu.';
  }
});

// ---------- 7. METADATA MATERI & BAB ----------
const draft = {
  materi: {
    judul: 'Bahasa Indonesia Wajib SMA — Persiapan TKA 2026 (Edisi Cara Gemilang)',
    mapel: 'Bahasa Indonesia',
    kelas: '12',
    jenjang: 'sma',
    program: 'semua',
    premium: false,
    warna: '#E11D48',
    emoji: '🎭',
    deskripsi: 'Materi wajib kelas 12 — Bab 4 Sastra: unsur intrinsik-ekstrinsik cerpen (TAGALPS), memprediksi peristiwa, jenis & relasi makna kata. Dilengkapi widget MATERI INTERAKTIF (flashcard, jodohkan, susun urutan, benar/salah, isian rumpang) dan 25 soal resmi bank owner dengan 6 cerpen utuh + pembahasan dua jalur.',
    urutan: 4,
    status: 'draft',
    daftarPustaka: [
      'Bank owner: salinan digital "sastra.html" dari berkas pindai buku Sukses Tes Kemampuan Akademik SMA – Saintek — Bab 4 Sastra h.64-70 (materi & soal 1-25) dan Bab 5 Pembahasan h.39-42 (kunci & pembahasan); kunci mengikuti cetakan asli.',
      'Sumber cerpen per buku: "Cangkir Kopi" (radarbromo.jawapos.com); ibocahkampus.com; "Kurir" Alturridha (bacapetra.co); "Tanda Baca" karya Luluk Kamilia (ldntimes.com); "Pohon Hayat" (cerpenkompas.wordpress.com). Cerpen bank & kurir tanpa baris sumber sesuai cetakan.',
      'Kartu definisi jenis makna, detektif latar/sudut pandang, dan mini kamus = bagan penunjang tim Gemilang (dikembangkan dari konsep baku semantik bahasa Indonesia berbasis KBBI).',
      'Soal Zona Berlatih & widget interaktif = Gemilang Drill (dibuat tim Gemilang mengikuti pola soal TKA bank owner).',
      'Skema widget interaktif: docs/MATERI-INTERAKTIF.md (turn 87).',
    ],
  },
  bab: [
    {
      judul: 'Bab 4 — Sastra: Cerpen, Peristiwa yang Mungkin Terjadi, dan Makna Kata (Edisi Cara Gemilang)',
      ringkasan: 'Unsur intrinsik (TAGALPS) & ekstrinsik cerpen, langkah sistematis memprediksi peristiwa, 4 jenis makna kata, dan relasi makna — dengan flashcard, jodohkan, susun urutan, benar/salah, isian rumpang, plus 25 soal resmi bank (6 format: PG, PGK-MCMA, PGK kategori Benar/Salah & Sesuai/Tidak Sesuai) berstimulus cerpen utuh dan pembahasan dua jalur.',
      estimasiMenit: 90,
      urutan: 4,
      tipe: 'teks',
      sections,
      ujiPemahaman,
    },
  ],
};

// ---------- 8. GUARD KUALITAS ----------
const json = JSON.stringify(draft, null, 2);
// 8a. aksara asing (aturan emas #1)
const cjk = json.match(/[\u3400-\u4E00\u3040-\u30FF\uAC00-\uD7AF]/gu);
if (cjk) { console.error('AKSARA ASING DITEMUKAN:', [...new Set(cjk)].join(' ')); process.exit(1); }
// 8b. paragraf materi <= 3 kalimat (aturan emas #2) — hanya jenis paragraf
for (const sec of sections) {
  if (sec.jenis === 'paragraf') {
    const n = (sec.teks.match(/(?<=[.!?])\s+[A-Z"“]/g) || []).length + 1;
    if (n > 3) { console.error(`PARAGRAF >3 KALIMAT (${n}):`, sec.teks.slice(0, 60)); process.exit(1); }
  }
}
// 8c. setiap soal punya stimulus, kunci valid, pembahasan dua jalur
ujiPemahaman.forEach((q, i) => {
  if (!q.soal.includes('Bacalah kutipan cerpen')) { console.error(`soal ${i + 1} tanpa stimulus`); process.exit(1); }
  if (!q.pembahasan.includes('Jalur konsep:') || !q.pembahasan.includes('Jalur Cara Gemilang:')) { console.error(`soal ${i + 1} pembahasan tidak dua jalur`); process.exit(1); }
  if (q.tipe === 'pg' && (q.jawaban < 0 || q.jawaban >= q.opsi.length)) { console.error(`soal ${i + 1} kunci pg di luar opsi`); process.exit(1); }
});
// 8d. nested array ditolak Firestore
function adaNestedArray(v) {
  if (Array.isArray(v)) return v.some((x) => Array.isArray(x) || adaNestedArray(x));
  if (v && typeof v === 'object') return Object.values(v).some(adaNestedArray);
  return false;
}
if (adaNestedArray(draft.bab)) { console.error('NESTED ARRAY terdeteksi — Firestore akan menolak!'); process.exit(1); }

// ---------- 9. TULIS FILE ----------
const outDraft = join(ROOT, 'docs/drafts/draft-bahasa-indonesia-k12-v1-bab4.json');
const outImpor = join(ROOT, 'IMPOR-BAHASA-INDONESIA-BAB4-TERBARU.json');
writeFileSync(outDraft, json + '\n');
writeFileSync(outImpor, json + '\n');
console.log('SELESAI.');
console.log('  sections:', sections.length, '| soal:', ujiPemahaman.length,
  '| pg:', ujiPemahaman.filter((q) => q.tipe === 'pg').length,
  '| pgMulti:', ujiPemahaman.filter((q) => q.tipe === 'pgMulti').length,
  '| tabel:', ujiPemahaman.filter((q) => q.tipe === 'tabel').length);
console.log('  ukuran JSON:', (json.length / 1024).toFixed(1), 'KB (limit dokumen Firestore 1 MB)');
console.log('  ->', outDraft.replace(ROOT + '/', ''));
console.log('  ->', outImpor.replace(ROOT + '/', ''));
