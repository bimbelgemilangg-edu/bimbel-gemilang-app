// src/utils/bersihkanOcr.js
// ============================================================
// Pembersih sisa OCR untuk jalur impor HTML Master / scan PDF.
//
// 🔥 KENAPA ADA (kasus nyata 2026-10-10): owner mengimpor 50 soal UTBK
// TPS-PU hasil scan buku SNMPTN/SBMPTN/UTBK. Preview impor menampilkan:
//   - penanda halaman  "=== PAGE 3 COL 2 ==="
//   - nomor baris yatim  "9."  "10."  "14,"  "9 9"
//   - rácak kolom        "m5 Om>", "AAL-SOAL", "MA SST feilaja Glsd ..."
//   - kata terpotong     "berbunc", "sehinc", "Jawaba'"  (potongan kolom OCR)
//   - kebocoran lintas kolom: teks bacaan soal lain masuk ke OPSI soal 40
//
// PRINSIP: yang dibuang otomatis HANYA sampah STRUKTURAL yang tidak mungkin
// bermakna (penanda halaman, nomor yatim, baris simbol). Yang MERAGUKAN
// (kata terpotong, opsi terlalu panjang, baris acak) TIDAK dibuang dan TIDAK
// ditebak perbaikannya -- hanya DICATAT sebagai catatan kualitas supaya
// admin melihatnya di preview dan memutuskan sendiri. Memperbaiki otomatis
// teks terpotong = mengarang isi soal; itu melanggar kontrak bank soal.
// ============================================================

const RE_PENANDA_HALAMAN = /^\s*={2,}\s*page\s*\d+.*$/i;
const RE_NOMOR_YATIM = /^\s*\d{1,3}\s*[.,)]?\s*$/;
const RE_NOMOR_GANDA = /^\s*\d{1,2}(\s+\d{1,2})+\s*$/;
const RE_SIMBOL_SAHAJA = /^\s*[^a-zA-Z0-9]{1,8}\s*$/;
const RE_JUDUL_KOLOM_RUSAK = /^\s*a{1,2}al-?soal\s*$/i;
// Slogan/watermark buku yang ikut ter-OCR sebagai baris teks ("BELAJAR
// MINIMAL, HASIL MAKSIMAL" dan varian rusaknya: HBSIL, MBKSIMAL, WINIMAL).
// Baris sepanjang ini yang ISINYA hanya slogan tidak mungkin bagian kalimat.
const RE_SLOGAN_BUKU = /^\s*(belajar|has[ij]l|hbsil|mbksimal|winimal)\s*(minimal|maksimal|minima[,.]?|maksima[,.]?|mbksimal|hbsil)?[,.]?\s*$/i;

const PUNCAKUS_AKHIR = /[.!?:;…)\]"']$/;

function barisGarbar(baris) {
  const t = String(baris ?? '').trim();
  const huruf = t.replace(/[^a-zA-Z]/g, '');
  if (huruf.length < 3) return false;
  const vokal = (huruf.match(/[aeiouAEIOU]/g) || []).length;
  const rasioVokal = vokal / huruf.length;

  // 🔥 ATURAN 1 -- baris PENDEK yang sebagian isinya bukan huruf.
  // Rácak kolom OCR hampir selalu berbentuk begini: "m5 Om>", "xP ~ xQ",
  // "= Jawaban f", "9 9". Baris pendek yang SELURUHNYA huruf adalah frasa sah
  // ("yang benar?", "kencang.") dan tidak boleh disentuh.
  if (t.length <= 24) {
    const bukanHuruf = t.replace(/[a-zA-Z\s]/g, '').length;
    if (bukanHuruf / t.length >= 0.25 && rasioVokal < 0.34) return true;
    // Potongan kolom super pendek ("m sil", "m5 Om>") tidak punya cukup huruf
    // untuk dinilai rasio vokalnya secara adil; frasa Indonesia sungguhan
    // sepanjang <= 4 huruf hampir selalu punya >= 2 vokal ("pada", "bila",
    // "kalian", "ion", "pH" aman karena panjang/rasionya beda).
    if (huruf.length <= 4 && rasioVokal < 0.34) return true;
  }

  // 🔥 ATURAN 2 -- rasio vokal sangat rendah di baris berapa pun panjangnya.
  // Ambang lama 0.34 MEMAKAN TEKS ASLI soal (insiden nyata 2026-10-10, berkas
  // bab 1 UTBK TPS-PU):
  //   - soal 48 kehilangan baris "yang PALING TEPAT?"  (4 vokal / 15 huruf)
  //   - soal 32 kehilangan baris "yang benar?"          (3 / 11)
  //   - soal 35 kehilangan baris "kencang."             (3 / 8)
  // Soal tanpa kalimat pertanyaan jauh lebih mahal daripada sampah OCR yang
  // lolos. Bahasa Indonesia tidak mungkin menghasilkan baris dengan rasio
  // vokal < 0.20, sedangkan rácak kolom ("m sil", "AAL-SOAL", "xP ~ xQ")
  // semuanya di bawah itu. Yang dibuang tetap DICATAT, tidak pernah diam-diam.
  return rasioVokal < 0.2;
}

