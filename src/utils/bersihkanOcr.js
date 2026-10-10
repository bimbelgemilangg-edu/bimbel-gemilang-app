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

  return { teks: sisa.join('\n').replace(/\n{3,}/g, '\n\n').trim(), catatan };
}

/**
 * Catatan kualitas satu butir soal utuh (dipakai badge preview impor).
 * @param {{teksSoal?: string, opsi?: Array, pembahasan?: string}} q
 * @returns {string[]}
 */
export function penandaiKualitasOcr({ teksSoal = '', opsi = [], pembahasan = '' } = {}) {
  const catatan = [];
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

export default { bersihkanOcrTeks, penandaiKualitasOcr };
