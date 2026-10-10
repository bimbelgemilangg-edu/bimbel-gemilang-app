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
  const huruf = baris.replace(/[^a-zA-Z]/g, '');
  if (huruf.length < 3) return false;
  const vokal = (huruf.match(/[aeiouAEIOU]/g) || []).length;
  // Ambang 1/3: baris pendek yang sepertiga hurufnya saja bukan vokal
  // hampir pasti rácak OCR ("m5 Om>", "Glsd VeIdiiVUl"). Batas 24 karakter
  // menjaga kalimat sungguhan tidak pernah masuk sini, dan yang dibuang
  // tetap DICATAT supaya admin bisa melihat apa yang dibuang.
  return vokal / huruf.length < 0.34 && baris.trim().length <= 24;
}

function barisTerpotong(baris) {
  const t = baris.trim();
  if (t.length < 20) return false;
  return !PUNCAKUS_AKHIR.test(t) && /[a-zA-Z]$/.test(t);
}

/**
 * Bersihkan satu bidang teks (teks soal / opsi / bacaan / pembahasan).
 * @param {string} teks
 * @returns {{teks: string, catatan: string[]}}
 */
export function bersihkanOcrTeks(teks) {
  const catatan = [];
  const asli = String(teks ?? '');
  if (!asli.trim()) return { teks: asli, catatan };

  const baris = asli.split(/\n/);
  const sisa = [];
  let buangStruktural = 0;
  let potong = 0;

  for (const b of baris) {
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
  for (const opsi of daftarOpsi) {
    const o = normLong(opsi);
    if (o.length < 20) continue; // opsi terlalu pendek: risiko menghapus kalimat sah
    const t = normLong(teks);
    const idx = t.indexOf(o);
    if (idx === -1) continue;
    // Hapus dari teks ASLI: cari rentang karakter asli yang cocok secara
    // longgar dengan mengambil panjang yang sama di teks ternormalisasi
    // lalu memetakannya kembali -- lebih sederhana: hapus per baris gabung
    // yang normalisasinya MENGANDUNG atau SAMA dengan opsi.
    const baris = teks.split('\n');
    const sisaBaris = [];
    let buang = 0;
    for (const b of baris) {
      const nb = normLong(b);
      if (nb && (nb === o || nb.includes(o) || o.includes(nb) && nb.length >= 20)) {
        buang += 1;
        continue;
      }
      sisaBaris.push(b);
    }
    if (buang > 0) {
      teks = sisaBaris.join('\n');
      catatan.push(`salinan opsi jawaban dibuang dari teks soal (${buang} baris): "${String(opsi).slice(0, 60)}..."`);
      void idx;
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

export default { bersihkanOcrTeks, penandaiKualitasOcr, buangDuplikatOpsiDariTeks };