function barisTerpotong(baris) {
  const t = baris.trim();
  if (t.length < 20) return false;
  return !PUNCAKUS_AKHIR.test(t) && /[a-zA-Z]$/.test(t);
}

/**
 * Bersihkan satu bidang teks (teks soal / opsi / bacaan / pembahasan).
 * @param {string} teks
 * @param {{jagaBaris?: boolean}} [opsi] `jagaBaris: true` melewatkan reflow
 *   (penyambungan baris yang belum berakhir tanda baca). Dipakai untuk
 *   PEMBAHASAN: tata letak barisnya adalah bagian dari isi buku — baris
 *   "Semua A, B" / "Kesimpulan : ..." / "Jawaban C" harus tetap berdiri
 *   sendiri supaya bisa dirender bergaya buku (utils/strukturPembahasan.js).
 *   Bila disambung, struktur itu hancur jadi satu paragraf panjang
 *   (insiden 2026-10-10: owner membandingkan preview dengan PDF buku).
 * @returns {{teks: string, catatan: string[]}}
 */
export function bersihkanOcrTeks(teks, opsi = {}) {
  const catatan = [];
  const asli = String(teks ?? '');
  if (!asli.trim()) return { teks: asli, catatan };
  const jagaBaris = Boolean(opsi.jagaBaris);

  const baris = asli.split(/\n/);
  const sisa = [];
  let buangStruktural = 0;
  let potong = 0;

  for (const b of baris) {
    // Baris kode sumber ([SNMPTN 2009/TPA/392/22] dst.) KERAS terhadap
    // semua aturan buang: rasio vokalnya rendah (banyak konsonan kapital),
    // sehingga pernah tertelan aturan baris-garbar -- insiden 2026-10-10
    // yang membuat preview kehilangan kepala soal. Kode sumber adalah
    // sidik jari soal; kehilangannya lebih mahal daripada salah simpan.
    if (RE_KODE_SUMBER.test(b) && b.trim().length < 60) {
      sisa.push(b);
      continue;
    }
    if (
      RE_PENANDA_HALAMAN.test(b)
      || RE_NOMOR_YATIM.test(b)
      || RE_NOMOR_GANDA.test(b)
      || RE_SIMBOL_SAHAJA.test(b)
      || RE_JUDUL_KOLOM_RUSAK.test(b)
      || RE_SLOGAN_BUKU.test(b)
    ) {
      buangStruktural += 1;
      continue;
    }
    if (barisGarbar(b)) {
      // Baris acak pendek seperti "m5 Om>" hampir pasti rácak OCR, tapi
      // tetap dicatat, bukan dibuang diam-diam.
      catatan.push(`baris sisa OCR dibuang: "${b.trim()}"`);
      continue;
    }
    if (barisTerpotong(b)) potong += 1;
    sisa.push(b);
  }

  if (buangStruktural > 0) {
    catatan.push(`${buangStruktural} baris struktural OCR dibuang (penanda halaman/nomor yatim/simbol)`);
  }
  if (potong >= 2) {
    catatan.push(`${potong} baris diduga terpotong potongan kolom OCR (kata putus di akhir baris) -- PERIKSA MANUAL, tidak ditebak`);
  }

  // Reflow AMAN: baris yang berakhir tanpa tanda baca akhir disambung ke
  // baris berikutnya (itu potongan pergantian baris/kolom, bukan kalimat
  // baru). Baris yang berakhir tanda baca dipertahankan sebagai barisnya
  // sendiri -- premis silogisme harus tetap terpisah. Paragraf (\n\n)
  // tidak pernah disambung. Teks yang terpotong OCR tetap rusak sesudah
  // disambung -- kerusakannya sudah dicatat di atas, penyambungan tidak
  // menyembunyikannya dan tidak memperbaikinya dengan mengarang.
  // DILEWATI untuk pembahasan (jagaBaris) -- lihat catatan di atas fungsi.
  if (jagaBaris) {
    return { teks: sisa.join('\n').replace(/\n{3,}/g, '\n\n').trim(), catatan };
  }

  const gabung = [];
  for (const baris of sisa) {
    if (baris.trim() === '') { gabung.push(''); continue; }
    const prev = gabung[gabung.length - 1];
    if (prev !== undefined && prev !== '' && !PUNCAKUS_AKHIR.test(prev.trim())) {
      gabung[gabung.length - 1] = `${prev.trim()} ${baris.trim()}`;
    } else {
      gabung.push(baris);
    }
  }

  return { teks: gabung.join('\n').replace(/\n{3,}/g, '\n\n').trim(), catatan };
}

const normLong = (t) => String(t ?? '').toLowerCase()
  .replace(/[^a-z0-9\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

/**
 * Buang baris/baris-gabung di dalam teks soal yang ternyata SALINAN dari
 * opsi jawaban (cacat khas OCR dua kolom: blok opsi terpindah juga ke dalam
 * teks soal). Pencocokan memakai teks normalisasi dan penghapusan substring,
 * supaya opsi yang terpotong pergantian baris di dalam teks tetap tertangkap.
 *
 * @param {string} teksSoal
 * @param {string[]} daftarOpsi teks opsi apa adanya
 * @returns {{teks: string, catatan: string[]}}
 */
export function buangDuplikatOpsiDariTeks(teksSoal, daftarOpsi = []) {
  let teks = String(teksSoal ?? '');
  const catatan = [];
  // 🔥 PAGAR KESELAMATAN (insiden nyata 2026-10-10, bab 1 soal 32): aturan
  // lama berbunyi "buang baris yang normalisasinya MENGANDUNG opsi", tanpa
  // batas. Begitu teks soal sudah disambung jadi SATU baris panjang (reflow),
  // satu baris itu "mengandung" opsi E ("Kakek membaca koran di ruang tamu.")
  // karena kalimat pengantar soal memang mengutip frasa tersebut -> SELURUH
  // isi soal terhapus dan preview menampilkan soal kosong. Dua pagar kini:
  //   1. baris panjang cuma boleh dibuang bila isinya HAMPIR HANYA opsi itu
  //      (sisa kata di luar teks opsi <= 6 kata), dan
  //   2. satu sapuan tidak boleh membuang lebih dari 60% baris -- kalau
  //      iya, detektornya yang dicurigai, bukan teksnya: pembuangan dibatalkan
  //      dan DICATAT supaya admin memeriksa manual.
  const hampirHanyaOpsi = (nb, o) => {
    const sisa = nb.split(o).join(' ').trim();
    return sisa.split(/\s+/).filter(Boolean).length <= 6;
  };
  const jumlahBarisAwal = teks.split('\n').filter((b) => b.trim() !== '').length;
  for (const opsi of daftarOpsi) {
    const o = normLong(opsi);
    if (o.length < 20) continue; // opsi terlalu pendek: risiko menghapus kalimat sah
    if (!normLong(teks).includes(o)) continue;
    const baris = teks.split('\n');
    const sisaBaris = [];
    let buang = 0;
    for (const b of baris) {
      const nb = normLong(b);
      const cocok = Boolean(nb) && (
        nb === o
        || (nb.includes(o) && hampirHanyaOpsi(nb, o))
        || (o.includes(nb) && nb.length >= 20 && hampirHanyaOpsi(o, nb))
      );
      if (cocok) { buang += 1; continue; }
      sisaBaris.push(b);
    }
    if (buang > 0) {
      const sisaAda = sisaBaris.some((b) => b.trim() !== '');
      const terlaluBanyak = jumlahBarisAwal > 0 && buang / jumlahBarisAwal > 0.6;
      if (!sisaAda || terlaluBanyak) {
        catatan.push(
          `diduga salinan opsi "${String(opsi).slice(0, 50)}..." di dalam teks soal, tetapi pembuangannya akan mengosongkan/menggerus teks soal (${buang} dari ${jumlahBarisAwal} baris) -- TIDAK dibuang otomatis, PERIKSA MANUAL`,
        );
        continue;
      }
      teks = sisaBaris.join('\n');
      catatan.push(`salinan opsi jawaban dibuang dari teks soal (${buang} baris): "${String(opsi).slice(0, 60)}..."`);
    }
  }
  // Sisa token punctual yatim hasil penghapusan (mis. ". _") dibersihkan.
  // Yang dibuang HANYA token puntual-sisa seperti ". _" hasil penghapusan
    // duplikat. Simbol bermakna (+ = < > / × %) DIPERTAHANKAN -- teks soal
    // matematika penuh simbol dan filter buta akan melukainya.
  teks = teks
    .split('\n')
    .map((b) => b.split(/\s+/).filter((w) => !(/^[._\-–—~•·'`",;:]{1,2}$/.test(w) && w !== '…')).join(' '))
    .filter((b, i, arr) => b.trim() !== '' || (i > 0 && arr[i - 1].trim() !== ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return { teks, catatan };
}

/**
 * Catatan kualitas satu butir soal utuh (dipakai badge preview impor).
 * @param {{teksSoal?: string, opsi?: Array, pembahasan?: string}} q
 * @returns {string[]}
 */
// Sidik jari sumber soal: "SNMPTN 2012/TPA/ 213/24", "UTBK2024/TPS/PU/GEL.2/63",
// dengan atau tanpa kurung siku. Spasi diabaikan karena OCR sering
// menyelipkan/membuang spasi di dalam kode.
const RE_KODE_SUMBER = /(SNMPTN|SBMPTN|UTBK)\s*\d{4}(?:\s*\/\s*[\w.-]+)+/;

function kodeSumber(teks) {
  const m = String(teks || '').match(RE_KODE_SUMBER);
  return m ? m[0].replace(/\s+/g, '').toUpperCase() : null;
}

export function penandaiKualitasOcr({ teksSoal = '', opsi = [], pembahasan = '' } = {}) {
  const catatan = [];
  // Pembahasan tertukar antar-soal (kasus nyata berkas bab 2: pembahasan
  // soal 31 berisi kode soal 33, dst.). Kode sumber di awal pembahasan adalah
  // sidik jari yang murah dan pasti untuk menangkapnya.
  const kodeSoal = kodeSumber(teksSoal);
  const kodeBahasan = kodeSumber(pembahasan);
  if (kodeSoal && kodeBahasan && kodeSoal !== kodeBahasan) {
    catatan.push(`kode sumber di pembahasan (${kodeBahasan}) BERBEDA dari kode di soal (${kodeSoal}) -- pembahasan diduga tertukar dengan soal lain; PERIKSA MANUAL`);
  }
  // Penutup jawaban di pembahasan: di buku sumber SELALU ada baris
  // "Jawaban X" di akhir pembahasan. Bila baris itu hilang (atau putus jadi
  // "Jawaba"), siswa tidak melihat penegasan jawaban dan admin tidak tahu
  // bahwa sumbernya rusak. Dicatat, tidak diperbaiki di sini -- pelengkapannya
  // (dari kunci soal itu sendiri) dilakukan lengkapEkorJawaban().
  const teksBahasan = String(pembahasan ?? '');
  if (teksBahasan.trim() && !/jawab/i.test(teksBahasan.split('\n').slice(-3).join(' '))) {
    catatan.push('pembahasan tidak punya baris penutup "Jawaban: X" -- siswa tidak melihat penegasan jawaban; PERIKSA MANUAL');
  }
  const g = (t, label) => {
    const r = bersihkanOcrTeks(t);
    for (const c of r.catatan) catatan.push(`${label}: ${c}`);
    return r;
  };
  g(teksSoal, 'teks soal');
  g(pembahasan, 'pembahasan');
  (Array.isArray(opsi) ? opsi : []).forEach((o, i) => {
    const teksOpsi = typeof o === 'string' ? o : o?.teks || '';
    if (teksOpsi.length > 400) {
      catatan.push(`opsi ${String.fromCharCode(65 + i)} sangat panjang (${teksOpsi.length} karakter) -- diduga kemasukan teks bagian lain saat OCR; PERIKSA MANUAL`);
    }
    const r = bersihkanOcrTeks(teksOpsi);
    for (const c of r.catatan) catatan.push(`opsi ${String.fromCharCode(65 + i)}: ${c}`);
  });
  return catatan;
}

/**
 * Lengkapi ekor pembahasan yang putus di mesin OCR.
 *
 * 🔥 KENAPA ADA (kasus nyata berkas bab 1 UTBK TPS-PU, 2026-10-10): kolom
 * buku memotong huruf terakhir baris penutup pembahasan, jadi yang masuk ke
 * sistem adalah "Jawaba", "Jawabai", "Jawabat", "Jawabar", "Jawabe",
 * "Jawaban |", "c Jawaban #", "= Jawaban f", "Jawaban (" -- baris yang
 * TIDAK BISA diakui sebagai jawaban (dan memang sengaja tidak diakui:
 * menebak huruf dari "Jawaba" berarti mengklaim A). Akibatnya pembahasan
 * kehilangan penutup "Jawaban: X" yang di buku selalu ada.
 *
 * Fungsi ini TIDAK menebak. Huruf diambil dari `kunciJawaban` soal itu
 * sendiri, dan HANYA bila baris terakhir pembahasan memang fragmen kata
 * "jawab" (huruf-huruf lain di sekitarnya sudah dibersihkan lebih dulu).
 * Hasilnya dicatat, jadi admin tahu penutup itu dilengkapi sistem.
 *
 * @param {string} teks pembahasan yang sudah dibersihkan (baris terjaga)
 * @param {string} kunciJawaban huruf kunci soal, mis. "C"
 * @returns {{teks: string, catatan: string[]}}
 */
export function lengkapEkorJawaban(teks, kunciJawaban) {
  const catatan = [];
  const huruf = String(kunciJawaban ?? '').trim().toUpperCase();
  const asli = String(teks ?? '');
  if (!asli.trim() || !/^[A-E]$/.test(huruf)) return { teks: asli, catatan };

  // Satu baris diakui sebagai EKOR JAWABAN bila isinya cuma kata
  // "jawab"/"jawaban" (boleh dipotong OCR di ujungnya) ditambah sampah
  // simbol di depan/belakang. Contoh nyata berkas owner: "Jawaba'",
  // "Jawabai", "Jawabat", "Jawabar", "Jawabe", "Jawaban |", "Jawaban (",
  // "c Jawaban #", "= Jawaban f", "Jawaban", "Jawaban B", "Jawaban: D".
  // Bila ada KATA lain ("Jawaban yang tepat adalah C") baris itu kalimat
  // biasa dan tidak disentuh.
  const ekorJawaban = (baris) => {
    const t = String(baris ?? '').trim();
    if (!t || t.length > 40) return null;
    const norm = t.replace(/\s+/g, ' ');
    const depan = /^[^A-Za-z]*/.exec(norm)[0];
    // Sampah depan maksimal 4 karakter ("= ", "c ", "_.j "); lebih dari itu
    // berarti baris tersebut kalimat biasa yang kebetulan menyebut "jawab".
    if (depan.length > 4) return null;
    const m = /^jawab(an)?/i.exec(norm.slice(depan.length));
    if (!m) return null;
    let sisa = norm.slice(depan.length + m[0].length);
    let punyaAn = Boolean(m[1]);
    // "Jawaba'" = "Jawaban" yang "n"-nya putus jadi tanda kutip: sisa dimulai
    // huruf 'a'/'n' lalu langsung sampah (bukan kata baru) -> tetap ekor putus.
    if (!punyaAn && /^[an](?![A-Za-z])/i.test(sisa)) {
      punyaAn = true;
      sisa = sisa.slice(1);
    }
    sisa = sisa.replace(/^[^A-Za-z]+/, ''); // buang pemisah (: | . # ( dsb.)
    if (!sisa) return { fragmen: t, ekorHuruf: '' };
    const ekor = /^[A-Za-z]{1,3}(?![A-Za-z])/.exec(sisa);
    if (!ekor) return null;               // ada kata lain -> kalimat biasa
    const belakang = sisa.slice(ekor[0].length).trim();
    if (/[A-Za-z]/.test(belakang)) return null;
    return { fragmen: t, ekorHuruf: ekor[0].toUpperCase() };
  };

  const baris = asli.split('\n');
  // Cari dari belakang (maks. 3 baris terakhir): OCR kadang menyisakan
  // baris kosong/titik/simbol di bawah baris jawaban.
  let idx = -1;
  let ketemu = null;
  for (let i = baris.length - 1; i >= 0 && i >= baris.length - 3; i -= 1) {
    if (!baris[i].trim()) continue;
    const hasil = ekorJawaban(baris[i]);
    if (hasil) { idx = i; ketemu = hasil; }
    break; // baris berisi terakhir sudah diperiksa, apa pun hasilnya
  }
  if (idx === -1) return { teks: asli, catatan };

  // 🔥 ATURAN JUJUR: satu huruf A-E setelah "jawab" bisa berarti DUA hal --
  // jawaban yang tercetak ("Jawaban B") ATAU kata "Jawaban" yang huruf
  // terakhirnya putus di OCR ("Jawaba" = "Jawaban" tanpa n). Keduanya tidak
  // bisa dibedakan dari teks saja, jadi baris seperti itu TIDAK PERNAH
  // ditulis ulang. Yang dilakukan hanya menormalkan bentuknya menjadi
  // "Jawaban: X" BILA hurufnya sama dengan kunci soal ini. Bila hurufnya
  // beda dari kunci, itu dugaan kunci yang tidak cocok: urusan admin, dan
  // tidak boleh ditimpa diam-diam.
  if (/^[A-E]$/.test(ketemu.ekorHuruf)) {
    if (ketemu.ekorHuruf !== huruf) return { teks: asli, catatan };
    if (ketemu.fragmen === `Jawaban: ${huruf}`) return { teks: asli, catatan };
    baris[idx] = `Jawaban: ${huruf}`;
    catatan.push(
      `baris penutup pembahasan ("${ketemu.fragmen}") dinormalkan menjadi "Jawaban: ${huruf}" (hurufnya sama dengan kunci soal ini)`,
    );
    return { teks: baris.join('\n').replace(/\n{3,}/g, '\n\n').trim(), catatan };
  }

  // Ekor yang BUKAN huruf A-E ("Jawaba'", "Jawabat", "Jawabar", "Jawabe",
  // "Jawaban |", "= Jawaban f", "Jawaban") adalah potongan OCR: huruf
  // penutupnya diisi dari kunci soal ini, dan DICATAT.
  baris[idx] = `Jawaban: ${huruf}`;
  catatan.push(
    `baris penutup pembahasan terpotong OCR ("${ketemu.fragmen}") dilengkapi dari kunci jawaban soal ini menjadi "Jawaban: ${huruf}"`,
  );
  return { teks: baris.join('\n').replace(/\n{3,}/g, '\n\n').trim(), catatan };
}

export default { bersihkanOcrTeks, penandaiKualitasOcr, buangDuplikatOpsiDariTeks, lengkapEkorJawaban };
